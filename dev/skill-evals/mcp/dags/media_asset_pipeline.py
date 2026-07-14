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
"""Example media asset processing pipeline."""

from __future__ import annotations

import pendulum

from airflow.providers.standard.operators.empty import EmptyOperator
from airflow.sdk import DAG, TriggerRule, task, task_group


@task
def parse_csv_schedule():
    return {"A": "1", "B": "2", "C": "3", "D": "4"}


@task_group(group_id="process_items")
def process_items(items_dict):
    @task
    def retrieve_item_metadata(items):
        print(items)
        return items

    @task_group(group_id="a_process")
    def a_process():
        @task.branch(retries=0)
        def a_start():
            a_handling = "none"
            if a_handling == "bypass":
                return "process_items.a_process.a_bypass"
            return "process_items.a_process.a_end"

        start = a_start()
        a_bypass = EmptyOperator(task_id="a_bypass")
        a_end = EmptyOperator(task_id="a_end", trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
        start >> a_bypass >> a_end
        start >> a_end

    @task
    def mark_item_as_done():
        print("Marking item as Done")

    item_metadata = retrieve_item_metadata(items=items_dict)
    group = a_process()
    item_metadata >> group >> mark_item_as_done()


with DAG(
    dag_id="media_asset_pipeline",
    start_date=pendulum.datetime(2024, 1, 1, tz="UTC"),
    schedule=None,
    catchup=False,
    max_active_runs=1,
    tags=["media"],
):
    end = EmptyOperator(task_id="end")
    items_dict = parse_csv_schedule()
    process_items.expand(items_dict=items_dict) >> end
