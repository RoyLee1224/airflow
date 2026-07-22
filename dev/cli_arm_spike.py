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
"""CLI-arm spike: same #39801 case as with_mcp/no_mcp, but the arm gets Bash
(airflow CLI / curl -> Breeze API) instead of MCP tools, snapshot-confined by
the PreToolUse guard. Answers: can plain CLI runtime access substitute for MCP?

Reuses eval_mcp's snapshot + tripwire. Run after the fixture + Breeze are up.
Standalone spike — not wired into the production harness yet.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DEV = Path(__file__).resolve().parent
sys.path.insert(0, str(DEV / "skill-evals"))
sys.path.insert(0, str(DEV / "skill-evals" / "mcp"))
import eval_mcp as E  # noqa: E402

GUARD_SRC = DEV / "cli_arm_guard.py"


def main() -> int:
    model = os.environ.get("MODEL", "claude-sonnet-4-6")
    max_turns = int(os.environ.get("EVAL_MCP_MAX_TURNS", "20"))
    E.check_fixture_ready()

    sdk_modules = E.find_sdk_modules()
    work_dir = Path(tempfile.mkdtemp())
    try:
        (work_dir / "node_modules").symlink_to(sdk_modules)
        arm_dir = E.create_clean_snapshot(work_dir)

        # Bake the confinement guard into the snapshot as a PreToolUse hook.
        hooks_dir = arm_dir / ".claude" / "hooks"
        hooks_dir.mkdir(parents=True, exist_ok=True)
        guard = hooks_dir / "cli_arm_guard.py"
        shutil.copy2(GUARD_SRC, guard)
        settings = {
            "hooks": {
                "PreToolUse": [
                    {"matcher": "*", "hooks": [{"type": "command", "command": f"python3 {guard}"}]}
                ]
            }
        }
        (arm_dir / ".claude" / "settings.json").write_text(json.dumps(settings, indent=2))

        # Optional cli_skill arm: deliver the answer-neutral API workflow as AGENTS.md,
        # the canonical runtime-neutral guidance file (Codex reads it directly; Claude
        # reads it via the CLAUDE.md -> AGENTS.md symlink, the harness convention). This
        # guarantees delivery — unlike the on-demand skills mechanism — and is a clean
        # single-variable add on top of the (guidance-stripped) snapshot.
        skill_md = os.environ.get("CLI_SKILL_MD")
        label = "cli"
        results_name = "cli-arm-results.json"
        if skill_md:
            content = Path(skill_md).read_text()
            if content.lstrip().startswith("---"):
                content = content.split("---", 2)[-1].strip()
            (arm_dir / "AGENTS.md").write_text(content)
            (arm_dir / "CLAUDE.md").unlink(missing_ok=True)
            (arm_dir / "CLAUDE.md").symlink_to("AGENTS.md")
            label = "cli_skill"
            results_name = "cli-skill-results.json"
        results_file = E.REPO_ROOT / "files" / "skill-evals" / results_name

        # CLI arm: allow Bash (+ read-only file tools); keep every other escape denied.
        cli_disallowed = [t for t in E.ESCAPE_TOOLS if t != "Bash"]
        cli_config = {
            "model": model,
            "apiKeyRequired": False,
            "setting_sources": ["project"],
            "working_dir": str(arm_dir),
            "output_format": E.OUTPUT_FORMAT,
            "max_turns": max_turns,
            "append_allowed_tools": ["Read", "Grep", "Glob", "Bash"],
            "disallowed_tools": cli_disallowed,
        }
        provider = {"id": "anthropic:claude-agent-sdk", "label": label, "config": cli_config}
        config = {
            "prompts": ["{{request}}"],
            "providers": [provider],
            "defaultTest": {"options": {"disableVarExpansion": True}},
            "tests": f"file://{E.MCP_CASES_DIR}/*.yaml",
        }
        config_path = work_dir / "promptfooconfig.json"
        config_path.write_text(json.dumps(config, indent=2))

        print(f"{label} arm (snapshot-confined) vs #39801 — model: {model}, max_turns: {max_turns}")
        E.PROMPTFOO_STATE_DIR.mkdir(parents=True, exist_ok=True)
        results_file.parent.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            ["promptfoo", "eval", "-c", str(config_path), "--output", str(results_file)],
            check=False,
            env={**os.environ, "PROMPTFOO_CONFIG_DIR": str(E.PROMPTFOO_STATE_DIR)},
        )

        breaches = E.find_isolation_breaches(results_file)
        if breaches:
            print("\nISOLATION BREACH — discard this run:")
            for b in breaches:
                print(f"  {b}")
        else:
            print("\nNo isolation breach detected.")
        print(f"Results: {results_file.relative_to(E.REPO_ROOT)}")
        return result.returncode
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
