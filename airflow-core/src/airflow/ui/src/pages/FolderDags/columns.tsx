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
import { Text } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link as RouterLink } from "react-router-dom";

import type { DAGWithLatestDagRunsResponse } from "openapi/requests/types.gen";
import DeleteDagButton from "src/components/DagActions/DeleteDagButton";
import DagRunInfo from "src/components/DagRunInfo";
import { TogglePause } from "src/components/TogglePause";
import TriggerDAGButton from "src/components/TriggerDag/TriggerDAGButton";

import { DagTags } from "../DagsList/DagTags";
import { Schedule } from "../DagsList/Schedule";

export const createColumns = (
  translate: (key: string, options?: Record<string, unknown>) => string,
): Array<ColumnDef<DAGWithLatestDagRunsResponse>> => [
  {
    accessorKey: "is_paused",
    cell: ({ row: { original } }) => (
      <TogglePause
        dagDisplayName={original.dag_display_name}
        dagId={original.dag_id}
        isPaused={original.is_paused}
      />
    ),
    enableSorting: false,
    header: "",
    meta: {
      skeletonWidth: 10,
    },
  },
  {
    accessorKey: "dag_display_name",
    cell: ({ row: { original } }) => (
      <RouterLink to={`/dags/${original.dag_id}`}>
        <Text color="blue.600" fontWeight="bold">
          {original.dag_display_name}
        </Text>
      </RouterLink>
    ),
    header: () => translate("list.columns.dagId"),
  },
  {
    accessorKey: "timetable_description",
    cell: ({ row: { original } }) => <Schedule dag={original} />,
    enableSorting: false,
    header: () => translate("list.columns.schedule"),
  },
  {
    accessorKey: "next_dagrun",
    cell: ({ row: { original } }) =>
      Boolean(original.next_dagrun_run_after) ? (
        <DagRunInfo
          logicalDate={original.next_dagrun_logical_date}
          runAfter={original.next_dagrun_run_after as string}
        />
      ) : undefined,
    header: () => translate("list.columns.nextDagRun"),
  },
  {
    accessorKey: "last_run_start_date",
    cell: ({ row: { original } }) =>
      original.latest_dag_runs[0] ? (
        <RouterLink to={`/dags/${original.dag_id}/runs/${original.latest_dag_runs[0].dag_run_id}`}>
          <DagRunInfo
            endDate={original.latest_dag_runs[0].end_date}
            logicalDate={original.latest_dag_runs[0].logical_date}
            runAfter={original.latest_dag_runs[0].run_after}
            startDate={original.latest_dag_runs[0].start_date}
            state={original.latest_dag_runs[0].state}
          />
        </RouterLink>
      ) : undefined,
    header: () => translate("list.columns.lastDagRun"),
  },
  {
    accessorKey: "tags",
    cell: ({
      row: {
        original: { tags },
      },
    }) => <DagTags hideIcon tags={tags} />,
    enableSorting: false,
    header: () => translate("list.columns.tags"),
  },
  {
    accessorKey: "trigger",
    cell: ({ row: { original } }) => <TriggerDAGButton dag={original} withText={false} />,
    enableSorting: false,
    header: "",
  },
  {
    accessorKey: "delete",
    cell: ({ row: { original } }) => (
      <DeleteDagButton dagDisplayName={original.dag_display_name} dagId={original.dag_id} withText={false} />
    ),
    enableSorting: false,
    header: "",
  },
];
