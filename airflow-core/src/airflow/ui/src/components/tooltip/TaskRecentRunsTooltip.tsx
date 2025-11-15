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
import type { ReactElement } from "react";

import type { TaskInstanceResponse } from "openapi/requests/types.gen";

import { CustomTooltip } from "./CustomTooltip";
import { GRID_MANUAL_TOOLTIP_CONFIG } from "./manualTooltipConfig";
import { TaskInstanceTooltipContent } from "./TaskInstanceTooltipContent";

type Props = {
  readonly children: ReactElement;
  readonly delayMs?: number;
  readonly taskInstance: TaskInstanceResponse;
};

/**
 * Simplified tooltip for TaskRecentRuns bar chart
 *
 * Uses CustomTooltip with grid-optimized configuration for better performance
 * on dense bar charts (4px width elements)
 *
 * @example
 * ```tsx
 * <TaskRecentRunsTooltip taskInstance={instance}>
 *   <Box width="4px" height="14px" />
 * </TaskRecentRunsTooltip>
 * ```
 */
export const TaskRecentRunsTooltip = ({
  children,
  delayMs = 500,
  taskInstance,
}: Props): ReactElement => (
  <CustomTooltip
    config={GRID_MANUAL_TOOLTIP_CONFIG}
    content={<TaskInstanceTooltipContent showRunId taskInstance={taskInstance} />}
    delayMs={delayMs}
  >
    {children}
  </CustomTooltip>
);
