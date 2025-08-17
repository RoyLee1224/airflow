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
import { VStack } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdDateRange, MdPlayArrow, MdSearch } from "react-icons/md";
import { useParams, useSearchParams } from "react-router-dom";

import { DagIcon } from "src/assets/DagIcon";
import { TaskIcon } from "src/assets/TaskIcon";
import { useTableURLState } from "src/components/DataTable/useTableUrlState";
import { FilterBar, type FilterConfig, type FilterValue } from "src/components/FilterBar";
import { SearchParamsKeys } from "src/constants/searchParams";

export const XComFiltersExample = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dagId = "~", mapIndex = "-1", runId = "~", taskId = "~" } = useParams();
  const { setTableURLState, tableURLState } = useTableURLState();
  const { pagination, sorting } = tableURLState;
  const { t: translate } = useTranslation(["browse", "common"]);

  const filterConfigs: Array<FilterConfig> = useMemo(() => {
    const configs: Array<FilterConfig> = [
      {
        icon: <MdSearch />,
        key: SearchParamsKeys.KEY_PATTERN,
        label: "Key",
        placeholder: translate("common:filters.keyPlaceholder"),
        type: "text",
      },
      {
        icon: <MdDateRange />,
        key: SearchParamsKeys.LOGICAL_DATE_GTE,
        label: "From Date",
        placeholder: translate("common:filters.logicalDateFromPlaceholder"),
        type: "date",
      },
      {
        key: SearchParamsKeys.LOGICAL_DATE_LTE,
        label: "To Date",
        placeholder: translate("common:filters.logicalDateToPlaceholder"),
        type: "date",
      },
      {
        key: SearchParamsKeys.RUN_AFTER_GTE,
        label: "Run After From",
        placeholder: translate("common:filters.runAfterFromPlaceholder"),
        type: "date",
      },
      {
        key: SearchParamsKeys.RUN_AFTER_LTE,
        label: "Run After To",
        placeholder: translate("common:filters.runAfterToPlaceholder"),
        type: "date",
      },
    ];

    if (dagId === "~") {
      configs.push({
        icon: <DagIcon />,
        key: SearchParamsKeys.DAG_DISPLAY_NAME_PATTERN,
        label: "Dag Name",
        placeholder: translate("common:filters.dagDisplayNamePlaceholder"),
        type: "text",
      });
    }

    if (runId === "~") {
      configs.push({
        icon: <MdPlayArrow />,
        key: SearchParamsKeys.RUN_ID_PATTERN,
        label: "Run ID",
        placeholder: translate("common:filters.runIdPlaceholder"),
        type: "text",
      });
    }

    if (taskId === "~") {
      configs.push({
        icon: <TaskIcon />,
        key: SearchParamsKeys.TASK_ID_PATTERN,
        label: "Task ID",
        placeholder: translate("common:filters.taskIdPlaceholder"),
        type: "text",
      });
    }

    if (mapIndex === "-1") {
      configs.push({
        key: SearchParamsKeys.MAP_INDEX,
        label: "Map Index",
        min: -1,
        placeholder: translate("common:filters.mapIndexPlaceholder"),
        type: "number",
      });
    }

    return configs;
  }, [dagId, mapIndex, runId, taskId, translate]);

  const initialValues = useMemo(() => {
    const values: Record<string, FilterValue> = {};

    filterConfigs.forEach((config) => {
      const value = searchParams.get(config.key);

      if (value !== null && value !== "") {
        values[config.key] = config.type === "number" ? Number(value) : value;
      }
    });

    return values;
  }, [searchParams, filterConfigs]);

  const handleFiltersChange = useCallback(
    (filters: Record<string, FilterValue>) => {
      filterConfigs.forEach((config) => {
        const value = filters[config.key];

        if (value === null || value === undefined || value === "") {
          searchParams.delete(config.key);
        } else {
          searchParams.set(config.key, String(value));
        }
      });

      setTableURLState({
        pagination: { ...pagination, pageIndex: 0 },
        sorting,
      });
      setSearchParams(searchParams);
    },
    [filterConfigs, pagination, searchParams, setSearchParams, setTableURLState, sorting],
  );

  return (
    <VStack align="start" gap={4} paddingY="4px">
      <FilterBar
        configs={filterConfigs}
        initialValues={initialValues}
        onFiltersChange={handleFiltersChange}
      />
    </VStack>
  );
};
