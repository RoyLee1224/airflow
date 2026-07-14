<!--
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Skill-Eval Harness](#skill-eval-harness)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
  - [Cleanup](#cleanup)
  - [Adding cases](#adding-cases)
  - [How it works](#how-it-works)
  - [Eval-run hash gate](#eval-run-hash-gate)
- [MCP-usefulness eval](#mcp-usefulness-eval)
  - [Prerequisites](#prerequisites-1)
  - [Running](#running)
  - [Reading the results](#reading-the-results)
  - [Scope](#scope)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Skill-Eval Harness

Test whether changes to `AGENTS.md` break or improve agent decisions.
The harness compares the `main` branch version against your working
tree, running the same cases against both and reporting the diff.

Each arm is a **git worktree** of the real repo — the agent sees
actual source files (`pyproject.toml`, directory structure, etc.).
The only difference between arms is which `AGENTS.md` is present.

The agent reads guidance through the `CLAUDE.md → AGENTS.md` symlink,
so the harness verifies that symlink exists (in the working tree and
on the base branch) before running and aborts if it is broken — a
regular-file CLAUDE.md would make every arm read identical guidance.

## Prerequisites

- **Authentication** (one of):
  - Claude Code session (`claude /login`) — Pro/Max subscription
  - `ANTHROPIC_API_KEY` environment variable — API credits

That's it — prek provisions Node, promptfoo, and the Claude Agent SDK
automatically.

## Usage

```bash
# Run the eval (single pass over all cases — satisfies the hash gate).
# Stage your changes first — prek stashes unstaged edits:
prek run run-skill-eval --hook-stage manual --all-files

# Repeat each case to reduce nondeterminism:
EVAL_REPEAT=3 prek run run-skill-eval --hook-stage manual --all-files

# Add a baseline arm (no AGENTS.md) to measure raw model capability:
EVAL_FULL=1 prek run run-skill-eval --hook-stage manual --all-files

# Use a cheaper model for fast iteration:
MODEL=claude-haiku-4-5-20251001 prek run run-skill-eval --hook-stage manual --all-files

# Test a skill alongside AGENTS.md (not combinable with EVAL_FULL — the
# baseline arm has no skill, so the skill-used assertion would always fail):
SKILL_NAME=airflow-contribution prek run run-skill-eval --hook-stage manual --all-files

# View results in browser (Ctrl-C to stop the server):
prek run view-skill-eval --hook-stage manual --all-files
```

Other promptfoo flags (`--filter*`, `--no-cache`) are argv-only —
`prek run` can't forward arguments, so wire them as fixed entry args
on a hook variant if a preset is needed.

A run with `--filter*` flags covers only a subset of cases, so it does
not update the hash file.

Each run also writes a JSON report to `files/skill-evals/results.json`
(per the `files/` output convention) — handy for pasting results into
a PR.

## Cleanup

Everything the harness stores lives inside the repo — nothing is left
in your home directory:

```bash
rm -rf .build/promptfoo   # eval history and cache
prek clean                # prek-provisioned node envs
```

## Adding cases

Cases live in `cases/*.yaml`. Add entries to an existing file or
create a new one — no config changes needed.

```yaml
- description: "Scheduler bugfix (#64322): no newsfragment"
  vars:
    request: |
      I fixed the scheduler to skip asset-triggered Dags that don't
      have a SerializedDagModel yet.
      Should I create a newsfragment?
  assert:
    - type: javascript
      value: 'output.should_create === false'
```

The agent returns structured JSON (`{should_create, type, rationale}`).
Use `output.should_create` directly in assertions.

## How it works

1. Creates git worktrees — one with `main`'s AGENTS.md, one with
   your working tree version. Both are full repo checkouts.
2. Generates a [promptfoo](https://github.com/promptfoo/promptfoo)
   config with `anthropic:claude-agent-sdk` provider and
   `output_format: json_schema` for structured output.
3. Runs each case against all arms in parallel.
4. Reports pass/fail diff. Worktrees cleaned up on exit.

## Eval-run hash gate

After every completed run, `eval.py` records a hash of its inputs
(`AGENTS.md` + `cases/*.yaml`) in `last-eval-hash.txt`. The
`check-eval-hash` prek hook — enforced locally and in CI — recomputes
the hash and fails when guidance changed without a re-run. Commit the
updated hash file together with your change.

- The hash proves the eval **ran** on this exact content, not that all
  cases passed (some cases fail even on `main` — that is signal, not a
  defect).
- WIP commits: `SKIP=check-eval-hash git commit ...` — CI stays red
  until the eval is re-run.
- Can't run the eval (no Claude subscription or API key)? Ask a
  maintainer to run it and push the updated hash file to your PR branch.
- `SKILL.md` files are not covered by the gate yet — there are no skill
  cases, so a hash over them would prove nothing. Extend
  `compute_guidance_hash` in `scripts/ci/prek/check_eval_hash.py` when
  per-skill cases land.

# MCP-usefulness eval

`eval_mcp.py` answers a different question with the same machinery:
**does giving the agent runtime observation via MCP tools measurably
improve its diagnosis of a live Airflow problem?** It A/B-tests two
arms that differ only in tool access:

- `with_mcp` — read-only file tools **plus** the Airflow dev MCP
  server's tools (runtime observation).
- `no_mcp` — read-only file tools only (static reasoning).

Neither arm gets Bash, so the no-MCP arm cannot reach the API
out-of-band — the only variable is MCP tool access. Both arms observe
the same **frozen known-bad state**: a Dag run reproducing
[#39801](https://github.com/apache/airflow/issues/39801) (a task with
the `none_failed_min_one_success` trigger rule skipped before its
mapped task group expands), prepared once per Breeze session and then
only read.

To keep the experiment honest, the arms work in a **clean worktree**
(repo at HEAD with `dev/skill-evals/` removed — the case asserts and
fixture provenance would leak the expected answer to any arm that can
Grep the checkout), and the fixture uses deliberately **neutral names**
(`media_asset_pipeline`, `frozen_debug_run` — no issue number a model
could recognise from training data). The deployed Dag sits at
`files/dags/media_asset_pipeline.py` in the worktree, the same path it
occupies in the live Breeze instance.

This suite is manual-only and independent of the AGENTS.md hash gate —
it needs a live Airflow, so it never runs in CI and never touches
`last-eval-hash.txt`.

## Prerequisites

1. **A running Breeze Airflow** — `breeze start-airflow` (API on
   `localhost:28080`).
2. **An Airflow dev MCP server**, strictly read-only, reachable at
   `$AIRFLOW_MCP_URL` (default `http://localhost:28081/mcp`). Until
   [PR #69381](https://github.com/apache/airflow/pull/69381) merges,
   run it from that branch:

   ```bash
   AIRFLOW_MCP_ALLOW_WRITES=false \
     uvx --from 'git+https://github.com/shahar1/airflow@dev-internal-mcp-server#subdirectory=dev/mcp_server' \
     airflow-dev-mcp --transport http --port 28081
   ```

   Keep writes disabled — the eval relies on the frozen fixture state
   staying untouched (the harness also deny-lists the write tools
   client-side, as belt and suspenders).
3. **The frozen fixture** — copies the fixture Dag into `files/dags/`,
   triggers one run with a fixed `run_id`, and verifies the buggy
   outcome is present:

   ```bash
   ./dev/skill-evals/mcp/prepare_fixture.py
   ```

4. Authentication, as for the main harness (Claude Code session or
   `ANTHROPIC_API_KEY`).

## Running

```bash
# Stage your changes first — prek stashes unstaged edits:
EVAL_REPEAT=8 prek run run-skill-eval-mcp --hook-stage manual --all-files
```

Agentic debugging is high-variance — use a much larger `EVAL_REPEAT`
than the classification cases need (8–10 rather than 3) and read
medians, not single runs. `EVAL_MCP_MAX_TURNS` (default 30) bounds a
wandering agent; it applies to both arms equally.

## Reading the results

The run prints a per-arm table — pass rate plus median turns, seconds,
and tokens — and writes the full report to
`files/skill-evals/mcp-results.json`. The interesting comparisons:

- **pass rate** — did runtime observation change *whether* the agent
  found the root cause?
- **median turns / seconds** — did it shorten the *path* to it?

A case passes when the structured diagnosis names the culprit task and
the root cause mentions both the trigger rule and the pre-expansion
mechanism (see the asserts in `mcp/cases/diagnose_39801.yaml`).

## Scope

This suite measures **usefulness** (does a tool/prompt change agent
behaviour?), not **safety** (secret redaction, RBAC, rate limiting) —
safety belongs to contract/unit tests, not behavioural A/B. Cases
state only the observable symptom, never the mechanism, so the arms
must find the cause themselves.
