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
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type {
  LightGridTaskInstanceSummary,
  TaskInstanceHistoryResponse,
  TaskInstanceResponse,
} from "openapi/requests/types.gen";
import Time from "src/components/Time";
import { renderDuration } from "src/utils";

import { TooltipField } from "./TooltipField";

type TaskInstanceTooltipContentProps = {
  readonly customFields?: ReactNode;
  readonly showRunId?: boolean;
  readonly showTaskId?: boolean;
  readonly taskInstance: LightGridTaskInstanceSummary | TaskInstanceHistoryResponse | TaskInstanceResponse;
};

/**
 * Reusable content component for task instance tooltips
 * Provides consistent formatting for task instance information
 */
export const TaskInstanceTooltipContent = ({
  customFields,
  showRunId = true,
  showTaskId = false,
  taskInstance,
}: TaskInstanceTooltipContentProps) => {
  const { t: translate } = useTranslation("common");

  return (
    <VStack align="start" gap={1}>
      {showTaskId && <TooltipField label={translate("taskId")} value={taskInstance.task_id} />}

      <TooltipField label={translate("state")} value={taskInstance.state} />

      {showRunId && "dag_run_id" in taskInstance ? (
        <TooltipField label={translate("runId")} value={taskInstance.dag_run_id} />
      ) : undefined}

      {"start_date" in taskInstance ? (
        <>
          {taskInstance.try_number > 1 && (
            <TooltipField label={translate("tryNumber")} value={taskInstance.try_number} />
          )}
          <TooltipField label={translate("startDate")} value={<Time datetime={taskInstance.start_date} />} />
          <TooltipField label={translate("endDate")} value={<Time datetime={taskInstance.end_date} />} />
          <TooltipField label={translate("duration")} value={renderDuration(taskInstance.duration)} />
        </>
      ) : undefined}

      {customFields}
    </VStack>
  );
};
