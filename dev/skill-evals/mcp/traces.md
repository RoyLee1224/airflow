<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [MCP-Usefulness Eval — Four-Arm Traces (#39801)](#mcp-usefulness-eval--four-arm-traces-39801)
  - [with_mcp — 10 turns / 27.8k](#with_mcp--10-turns--278k)
  - [cli_skill — 7 turns / 27.4k / 4 Bash](#cli_skill--7-turns--274k--4-bash)
  - [cli (bare) — 28 turns / 54.7k / 14 Bash](#cli-bare--28-turns--547k--14-bash)
  - [no_mcp — hit the 20-turn wall, no answer](#no_mcp--hit-the-20-turn-wall-no-answer)
  - [Reading](#reading)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# MCP-Usefulness Eval — Four-Arm Traces (#39801)

Sealed A/B on a real bug (apache/airflow#39801): a `NONE_FAILED_MIN_ONE_SUCCESS`
task inside a mapped task group is skipped before the group expands; the run
shows `success` while downstream tasks silently never run. Each arm gets the
same frozen run and the same prompt (symptom only); the only variable is tool
access. Scored by 3 asserts (name `a_end`, cite the trigger rule, cite
expansion timing). Model `claude-sonnet-4-6`, `max_turns=20`, n=1.

| arm | pass | turns | tokens | breach |
|---|---|---|---|---|
| with_mcp | 3/3 | 10 | 27.8k | — |
| cli_skill | 3/3 | 7 | 27.4k | none |
| cli (bare) | 3/3 | 28 | 54.7k | none |
| no_mcp | fail (hit turn wall) | — | — | — |

All arms produced the same forensic evidence when they solved it: `a_end` was
set SKIPPED ~26 ms **before** its upstream `a_start` was even scheduled
(`map_index=-1`, `try_number=0`, no hostname/pid) — a causal inversion visible
only at runtime, not derivable from source.

---

## with_mcp — 10 turns / 27.8k

Curated MCP tools; collapses multi-step inspection into one call.

```
ToolSearch                              (on-demand MCP schema load)
mcp__airflow-dev__get_dag_source
mcp__airflow-dev__list_task_instances
mcp__airflow-dev__get_task_instance ×2
mcp__airflow-dev__get_task_log
mcp__airflow-dev__diagnose_dag_run      (one-call diagnosis)
StructuredOutput
```

## cli_skill — 7 turns / 27.4k / 4 Bash

Bash+curl + an answer-neutral API-workflow doc delivered via AGENTS.md
(`CLAUDE.md → AGENTS.md` symlink). Goes straight to the answer, zero discovery.

```
curl -s http://localhost:28080/auth/token -X POST -d '{"username":"admin",...}'
TOKEN="eyJ..."                          (store token)
TOKEN="eyJ..."
curl -s http://localhost:28080/api/v2/dags/.../dagRuns/.../taskInstances  (Bearer)
```

## cli (bare) — 28 turns / 54.7k / 14 Bash

Same access as cli_skill but **no doc**. Half the Bash calls are pure
discovery/auth friction — the exact overhead a doc (or MCP's auto-JWT) removes.

```
ls <snapshot>/                          }
airflow dags show media_asset_pipeline  } orienting
curl :8080  /api/v1  -u admin:admin     ← wrong port
curl :8080  /api/v2  -u admin:admin     ← wrong port
curl :28080 /api/v1  -u admin:admin     ← wrong API version
curl :28080 /api/v2  -u admin:admin     ← right, but basic auth → 401
curl :28080 /auth/token  -X POST        ← FINALLY discovers JWT (call 8)
curl ... -H "Authorization: Bearer ..." ×5   ← productive from here
```

## no_mcp — hit the 20-turn wall, no answer

Read-only file tools only. Reached the right source files but static reasoning
can't confirm *which task's recorded state was wrong* without observing the run.

```
Grep ×17, Read ×11, Glob ×3
  read: files/dags/media_asset_pipeline.py
        task-sdk/.../bases/branch.py, skipmixin.py
        airflow-core/.../ti_deps/deps/trigger_rule_dep.py
        airflow-core/.../ti_deps/deps/not_previously_skipped_dep.py
        airflow-core/.../ti_deps/deps/mapped_task_expanded.py
  grep: NONE_FAILED_MIN_ONE_SUCCESS, DownstreamTasksSkipped, is_mapped,
        "mapped.*branch|task_group.*expand.*branch"
  → still hypothesis-hunting at turn 20 (last: "check how is_mapped returns
     for tasks inside a mapped task group") → exhausted budget.
```

---

## Reading

- **Runtime access is decisive** (no_mcp fails; all runtime-capable arms pass).
- **The 2× bare-cli overhead is discovery/auth friction**, not a capability gap
  — a doc closes it (cli_skill ≈ with_mcp).
- **Not measured here**: multi-call tasks (where MCP's aggregation may compound),
  typed-interface/error-handling advantages, delivery reliability, longitudinal
  effects. n=1, single case.
