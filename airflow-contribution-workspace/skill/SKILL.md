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
test -f /.dockerenv && echo "BREEZE=${BREEZE}"
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

Static checks (host only)
-------------------------

_Source: `contributing-docs/08_static_code_checks.rst`_

These commands are kept in the contributing docs and synced into the airflow-contribution skill. Use them for host-side validation before broader test execution.

| Task | Command | Notes |
|------|---------|-------|
| Install prek | `uv tool install prek` | Bootstrap the local static-check tooling. |
| Enable commit hooks | `prek install` | Install local hooks before using the regular contributor flow. |
| Run ruff lint from the target branch | `prek run ruff --from-ref <target_branch>` | Targeted lint pass for changed files. |
| Run ruff format from the target branch | `prek run ruff-format --from-ref <target_branch>` | Targeted formatting pass for changed files. |
| Run regular fast static checks | `prek run --from-ref <target_branch> --stage pre-commit` | Standard fast validation before pushing a PR. |
| Run slower manual static checks | `prek run --from-ref <target_branch> --stage manual` | Broader validation used before pushing or when requested. |
| Format a single Python file | `uv run ruff format <file>` | Apply formatting directly to a modified Python file. |
| Fix lint issues in a single Python file | `uv run ruff check --fix <file>` | Run immediately after formatting a modified Python file. |

Targeted test commands
----------------------

_Source: `contributing-docs/testing/unit_tests.rst`_

Prefer these commands when iterating on a specific test, file, or package. Use host-side uv commands when the target can run locally, and fall back to Breeze if local execution is blocked by system dependencies or required services.

| Task | Command | Notes |
|------|---------|-------|
| Run a single test method or case | `uv run --project <PROJECT> pytest path/to/test.py::TestClass::test_method -xvs` | Use for the narrowest host-side iteration loop. |
| Run a single test file | `uv run --project <PROJECT> pytest path/to/test.py -xvs` | Use when the whole file is the smallest useful validation unit. |
| Run all tests in a package or folder | `uv run --project <PROJECT> pytest path/to/package -xvs` | Use when a change spans a small package or mirrored test folder. |
| Retry a targeted run in Breeze | `breeze run pytest <tests> -xvs` | Use when uv fails because of missing system libraries or services. |
| Run scripts tests | `uv run --project scripts pytest scripts/tests/ -xvs` | Use for changes under scripts/ and scripts/tests/. |

Breeze suite commands
---------------------

_Source: `contributing-docs/testing/unit_tests.rst`_

Use these Breeze orchestrated commands for parallel or environment-heavy test runs that go beyond a single targeted host-side pytest invocation.

| Task | Command | Notes |
|------|---------|-------|
| Run all core tests in parallel | `breeze testing core-tests --run-in-parallel` | Use for broad core validation. |
| Run only core DB tests in parallel | `breeze testing core-tests --run-db-tests-only --run-in-parallel` | Use when the change affects DB-backed core behavior. |
| Run only core non-DB tests with xdist | `breeze testing core-tests --skip-db-tests --use-xdist` | Use for broader non-DB core validation. |
| Run all provider tests in parallel | `breeze testing providers-tests --run-in-parallel` | Use for provider-wide changes or provider CI parity. |
| Run a single provider suite | `breeze testing providers-tests --test-type "Providers[<name>]"` | Use when a change is limited to one provider package. |
| Run Helm tests | `breeze testing helm-tests --use-xdist` | Use for chart and Helm-related changes. |
| Run Task SDK tests | `breeze testing task-sdk-tests` | Use for task-sdk scoped validation. |
| Run airflow-ctl tests | `breeze testing airflow-ctl-tests` | Use for airflow-ctl changes. |

Change-scoped validation
------------------------

_Source: `contributing-docs/05_pull_requests.rst`_

Use these commands to scope validation to the current change before deciding which tests or checks to run.

| Task | Command | Notes |
|------|---------|-------|
| Determine affected test suites from a squashed change | `breeze selective-checks --commit-ref <commit_sha>` | Use after identifying the commit or squashed diff to scope CI-like validation. |
| Run the standard fast static gate before pushing | `prek run --from-ref <target_branch> --stage pre-commit` | Required local quality gate before opening or updating a PR. |
| Run the slower manual gate before pushing | `prek run --from-ref <target_branch> --stage manual` | Broader local validation expected before sending for review. |

Command Sources
---------------

The generated command sections above were sourced from:

- `contributing-docs/05_pull_requests.rst`
- `contributing-docs/08_static_code_checks.rst`
- `contributing-docs/testing/unit_tests.rst`
