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
import type { ReactElement, RefObject } from "react";

import type { TaskInstanceResponse } from "openapi/requests/types.gen";

import { ManualTooltip } from "./ManualTooltip";
import { GRID_MANUAL_TOOLTIP_CONFIG } from "./manualTooltipConfig";
import { TaskInstanceTooltipContent } from "./TaskInstanceTooltipContent";

type Props = {
  readonly taskInstance: TaskInstanceResponse;
  readonly triggerRef: RefObject<HTMLElement>;
};

/**
 * Manual positioned tooltip for TaskRecentRuns bar chart
 * Uses ManualTooltip with grid-optimized configuration
 * Provides better performance than Chakra tooltip for dense bar charts
 */
export const TaskRecentRunsTooltipManual = ({ taskInstance, triggerRef }: Props): ReactElement | null => (
  <ManualTooltip config={GRID_MANUAL_TOOLTIP_CONFIG} triggerRef={triggerRef}>
    <TaskInstanceTooltipContent showRunId taskInstance={taskInstance} />
  </ManualTooltip>
);
