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
import { Box, Heading, Text, HStack, type SelectValueChangeDetails } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";

import { useBackfillServiceListBackfillsUi } from "openapi/queries";
import type { BackfillResponse } from "openapi/requests/types.gen";
import { DataTable } from "src/components/DataTable";
import { useTableURLState } from "src/components/DataTable/useTableUrlState";
import { ErrorAlert } from "src/components/ErrorAlert";
import { SearchBar } from "src/components/SearchBar";
import { StateBadge } from "src/components/StateBadge";
import Time from "src/components/Time";
import { Select } from "src/components/ui";
import { SearchParamsKeys, type SearchParamsKeysType } from "src/constants/searchParams";
import { backfillStatusOptions, backfillReprocessBehaviorOptions } from "src/constants/stateOptions";
import { getDuration } from "src/utils";

const getColumns = (translate: (key: string) => string): Array<ColumnDef<BackfillResponse>> => [
  {
    accessorKey: "from_date",
    cell: ({ row }) => (
      <Text>
        <Time datetime={row.original.from_date} />
      </Text>
    ),
    enableSorting: false,
    header: translate("table.from"),
  },
  {
    accessorKey: "to_date",
    cell: ({ row }) => (
      <Text>
        <Time datetime={row.original.to_date} />
      </Text>
    ),
    enableSorting: false,
    header: translate("table.to"),
  },
  {
    accessorKey: "reprocess_behavior",
    cell: ({ row }) => (
      <Text>
        {row.original.reprocess_behavior === "none"
          ? translate("backfill.missingRuns")
          : row.original.reprocess_behavior === "failed"
            ? translate("backfill.missingAndErroredRuns")
            : translate("backfill.allRuns")}
      </Text>
    ),
    enableSorting: false,
    header: translate("table.reprocessBehavior"),
  },
  {
    accessorKey: "created_at",
    cell: ({ row }) => (
      <Text>
        <Time datetime={row.original.created_at} />
      </Text>
    ),
    enableSorting: false,
    header: translate("table.createdAt"),
  },
  {
    accessorKey: "completed_at",
    cell: ({ row }) => (
      <Text>
        <Time datetime={row.original.completed_at} />
      </Text>
    ),
    enableSorting: false,
    header: translate("table.completedAt"),
  },
  {
    accessorKey: "duration",
    cell: ({ row }) => (
      <Text>
        {row.original.completed_at === null
          ? ""
          : getDuration(row.original.created_at, row.original.completed_at)}
      </Text>
    ),
    enableSorting: false,
    header: translate("table.duration"),
  },
  {
    accessorKey: "max_active_runs",
    enableSorting: false,
    header: translate("table.maxActiveRuns"),
  },
];

const {
  MAX_ACTIVE_RUNS: MAX_ACTIVE_RUNS_PARAM,
  REPROCESS_BEHAVIOR: REPROCESS_BEHAVIOR_PARAM,
  STATE: STATE_PARAM,
}: SearchParamsKeysType = SearchParamsKeys;

