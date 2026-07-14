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
"""Prepare the frozen known-bad Airflow state for the MCP-usefulness eval.

Copies the fixture Dag (a port of apache/airflow#39801 to the Airflow 3 SDK)
into Breeze's dags folder, triggers one run with a fixed run_id, waits for it
to finish, and verifies the buggy outcome (``a_end`` skipped before its
mapped task group expanded) is present. Every eval arm and repeat then
observes this same frozen state read-only, so the fixture only needs to be
prepared once per Breeze session.

Requires a running Breeze Airflow (``breeze start-airflow``). Talks only to
the REST API on the host-forwarded port — nothing runs on the host itself.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DAG = Path(__file__).resolve().parent / "dags" / "media_asset_pipeline.py"
BREEZE_DAGS_DIR = REPO_ROOT / "files" / "dags"

# Deliberately neutral names: the Dag file, dag_id, and run_id must not hint
# at the underlying issue (#39801) — a model that recognises the issue number
# could shortcut the diagnosis instead of investigating.
DAG_ID = "media_asset_pipeline"
RUN_ID = "frozen_debug_run"
CULPRIT_TASK_ID = "process_items.a_process.a_end"

API_URL = os.environ.get("AIRFLOW_API_URL", "http://localhost:28080").rstrip("/")
USERNAME = os.environ.get("AIRFLOW_USERNAME", "admin")
PASSWORD = os.environ.get("AIRFLOW_PASSWORD", "admin")

PARSE_TIMEOUT = 420  # dag_dir_list_interval can be up to 5 minutes
RUN_TIMEOUT = 300
POLL_INTERVAL = 5


def call_api(method: str, path: str, token: str | None = None, body: dict | None = None) -> tuple[int, dict]:
    request = urllib.request.Request(f"{API_URL}{path}", method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(request, data=data, timeout=30) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as err:
        payload = err.read().decode(errors="replace")
        try:
            return err.code, json.loads(payload)
        except ValueError:
            return err.code, {"detail": payload}
    except urllib.error.URLError as err:
        print(
            f"Error: cannot reach the Airflow API at {API_URL} ({err.reason}).\n"
            "Start Breeze first:  breeze start-airflow",
            file=sys.stderr,
        )
        sys.exit(1)


def fetch_token() -> str:
    status, payload = call_api("POST", "/auth/token", body={"username": USERNAME, "password": PASSWORD})
    if status != 201:
        print(f"Error: authentication failed (HTTP {status}): {payload}", file=sys.stderr)
        sys.exit(1)
    return payload["access_token"]


def copy_fixture_dag() -> None:
    BREEZE_DAGS_DIR.mkdir(parents=True, exist_ok=True)
    dest = BREEZE_DAGS_DIR / FIXTURE_DAG.name
    if dest.exists() and dest.read_bytes() == FIXTURE_DAG.read_bytes():
        print(f"Fixture Dag already in place: {dest.relative_to(REPO_ROOT)}")
        return
    shutil.copy2(FIXTURE_DAG, dest)
    print(f"Copied fixture Dag to {dest.relative_to(REPO_ROOT)}")


def wait_for_dag_parsed(token: str) -> None:
    print(f"Waiting for the Dag processor to pick up '{DAG_ID}' (up to {PARSE_TIMEOUT}s) ...")
    deadline = time.monotonic() + PARSE_TIMEOUT
    while time.monotonic() < deadline:
        status, payload = call_api("GET", f"/api/v2/dags/{DAG_ID}", token)
        if status == 200:
            print(f"  parsed (is_paused={payload.get('is_paused')})")
            return
        time.sleep(POLL_INTERVAL)
    print(
        f"Error: '{DAG_ID}' did not appear within {PARSE_TIMEOUT}s. Check the"
        " dag-processor logs in Breeze and files/dags/ mounting.",
        file=sys.stderr,
    )
    sys.exit(1)


def unpause_dag(token: str) -> None:
    status, payload = call_api("PATCH", f"/api/v2/dags/{DAG_ID}", token, body={"is_paused": False})
    if status != 200:
        print(f"Error: failed to unpause the Dag (HTTP {status}): {payload}", file=sys.stderr)
        sys.exit(1)


def get_existing_run(token: str) -> dict | None:
    status, payload = call_api("GET", f"/api/v2/dags/{DAG_ID}/dagRuns/{RUN_ID}", token)
    return payload if status == 200 else None


def trigger_run(token: str) -> None:
    status, payload = call_api(
        "POST",
        f"/api/v2/dags/{DAG_ID}/dagRuns",
        token,
        body={"dag_run_id": RUN_ID, "logical_date": None},
    )
    if status != 200:
        print(f"Error: failed to trigger the run (HTTP {status}): {payload}", file=sys.stderr)
        sys.exit(1)
    print(f"Triggered run '{RUN_ID}'")


def wait_for_run_terminal(token: str) -> str:
    deadline = time.monotonic() + RUN_TIMEOUT
    while time.monotonic() < deadline:
        run = get_existing_run(token)
        state = (run or {}).get("state")
        if state in ("success", "failed"):
            return state
        time.sleep(POLL_INTERVAL)
    print(f"Error: run '{RUN_ID}' did not finish within {RUN_TIMEOUT}s.", file=sys.stderr)
    sys.exit(1)


def verify_known_bad_state(token: str) -> None:
    """Fail unless the buggy outcome from #39801 is present in the frozen run.

    The eval is meaningless without it: if the bug is fixed on this branch (or
    the race did not fire), there is nothing for the MCP arm to observe.
    """
    status, payload = call_api(
        "GET", f"/api/v2/dags/{DAG_ID}/dagRuns/{RUN_ID}/taskInstances?limit=100", token
    )
    if status != 200:
        print(f"Error: failed to list task instances (HTTP {status}): {payload}", file=sys.stderr)
        sys.exit(1)
    instances = payload.get("task_instances", [])
    by_task: dict[str, list[str]] = {}
    for ti in instances:
        by_task.setdefault(ti["task_id"], []).append(ti.get("state"))

    culprit_states = by_task.get(CULPRIT_TASK_ID, [])
    if "skipped" not in culprit_states:
        print(
            f"Error: expected '{CULPRIT_TASK_ID}' to be skipped (the #39801 bug), but its"
            f" states are {culprit_states or 'absent'}.\n"
            "The bug did not reproduce — the run may predate the fixture, or the bug is"
            f" fixed on this branch. Delete the run and retry:\n"
            f"  DELETE {API_URL}/api/v2/dags/{DAG_ID}/dagRuns/{RUN_ID}",
            file=sys.stderr,
        )
        sys.exit(1)

    print()
    print("Frozen known-bad state is ready:")
    for task_id in sorted(by_task):
        print(f"  {task_id}: {', '.join(str(s) for s in by_task[task_id])}")
    print()
    print(f"  dag_id: {DAG_ID}")
    print(f"  run_id: {RUN_ID}")
    print(f"  culprit: {CULPRIT_TASK_ID} skipped before its mapped task group expanded")


def main() -> int:
    copy_fixture_dag()
    token = fetch_token()
    wait_for_dag_parsed(token)
    unpause_dag(token)

    run_info = get_existing_run(token)
    if run_info is None:
        trigger_run(token)
        print(f"Run finished with state: {wait_for_run_terminal(token)}")
    else:
        existing_state = run_info.get("state")
        print(f"Run '{RUN_ID}' already exists (state: {existing_state})")
        if existing_state not in ("success", "failed"):
            print(f"Run finished with state: {wait_for_run_terminal(token)}")

    verify_known_bad_state(token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
