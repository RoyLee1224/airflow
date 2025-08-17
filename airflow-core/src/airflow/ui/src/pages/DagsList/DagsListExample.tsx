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
import { MdSearch, MdPerson } from "react-icons/md";
import { useSearchParams } from "react-router-dom";

import { useTableURLState } from "src/components/DataTable/useTableUrlState";
import { FilterBar, type FilterConfig, type FilterValue } from "src/components/FilterBar";

export const DagsListExample = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTableURLState, tableURLState } = useTableURLState();
  const { pagination, sorting } = tableURLState;

  const filterConfigs: Array<FilterConfig> = useMemo(
    () => [
      {
        hotkeyDisabled: false,
        icon: <MdSearch />,
        key: "search",
        label: "Search DAGs",
        placeholder: "Search DAGs",
        type: "text",
      },
      {
        icon: <MdPerson />,
        key: "owner_name",
        label: "Owner",
        placeholder: "Filter by owner",
        type: "text",
      },
      {
        key: "max_active_tasks",
        label: "Max Active Tasks",
        min: 0,
        placeholder: "Filter by max active tasks",
        type: "number",
      },
      {
        key: "last_updated",
        label: "Last Updated",
        placeholder: "Filter by last updated date",
        type: "date",
      },
    ],
    [],
  );

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
