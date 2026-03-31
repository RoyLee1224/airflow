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

# Eval Report: airflow-contribution skill (Iteration 1)

**Model:** claude-opus-4-6
**Date:** 2026-03-31

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| Pass Rate | 100% | 77.8% | +22.2% |
| Avg Time | 54.7s | 44.8s | +9.9s |
| Avg Tokens | 17,261 | 14,608 | +2,653 |

## Eval 0: db_test routing (should choose uv)

**Prompt:** Run the serialized_dag tests. The file is marked with @pytest.mark.db_test.

### With Skill

**Command:**
```bash
uv run --project airflow-core pytest airflow-core/tests/unit/models/test_serialized_dag.py -xvs
```

| Assertion | Result |
|-----------|--------|
| uses_uv_not_breeze | PASS |
| correct_project_flag | PASS |
| includes_xvs_flags | PASS |

**Reasoning:** The skill workflow identifies `db_test` as the only marker. Since no `backend`, `integration`, or `system` markers are present, the default SQLite backend is sufficient on the host. The skill correctly routes to the narrowest host-side `uv run` command.

**Tokens:** 16,562 | **Time:** 36.2s

### Without Skill (Baseline)

**Command:**
```bash
breeze run pytest airflow-core/tests/unit/models/test_serialized_dag.py -xvs
```

| Assertion | Result |
|-----------|--------|
| uses_uv_not_breeze | FAIL |
| correct_project_flag | FAIL |
| includes_xvs_flags | PASS |

**Reasoning:** Without the skill, the agent defaults to breeze because CLAUDE.md says "Never run pytest directly on the host." It interprets `db_test` as requiring breeze, missing the nuance that SQLite (the default) works fine with `uv run`.

**Tokens:** 13,898 | **Time:** 34.6s

---

## Eval 1: Helm test routing (should choose breeze)

**Prompt:** I just tweaked the scheduler Helm template. Run chart/tests/test_scheduler.py.

### With Skill

**Command:**
```bash
breeze testing helm-tests --use-xdist
```

| Assertion | Result |
|-----------|--------|
| uses_breeze_helm | PASS |
| does_not_use_uv | PASS |

**Reasoning:** The skill's Breeze suite commands table explicitly routes Helm/chart changes to `breeze testing helm-tests --use-xdist`. Correctly identifies that Helm tests cannot run via host-side `uv` commands.

**Tokens:** 17,115 | **Time:** 63.4s

### Without Skill (Baseline)

**Command:**
```bash
breeze testing helm-tests --test-type airflow_core
```

| Assertion | Result |
|-----------|--------|
| uses_breeze_helm | PASS |
| does_not_use_uv | PASS |

**Reasoning:** CLAUDE.md already documents Helm test commands well. The baseline correctly routes to breeze. It even narrows the scope with `--test-type airflow_core`.

**Tokens:** 14,224 | **Time:** 46.1s

---

## Eval 2: Postgres backend routing (should choose breeze --backend postgres)

**Prompt:** I want to validate my DAG serialization change locally, nothing fancy. The test file is marked with @pytest.mark.backend("postgres"); just run it quickly.

### With Skill

**Command:**
```bash
breeze run pytest airflow-core/tests/unit/models/test_serialized_dag.py -xvs --backend postgres
```

| Assertion | Result |
|-----------|--------|
| uses_breeze_with_backend | PASS |
| specifies_postgres_backend | PASS |
| does_not_use_uv | PASS |

**Reasoning:** The skill workflow (step 5) directs to breeze when specific backends are required. The `@pytest.mark.backend("postgres")` marker makes it clear a Postgres database is needed, which breeze provisions automatically with `--backend postgres`.

**Tokens:** 18,107 | **Time:** 64.6s

### Without Skill (Baseline)

**Command:**
```bash
breeze run pytest tests/unit/models/test_serialized_dag.py -xvs --backend postgres
```

| Assertion | Result |
|-----------|--------|
| uses_breeze_with_backend | PASS |
| specifies_postgres_backend | PASS |
| does_not_use_uv | PASS |

**Reasoning:** CLAUDE.md already covers `--backend postgres` usage. The baseline handles this correctly.

**Tokens:** 15,701 | **Time:** 53.8s

---

## Analysis

1. **Eval 0 is the key differentiator.** The skill correctly routes `db_test`-only tests to `uv run` (host-side), while the baseline defaults to `breeze`. This is the skill's primary value-add: understanding that `db_test` alone (with default SQLite) does not require breeze.

2. **Evals 1 and 2 are non-discriminating.** Both configs pass — CLAUDE.md already provides sufficient guidance for Helm tests and postgres-backend routing. These evals confirm the skill doesn't break anything, but don't demonstrate added value.

3. **Cost:** The skill adds ~10s and ~2,600 tokens per run from reading and processing SKILL.md. This is a modest overhead given the correctness improvement on eval 0.
