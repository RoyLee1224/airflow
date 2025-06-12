/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// 模擬 folder 數據 - 基於真實的 DAG 文件
export const mockFolderData = {
  "1": {
    dag_ids: [
      "tutorial",
      "tutorial_dag",
      "tutorial_taskflow_api",
      "tutorial_taskflow_api_virtualenv",
      "tutorial_taskflow_templates",
      "tutorial_objectstorage",
    ],
    description: "Tutorial and learning Dags for getting started with Airflow",
    id: "1",
    name: "Tutorials",
  },
  "2": {
    dag_ids: [
      "example_complex",
      "example_setup_teardown",
      "example_setup_teardown_taskflow",
      "example_task_group",
      "example_task_group_decorator",
      "example_xcom",
      "example_xcomargs",
    ],
    description: "Advanced example Dags showcasing complex workflows and patterns",
    id: "2",
    name: "Advanced Examples",
  },
  "3": {
    dag_ids: [
      "asset_producer",
      "_asset_consumer",
      "example_assets",
      "example_asset_decorator",
      "example_asset_alias",
      "example_asset_alias_with_no_taskflow",
      "example_asset_with_watchers",
    ],
    description: "Dags demonstrating asset management and data lineage features",
    id: "3",
    name: "Asset Management",
  },
  "4": {
    dag_ids: [
      "example_branch_labels",
      "example_branch_python_dop_operator_3",
      "example_nested_branch_dag",
      "example_skip_dag",
      "example_trigger_target_dag",
    ],
    description: "Dags showing branching logic and conditional execution",
    id: "4",
    name: "Branching & Control Flow",
  },
  "5": {
    dag_ids: [
      "example_params_trigger_ui",
      "example_params_ui_tutorial",
      "example_passing_params_via_test_command",
      "example_dynamic_task_mapping",
      "example_dynamic_task_mapping_with_no_taskflow_operators",
    ],
    description: "Dags demonstrating parameter handling and dynamic task generation",
    id: "5",
    name: "Parameters & Dynamic Tasks",
  },
  "6": {
    dag_ids: ["test_simple_deferred", "test_deferred_tasks", "example_time_delta_sensor_async"],
    description: "Dags for testing deferred and asynchronous task execution",
    id: "6",
    name: "Testing & Deferred Tasks",
  },
};
