#!/usr/bin/env python3
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
# /// script
# requires-python = ">=3.9"
# ///
"""MCP-usefulness eval: does runtime observation via MCP tools improve agent diagnosis?

A/B-tests the same diagnosis task across two arms that differ only in tool
access:

- ``with_mcp`` — read-only file tools plus the Airflow dev MCP server tools
  (runtime observation of the live Breeze instance).
- ``no_mcp``  — read-only file tools only (static reasoning over the repo).

Escape tools (Bash, subagents, web, writes) are explicitly denied in both
arms — deny beats any ambient allowlist — so the no-MCP arm cannot reach the
API out-of-band and the only variable is MCP tool access. Both arms work in
the same clean snapshot (``git archive`` export at HEAD, no .git, minus
dev/skill-evals whose case asserts would leak the answer) and observe the
same frozen known-bad Airflow state prepared by ``mcp/prepare_fixture.py``.

Prerequisites (see mcp/README section in README.md):
  1. breeze start-airflow            (Airflow API on :28080)
  2. an Airflow dev MCP server on $AIRFLOW_MCP_URL, STRICTLY READ-ONLY
     (AIRFLOW_MCP_ALLOW_WRITES=false) so no arm can mutate the fixture
  3. ./dev/skill-evals/mcp/prepare_fixture.py

Usage:
    prek run run-skill-eval-mcp --hook-stage manual --all-files

Env knobs: MODEL, EVAL_REPEAT, AIRFLOW_MCP_URL, EVAL_MCP_MAX_TURNS.
This suite is independent of the AGENTS.md guidance gate — it never touches
last-eval-hash.txt.
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import statistics
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(SCRIPT_DIR / "mcp"))

from eval import (  # noqa: E402
    PROMPTFOO_STATE_DIR,
    PROMPTFOO_VERSION,
    REPO_ROOT,
    find_sdk_modules,
)
from prepare_fixture import (  # noqa: E402
    CULPRIT_TASK_ID,
    DAG_ID,
    FIXTURE_DAG,
    RUN_ID,
    fetch_token,
    get_existing_run,
)

MCP_CASES_DIR = SCRIPT_DIR / "mcp" / "cases"
RESULTS_FILE = REPO_ROOT / "files" / "skill-evals" / "mcp-results.json"

MCP_SERVER_NAME = "airflow-dev"
MCP_URL = os.environ.get("AIRFLOW_MCP_URL", "http://localhost:28081/mcp")

# Tools that would let an arm escape its isolation: Bash reaches the live
# instance out-of-band (CLI, curl) and arbitrary git; subagents inherit and
# multiply that surface; web tools could look up the original issue; write
# tools could tamper with the snapshot.
ESCAPE_TOOLS = ["Bash", "Task", "WebFetch", "WebSearch", "Write", "Edit", "NotebookEdit"]

# Client-side belt-and-suspenders on top of the server's read-only mode: even
# if the MCP server was started with writes enabled, the agent cannot mutate
# the frozen fixture state mid-eval.
MCP_WRITE_TOOLS = [
    f"mcp__{MCP_SERVER_NAME}__trigger_dag_run",
    f"mcp__{MCP_SERVER_NAME}__set_dag_paused",
    f"mcp__{MCP_SERVER_NAME}__clear_task_instances",
    f"mcp__{MCP_SERVER_NAME}__airflow_api_call",
]

OUTPUT_FORMAT = {
    "type": "json_schema",
    "schema": {
        "type": "object",
        "required": ["culprit_task_id", "root_cause", "evidence"],
        "additionalProperties": False,
        "properties": {
            "culprit_task_id": {"type": "string"},
            "root_cause": {"type": "string"},
            "evidence": {"type": "string"},
            "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
        },
    },
}


def check_mcp_endpoint_listening() -> None:
    """Fail fast when nothing listens on the MCP URL — promptfoo would otherwise
    burn every with_mcp result on connection errors."""
    parsed = urllib.parse.urlparse(MCP_URL)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    try:
        with socket.create_connection((parsed.hostname, port), timeout=3):
            pass
    except OSError as err:
        print(
            f"Error: no MCP server listening at {MCP_URL} ({err}).\n"
            "Start one against the Breeze API, strictly read-only, e.g.:\n"
            "  AIRFLOW_MCP_ALLOW_WRITES=false uvx --from <path-or-git-ref of dev/mcp_server> \\\n"
            "    airflow-dev-mcp --transport http --port 28081",
            file=sys.stderr,
        )
        sys.exit(1)


def check_fixture_ready() -> None:
    """Verify the frozen #39801 run exists before spending tokens on the eval."""
    token = fetch_token()
    run_info = get_existing_run(token)
    if run_info is None or run_info.get("state") not in ("success", "failed"):
        print(
            f"Error: frozen fixture run '{RUN_ID}' of '{DAG_ID}' not found (or not finished).\n"
            "Prepare it first:  ./dev/skill-evals/mcp/prepare_fixture.py",
            file=sys.stderr,
        )
        sys.exit(1)


