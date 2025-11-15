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

// ========================================
// Chakra-based Tooltips
// ========================================
export { TOOLTIP_DEFAULTS, GRID_TOOLTIP_CONFIG } from "./config";

// ========================================
// Custom Tooltip - Base Component
// ========================================

// ✨ Integrated hover management + positioning (no wrapper needed!)
export { CustomTooltip } from "./CustomTooltip";

// Configuration presets
export {
  MANUAL_TOOLTIP_DEFAULTS,
  GRID_MANUAL_TOOLTIP_CONFIG,
  CALENDAR_MANUAL_TOOLTIP_CONFIG,
} from "./manualTooltipConfig";
export type { ManualTooltipConfig, TooltipPlacement } from "./manualTooltipConfig";

// ========================================
// Content Components (Pure/Reusable)
// ========================================
export { TooltipField } from "./TooltipField";
export { TaskInstanceTooltipContent } from "./TaskInstanceTooltipContent";

// ========================================
// Specialized Wrappers
// ========================================

// ✨ Pre-configured wrappers (all-in-one, recommended)
export { GridTaskInstanceTooltip } from "./GridTaskInstanceTooltip";
export { TaskRecentRunsTooltip } from "./TaskRecentRunsTooltip";

// ========================================
// Advanced Hooks
// ========================================
export { useGridTooltip } from "./useGridTooltip";
