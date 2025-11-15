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
import type { ReactElement, ReactNode } from "react";

import type { LightGridTaskInstanceSummary } from "openapi/requests/types.gen";

import { ManualTooltipV2 } from "./ManualTooltipV2";
import { GRID_MANUAL_TOOLTIP_CONFIG } from "./manualTooltipConfig";
import { TaskInstanceTooltipContent } from "./TaskInstanceTooltipContent";

type Props = {
  readonly children: ReactElement;
  readonly customFields?: ReactNode;
  readonly delayMs?: number;
  readonly showRunId?: boolean;
  readonly showTaskId?: boolean;
  readonly taskInstance: LightGridTaskInstanceSummary;
};

/**
 * Simplified Grid task instance tooltip using ManualTooltipV2
 *
 * No more HoverTooltip wrapper, no manual ref passing - just clean, simple usage
 *
 * @example
 * ```tsx
 * <GridTaskInstanceTooltip taskInstance={instance} showTaskId>
 *   <Badge>Task</Badge>
 * </GridTaskInstanceTooltip>
 * ```
 */
export const GridTaskInstanceTooltip = ({
  children,
  customFields,
  delayMs = 500,
  showRunId = false,
  showTaskId = true,
  taskInstance,
}: Props): ReactElement => (
  <ManualTooltipV2
    config={GRID_MANUAL_TOOLTIP_CONFIG}
    content={
      <TaskInstanceTooltipContent
        customFields={customFields}
        showRunId={showRunId}
        showTaskId={showTaskId}
        taskInstance={taskInstance}
      />
    }
    delayMs={delayMs}
  >
    {children}
  </ManualTooltipV2>
);
