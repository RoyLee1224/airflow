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
import { Box, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiHome } from "react-icons/fi";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";

import type { DagRunState, DAGWithLatestDagRunsResponse } from "openapi/requests/types.gen";
import { DataTable } from "src/components/DataTable";
import { ToggleTableDisplay } from "src/components/DataTable/ToggleTableDisplay";
import type { CardDef } from "src/components/DataTable/types";
import { useTableURLState } from "src/components/DataTable/useTableUrlState";
import { ErrorAlert } from "src/components/ErrorAlert";
import { SearchBar } from "src/components/SearchBar";
import { SearchParamsKeys, type SearchParamsKeysType } from "src/constants/searchParams";
import { DagsLayout } from "src/layouts/DagsLayout";
import { useConfig } from "src/queries/useConfig";
import { useDags } from "src/queries/useDags";

import { DagCard } from "../DagsList/DagCard";
import { DagsFilters } from "../DagsList/DagsFilters";
import { SortSelect } from "../DagsList/SortSelect";
import { DAGImportErrors } from "../Dashboard/Stats/DAGImportErrors";
import { createColumns } from "./columns";
import { mockFolderData } from "./mockData";

const {
  LAST_DAG_RUN_STATE: LAST_DAG_RUN_STATE_PARAM,
  NAME_PATTERN: NAME_PATTERN_PARAM,
  PAUSED: PAUSED_PARAM,
  TAGS: TAGS_PARAM,
  TAGS_MATCH_MODE: TAGS_MATCH_MODE_PARAM,
}: SearchParamsKeysType = SearchParamsKeys;

const cardDef: CardDef<DAGWithLatestDagRunsResponse> = {
  card: ({ row }) => <DagCard dag={row} />,
  meta: {
    customSkeleton: <Skeleton height="120px" width="100%" />,
  },
};

const DAGS_LIST_DISPLAY = "dags_list_display";

export const FolderDags = () => {
  const { t: translate } = useTranslation(["dags", "common"]);
  const { folderId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [display, setDisplay] = useLocalStorage<"card" | "table">(DAGS_LIST_DISPLAY, "card");
  const dagRunsLimit = display === "card" ? 14 : 1;

  // 獲取 folder 信息
  const folderData =
    (folderId?.trim().length ?? 0) > 0 ? mockFolderData[folderId as keyof typeof mockFolderData] : undefined;

  const hidePausedDagsByDefault = Boolean(useConfig("hide_paused_dags_by_default"));
  const defaultShowPaused = hidePausedDagsByDefault ? false : undefined;

  const showPaused = searchParams.get(PAUSED_PARAM);

  const lastDagRunState = searchParams.get(LAST_DAG_RUN_STATE_PARAM) as DagRunState;
  const selectedTags = searchParams.getAll(TAGS_PARAM);
  const selectedMatchMode = searchParams.get(TAGS_MATCH_MODE_PARAM) as "all" | "any";

  const { setTableURLState, tableURLState } = useTableURLState();

  const { pagination, sorting } = tableURLState;
  const [dagDisplayNamePattern, setDagDisplayNamePattern] = useState(
    searchParams.get(NAME_PATTERN_PARAM) ?? undefined,
  );

  const [sort] = sorting;
  const orderBy = sort ? `${sort.desc ? "-" : ""}${sort.id}` : "dag_display_name";

  const columns = useMemo(() => createColumns(translate), [translate]);

  const handleSearchChange = (value: string) => {
    if (value) {
      searchParams.set(NAME_PATTERN_PARAM, value);
    } else {
      searchParams.delete(NAME_PATTERN_PARAM);
    }
    setSearchParams(searchParams);
    setTableURLState({
      pagination: { ...pagination, pageIndex: 0 },
      sorting,
    });
    setDagDisplayNamePattern(value);
  };

  let paused = defaultShowPaused;

  if (showPaused === "all") {
    paused = undefined;
  } else if (showPaused === "true") {
    paused = true;
  } else if (showPaused === "false") {
    paused = false;
  }

  // 過濾只顯示 folder 中的 DAGs
  const { data, error, isLoading } = useDags({
    dagDisplayNamePattern: dagDisplayNamePattern ?? undefined,
    dagIds: folderData?.dag_ids,
    dagRunsLimit,
    lastDagRunState,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    orderBy,
    paused,
    tags: selectedTags,
    tagsMatchMode: selectedMatchMode,
  });

  const handleSortChange = useCallback(
    ({ value }: { value: Array<string> }) => {
      setTableURLState({
        pagination,
        sorting: value.map((val) => ({
          desc: val.startsWith("-"),
          id: val.replace("-", ""),
        })),
      });
    },
    [pagination, setTableURLState],
  );

  if (!folderData) {
    return (
      <DagsLayout>
        <Box p={6}>
          <Text>Folder not found</Text>
        </Box>
      </DagsLayout>
    );
  }

  return (
    <DagsLayout>
      <VStack alignItems="none">
        {/* Navigation */}
        <VStack alignItems="stretch" gap={3} mb={4}>
          {/* Breadcrumb */}
          <HStack color="gray.600" fontSize="sm">
            <RouterLink to="/">
              <Text color="blue.600">
                <FiHome />
              </Text>
            </RouterLink>
            <Text>/</Text>
            <RouterLink to="/folders">
              <Text color="blue.600">Folders</Text>
            </RouterLink>
            <Text>/</Text>
            <Text color="gray.800" fontWeight="bold">
              {folderData.name}
            </Text>
          </HStack>
        </VStack>

        <SearchBar
          buttonProps={{ disabled: true }}
          defaultValue={dagDisplayNamePattern ?? ""}
          onChange={handleSearchChange}
          placeHolder={translate("list.searchPlaceholder")}
        />
        <DagsFilters />
        <HStack justifyContent="space-between">
          <HStack>
            <Heading py={3} size="md">
              {data?.total_entries === undefined
                ? `${folderData.dag_ids.length} ${folderData.dag_ids.length === 1 ? translate("common:dag_one") : translate("common:dag_other")} in this folder`
                : `${data.total_entries} of ${folderData.dag_ids.length} ${folderData.dag_ids.length === 1 ? translate("common:dag_one") : translate("common:dag_other")} in this folder`}
              {Boolean(hidePausedDagsByDefault && data?.total_entries !== folderData.dag_ids.length) && (
                <Text color="gray.500" fontSize="sm" ml={2}>
                  (Some paused DAGs hidden)
                </Text>
              )}
            </Heading>
            <DAGImportErrors iconOnly />
          </HStack>
          {display === "card" ? (
            <SortSelect handleSortChange={handleSortChange} orderBy={orderBy} />
          ) : undefined}
        </HStack>
      </VStack>
      <ToggleTableDisplay display={display} setDisplay={setDisplay} />
      <Box overflow="auto">
        <DataTable
          cardDef={cardDef}
          columns={columns}
          data={data?.dags ?? []}
          displayMode={display}
          errorMessage={<ErrorAlert error={error} />}
          initialState={tableURLState}
          isLoading={isLoading}
          modelName="Dag"
          onStateChange={setTableURLState}
          skeletonCount={display === "card" ? 5 : undefined}
          total={data?.total_entries ?? 0}
        />
      </Box>
    </DagsLayout>
  );
};