def create_clean_snapshot(work_dir: Path) -> Path:
    """Export the repo at HEAD into a plain directory: no .git, minus this eval's files.

    Both arms share it (they only read; the variable is tool access). The
    dev/skill-evals tree is removed because the case asserts and the fixture
    provenance would leak the expected answer to any arm that can search the
    checkout. A `git archive` export (not a worktree) closes the second leak
    found in practice: a worktree's .git link reaches the main repo's object
    store, and an agent recovered the deleted answer files with
    `git show HEAD:...`. The deployed Dag is copied to files/dags/ — the same
    path it occupies in the live Breeze instance.
    """
    arm_dir = work_dir / "arm"
    arm_dir.mkdir()
    archive = subprocess.Popen(["git", "-C", str(REPO_ROOT), "archive", "HEAD"], stdout=subprocess.PIPE)
    extract = subprocess.run(["tar", "-x", "-C", str(arm_dir)], stdin=archive.stdout, check=False)
    archive.wait()
    if archive.returncode != 0 or extract.returncode != 0:
        print("Error: exporting the repo snapshot (git archive | tar) failed.", file=sys.stderr)
        sys.exit(1)

    shutil.rmtree(arm_dir / "dev" / "skill-evals", ignore_errors=True)
    deployed_dags = arm_dir / "files" / "dags"
    deployed_dags.mkdir(parents=True, exist_ok=True)
    shutil.copy2(FIXTURE_DAG, deployed_dags / FIXTURE_DAG.name)
    return arm_dir


def build_arm_provider(label: str, model: str, max_turns: int, working_dir: Path, with_mcp: bool) -> dict:
    config: dict = {
        "model": model,
        "apiKeyRequired": False,
        "setting_sources": ["project"],
        "working_dir": str(working_dir),
        "output_format": OUTPUT_FORMAT,
        "max_turns": max_turns,
        # Explicit denies, not merely "not allowed": the developer's own
        # settings.local.json allowlist leaks into the session and approved
        # Bash in a past run, letting the no-MCP arm query the live instance
        # via `breeze run airflow ...`. disallowed_tools wins over any allow.
        "disallowed_tools": list(ESCAPE_TOOLS),
    }
    if with_mcp:
        config["mcp"] = {"servers": [{"name": MCP_SERVER_NAME, "url": MCP_URL}]}
        config["append_allowed_tools"] = [f"mcp__{MCP_SERVER_NAME}"]
        config["disallowed_tools"] = list(ESCAPE_TOOLS) + MCP_WRITE_TOOLS
    return {"id": "anthropic:claude-agent-sdk", "label": label, "config": config}


def count_infra_errors(results_file: Path) -> int:
    """Count provider errors that are NOT the agent running out of turns.

    Hitting max_turns is a legitimate experimental outcome ("did not converge
    within budget") and shows up as a non-pass in the table; anything else
    (MCP connection refused, auth failure) is an infrastructure problem that
    invalidates the run.
    """
    try:
        results = json.loads(results_file.read_text())["results"]["results"]
    except (OSError, KeyError, ValueError):
        return 0
    count = 0
    for result in results:
        error = (result.get("response") or {}).get("error")
        if error and "maximum number of turns" not in str(error):
            count += 1
    return count


