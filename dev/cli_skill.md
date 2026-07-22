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

---
name: airflow-runtime
description: Inspect the live/recorded state of the running Airflow (Breeze) instance via its REST API with curl.
---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Inspecting the running Airflow instance](#inspecting-the-running-airflow-instance)
  - [Base URL and authentication](#base-url-and-authentication)
  - [Endpoints (use API v2, not v1)](#endpoints-use-api-v2-not-v1)
  - [Fields available on each task instance](#fields-available-on-each-task-instance)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Inspecting the running Airflow instance

The local Breeze Airflow exposes a REST API. Query it with `curl` to see the
recorded state of Dags, runs, and task instances. This describes only how to
reach the API — it says nothing about any specific run.

## Base URL and authentication

- Base URL: `http://localhost:28080`
- The API uses JWT bearer auth. Get a token first:

  ```
  curl -s http://localhost:28080/auth/token -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'
  ```

  The JSON response contains `access_token`. Pass it on every `/api/v2` call as
  the header `Authorization: Bearer <token>`.

## Endpoints (use API v2, not v1)

- All task instances of a run:

  ```
  curl -s -H "Authorization: Bearer <token>" "http://localhost:28080/api/v2/dags/<dag_id>/dagRuns/<run_id>/taskInstances?limit=200"
  ```

- A single task instance: append `/<task_id>` (and `/<map_index>` for mapped tasks).
- Task logs: `.../taskInstances/<task_id>/logs/<try_number>`.
- The run itself: `http://localhost:28080/api/v2/dags/<dag_id>/dagRuns/<run_id>`.

## Fields available on each task instance

`task_id`, `state`, `map_index`, `try_number`, `start_date`, `end_date`,
`hostname`, `operator`, `note`. These are the recorded facts of the run.