export const Backfills = () => {
  const { t: translate } = useTranslation();
  const { setTableURLState, tableURLState } = useTableURLState();
  const [searchParams, setSearchParams] = useSearchParams();

  const { pagination, sorting } = tableURLState;

  const { dagId = "" } = useParams();

  const filteredState = searchParams.get(STATE_PARAM);
  const filteredReprocessBehavior = searchParams.get(REPROCESS_BEHAVIOR_PARAM);
  const filteredMaxActiveRuns = searchParams.get(MAX_ACTIVE_RUNS_PARAM);

  // Mock data filtering logic - in real implementation this would be passed to API
  const { data, error, isFetching, isLoading } = useBackfillServiceListBackfillsUi({
    dagId,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });

  const handleStateChange = useCallback(
    ({ value }: SelectValueChangeDetails<string>) => {
      const [val] = value;

      if (val === undefined || val === "all") {
        searchParams.delete(STATE_PARAM);
      } else {
        searchParams.set(STATE_PARAM, val);
      }
      setTableURLState({
        pagination: { ...pagination, pageIndex: 0 },
        sorting,
      });
      setSearchParams(searchParams);
    },
    [pagination, searchParams, setSearchParams, setTableURLState, sorting],
  );

  const handleReprocessBehaviorChange = useCallback(
    ({ value }: SelectValueChangeDetails<string>) => {
      const [val] = value;

      if (val === undefined || val === "all") {
        searchParams.delete(REPROCESS_BEHAVIOR_PARAM);
      } else {
        searchParams.set(REPROCESS_BEHAVIOR_PARAM, val);
      }
      setTableURLState({
        pagination: { ...pagination, pageIndex: 0 },
        sorting,
      });
      setSearchParams(searchParams);
    },
    [pagination, searchParams, setSearchParams, setTableURLState, sorting],
  );

  const handleMaxActiveRunsChange = useCallback(
    (value: string) => {
      if (value === "") {
        searchParams.delete(MAX_ACTIVE_RUNS_PARAM);
      } else {
        searchParams.set(MAX_ACTIVE_RUNS_PARAM, value);
      }
      setTableURLState({
        pagination: { ...pagination, pageIndex: 0 },
        sorting,
      });
      setSearchParams(searchParams);
    },
    [pagination, searchParams, setSearchParams, setTableURLState, sorting],
  );

  return (
    <>
      <HStack paddingY="4px">
        <Box maxW="200px">
          <SearchBar
            defaultValue={filteredMaxActiveRuns ?? ""}
            hideAdvanced
            hotkeyDisabled={false}
            onChange={handleMaxActiveRunsChange}
            placeHolder={translate("dags:filters.maxActiveRunsFilter")}
          />
        </Box>
        <Select.Root
          collection={backfillStatusOptions}
          maxW="150px"
          onValueChange={handleStateChange}
          value={[filteredState ?? "all"]}
        >
          <Select.Trigger colorPalette="blue" isActive={Boolean(filteredState)} minW="max-content">
            <Select.ValueText width="auto">
              {() =>
                filteredState === null ? (
                  translate("dags:filters.allStates")
                ) : (
                  <StateBadge state={filteredState}>{translate(`common:states.${filteredState}`)}</StateBadge>
                )
              }
            </Select.ValueText>
          </Select.Trigger>
          <Select.Content>
            {backfillStatusOptions.items.map((option) => (
              <Select.Item item={option} key={option.label}>
                {option.value === "all" ? (
                  translate(option.label)
                ) : (
                  <StateBadge state={option.value}>{translate(option.label)}</StateBadge>
                )}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root
          collection={backfillReprocessBehaviorOptions}
          maxW="200px"
          onValueChange={handleReprocessBehaviorChange}
          value={[filteredReprocessBehavior ?? "all"]}
        >
          <Select.Trigger
            colorPalette="blue"
            isActive={Boolean(filteredReprocessBehavior)}
            minW="max-content"
          >
            <Select.ValueText width="auto">
              {() =>
                filteredReprocessBehavior === null
                  ? translate("dags:filters.allBehaviors")
                  : translate(`backfill.${filteredReprocessBehavior}`)
              }
            </Select.ValueText>
          </Select.Trigger>
          <Select.Content>
            {backfillReprocessBehaviorOptions.items.map((option) => (
              <Select.Item item={option} key={option.label}>
                {translate(option.label)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </HStack>
      <DataTable
        columns={getColumns(translate)}
        data={data?.backfills ?? []}
        errorMessage={<ErrorAlert error={error} />}
        initialState={tableURLState}
        isFetching={isFetching}
        isLoading={isLoading}
        modelName={translate("backfill_one")}
        onStateChange={setTableURLState}
        total={data?.total_entries}
      />
    </>
  );
};
