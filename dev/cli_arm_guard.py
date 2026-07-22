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
"""PreToolUse guard for the CLI eval arm — snapshot confinement (prevention).

Baked into the snapshot at <snapshot>/.claude/hooks/cli_arm_guard.py and wired
as a PreToolUse hook in <snapshot>/.claude/settings.json. Lets the CLI arm
observe runtime (airflow CLI / curl against the Breeze API) but blocks reads
that reach the answer key (dev/skill-evals) or the real host checkout by
absolute path. Pairs with the post-run isolation tripwire (detection).

Claude Code hook contract: reads the tool call as JSON on stdin. Exit 0 =
allow; exit 2 = block (stderr is fed back to the model as the reason).
Allowlist, not denylist: anything not explicitly permitted is blocked.

ARM_ROOT is derived from this file's own location, so no env threading:
<snapshot>/.claude/hooks/cli_arm_guard.py  ->  ARM_ROOT = <snapshot>.
"""

from __future__ import annotations

import json
import os
import shlex
import sys
from pathlib import Path

ARM_ROOT = Path(__file__).resolve().parents[2]
API_HOST = os.environ.get("CLI_ARM_API_HOST", "localhost:28080")

SHELL_META = (";", "|", "&", "$(", "`", ">", "<", "\n", "&&", "||")
FILE_TOOLS = {"Read", "Grep", "Glob"}


def block(reason: str) -> None:
    print(f"CLI-arm guard blocked this call: {reason}", file=sys.stderr)
    sys.exit(2)


def path_inside_snapshot(raw: str) -> bool:
    if not raw:
        return True
    p = Path(raw)
    if not p.is_absolute():
        return True  # relative paths resolve under cwd = snapshot
    try:
        p.resolve().relative_to(ARM_ROOT)
        return True
    except ValueError:
        return False


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        block("unparsable tool call")
    name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if name in FILE_TOOLS:
        for key in ("file_path", "path", "pattern"):
            if not path_inside_snapshot(str(tool_input.get(key) or "")):
                block(f"{name} path escapes the snapshot")
        sys.exit(0)

    if name == "Bash":
        cmd = str(tool_input.get("command") or "")
        if any(tok in cmd for tok in SHELL_META):
            block("shell metacharacters are not allowed in the CLI arm")
        try:
            argv = shlex.split(cmd)
        except ValueError:
            block("unparsable command")
        if not argv:
            block("empty command")
        head = Path(argv[0]).name
        if head == "airflow":
            sys.exit(0)
        if head == "curl":
            if not any(API_HOST in a for a in argv[1:]):
                block(f"curl is restricted to the Breeze API ({API_HOST})")
            if any(a.startswith("file://") for a in argv[1:]):
                block("file:// is not allowed")
            sys.exit(0)
        block(f"'{head}' is not on the CLI-arm allowlist (airflow, curl->API only)")

    # Non-file, non-Bash tools (e.g. the SDK's structured-output tool) pass;
    # the provider's disallowed_tools already denies Write/Edit/Task/etc.
    sys.exit(0)


if __name__ == "__main__":
    main()
