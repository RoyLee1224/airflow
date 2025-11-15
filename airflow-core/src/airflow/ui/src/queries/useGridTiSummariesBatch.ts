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
import { useQueries } from "@tanstack/react-query";

import { GridService } from "openapi/requests";
import type { GridRunsResponse, GridTISummaries } from "openapi/requests";
import { isStatePending, useAutoRefresh } from "src/utils";

/**
 * Custom hook to fetch TI summaries for multiple runs in parallel.
 * This reduces N sequential requests to N parallel requests.
 *
 * @param dagId - The DAG ID
 * @param runs - Array of DAG runs
 * @returns Object containing:
 *   - data: Record mapping run_id to GridTISummaries
 *   - isLoading: True if any query is loading
 *   - isError: True if any query has errored
 */
export const useGridTiSummariesBatch = ({
  dagId,
  runs,
}: {
  dagId: string;
  runs: GridRunsResponse[] | undefined;
}) => {
  const refetchInterval = useAutoRefresh({ dagId });

  // Use useQueries to fetch all TI summaries in parallel
  const results = useQueries({
    queries:
      runs?.map((run) => {
        const shouldRefetch = isStatePending(run.state);

        return {
          queryKey: ["gridTiSummaries", dagId, run.run_id],
          queryFn: () => GridService.getGridTiSummaries({ dagId, runId: run.run_id }),
          enabled: Boolean(dagId) && Boolean(run.run_id),
          placeholderData: (prev: GridTISummaries | undefined) => prev,
          refetchInterval: shouldRefetch ? refetchInterval : false,
        };
      }) ?? [],
  });

  // Transform results into a map of run_id -> GridTISummaries
  const data = runs?.reduce(
    (acc, run, index) => {
      const result = results[index];

      if (result.data) {
        acc[run.run_id] = result.data;
      }

      return acc;
    },
    {} as Record<string, GridTISummaries>,
  );

  // Aggregate loading and error states
  const isLoading = results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);

  return {
    data,
    isError,
    isLoading,
  };
};
