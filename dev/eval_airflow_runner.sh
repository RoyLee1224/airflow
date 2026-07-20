#!/usr/bin/env bash
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

# Temporary runner for the MCP eval: starts all Airflow components inside a
# non-interactive breeze shell (breeze start-airflow needs a TTY for mprocs).
set -euo pipefail
mkdir -p /files/eval-logs
airflow db migrate
airflow dag-processor > /files/eval-logs/dag-processor.log 2>&1 &
airflow scheduler > /files/eval-logs/scheduler.log 2>&1 &
airflow triggerer > /files/eval-logs/triggerer.log 2>&1 &
echo "components started, starting api-server"
exec airflow api-server --port 8080 > /files/eval-logs/api-server.log 2>&1