def summarize_results(results_file: Path) -> None:
    """Print the per-arm comparison table: success rate and effort medians."""
    try:
        results = json.loads(results_file.read_text())["results"]["results"]
    except (OSError, KeyError, ValueError):
        print("(no results to summarize)")
        return

    arms: dict[str, list[dict]] = {}
    for result in results:
        label = (result.get("provider") or {}).get("label") or "?"
        arms.setdefault(label, []).append(result)

    def collect_metric(rows: list[dict], *path: str) -> list[float]:
        values = []
        for row in rows:
            node = row.get("response") or {}
            for key in path:
                node = (node or {}).get(key) if isinstance(node, dict) else None
            if isinstance(node, (int, float)):
                values.append(float(node))
        return values

    def format_median(values: list[float]) -> str:
        return f"{statistics.median(values):.0f}" if values else "-"

    print()
    print(f"{'arm':<10} {'pass':>9} {'max-turns':>10} {'med turns':>10} {'med sec':>8} {'med tokens':>11}")
    for label in sorted(arms):
        rows = arms[label]
        passes = sum(1 for r in rows if r.get("success"))
        exhausted = sum(
            1 for r in rows if "maximum number of turns" in str((r.get("response") or {}).get("error") or "")
        )
        turns = collect_metric(rows, "metadata", "numTurns")
        seconds = [ms / 1000 for ms in collect_metric(rows, "metadata", "durationMs")]
        tokens = collect_metric(rows, "tokenUsage", "total")
        print(
            f"{label:<10} {passes:>4}/{len(rows):<4} {exhausted:>10} {format_median(turns):>10}"
            f" {format_median(seconds):>8} {format_median(tokens):>11}"
        )
    print()


def main() -> int:
    sdk_modules = find_sdk_modules()
    model = os.environ.get("MODEL", "claude-sonnet-4-6")
    max_turns_raw = os.environ.get("EVAL_MCP_MAX_TURNS", "30")
    if not max_turns_raw.isdigit() or int(max_turns_raw) < 1:
        print(f"Error: EVAL_MCP_MAX_TURNS must be a positive integer, got {max_turns_raw!r}", file=sys.stderr)
        return 1
    max_turns = int(max_turns_raw)

    promptfoo_args = list(sys.argv[1:])
    repeat = os.environ.get("EVAL_REPEAT")
    if repeat:
        if not repeat.isdigit() or int(repeat) < 1:
            print(f"Error: EVAL_REPEAT must be a positive integer, got {repeat!r}", file=sys.stderr)
            return 1
        promptfoo_args += ["--repeat", repeat]

    # Same order as the numbered prerequisites in the module docstring.
    check_fixture_ready()
    check_mcp_endpoint_listening()

    work_dir = Path(tempfile.mkdtemp())
    try:
        # promptfoo resolves the Claude Agent SDK from the config directory
        (work_dir / "node_modules").symlink_to(sdk_modules)

        arm_dir = create_clean_snapshot(work_dir)

        config = {
            "prompts": ["{{request}}"],
            "providers": [
                build_arm_provider("with_mcp", model, max_turns, arm_dir, with_mcp=True),
                build_arm_provider("no_mcp", model, max_turns, arm_dir, with_mcp=False),
            ],
            "defaultTest": {"options": {"disableVarExpansion": True}},
            "tests": f"file://{MCP_CASES_DIR}/*.yaml",
        }
        config_path = work_dir / "promptfooconfig.json"
        config_path.write_text(json.dumps(config, indent=2))

        print(f"Arms: with_mcp ({MCP_URL}) vs no_mcp — model: {model}, max_turns: {max_turns}")
        print(f"Fixture: {DAG_ID} / {RUN_ID} (culprit: {CULPRIT_TASK_ID})")
        print()

        PROMPTFOO_STATE_DIR.mkdir(parents=True, exist_ok=True)
        RESULTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            ["promptfoo", "eval", "-c", str(config_path), "--output", str(RESULTS_FILE), *promptfoo_args],
            check=False,
            env={**os.environ, "PROMPTFOO_CONFIG_DIR": str(PROMPTFOO_STATE_DIR)},
        )

        infra_errors = count_infra_errors(RESULTS_FILE)
        if infra_errors:
            print(f"\n{infra_errors} provider error(s) — check the MCP server and auth setup.")

        summarize_results(RESULTS_FILE)
        print(f"Results report: {RESULTS_FILE.relative_to(REPO_ROOT)}")
        print(
            f"View results: PROMPTFOO_CONFIG_DIR={PROMPTFOO_STATE_DIR.relative_to(REPO_ROOT)}"
            f" npx promptfoo@{PROMPTFOO_VERSION} view"
        )
        return result.returncode

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
