<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

---

name: airflow-contribution
description: >
  Verify Apache Airflow contributions and choose the right validation commands.
  Use when deciding between host and Breeze, selecting static checks, or choosing
  the right subset of tests for a change in the Airflow repo.
compatibility: Requires git, uv, and Apache Airflow Breeze

---

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

Airflow Contribution Skill
==========================

This skill is a workflow and routing aid for contribution validation.

The contributing docs are the single source of truth for commands in this skill.
If this skill conflicts with repository documentation, follow the contributing docs.

Environment Detection
---------------------

Before picking a test command, determine whether you are on the host or already inside a Breeze container:

```bash
test -f /.dockerenv && echo "BREEZE=$${BREEZE}"
```

- `BREEZE=true`: you are inside Breeze and can run `pytest` directly when the docs call for it.
- Anything else: you are on the host and should use the synced command reference below.

Workflow
--------

Use this workflow before running validation commands:

1. Read the changed files and map them to the relevant package or test area.
2. Inspect the target test file for markers such as `db_test`, `backend`, `integration`, `system`, `platform`, and `need_serialized_dag`.
3. Prefer the narrowest command that matches the change.
4. Use host `uv`-based commands when the docs indicate the test can run locally.
5. Switch to Breeze commands when the docs require additional services, specific backends, or full-suite orchestration.
6. Run static checks on the host unless the docs explicitly require otherwise.

Synced Command Reference
------------------------

<!--
Generated from contributing docs by scripts/ci/prek/generate_skills.py.
Do not edit the command sections below manually.
-->

$generated_command_sections

Command Sources
---------------

The generated command sections above were sourced from:

$generated_source_list
