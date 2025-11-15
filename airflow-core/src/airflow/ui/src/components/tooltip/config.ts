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
import type { TooltipProps } from "src/components/ui";

/**
 * Default tooltip configuration for consistent behavior across the app
 */
export const TOOLTIP_DEFAULTS = {
  closeOnPointerDown: true,
  closeOnScroll: true,
  openDelay: 300,
  closeDelay: 0,
  portalled: true,
  showArrow: true,
  positioning: {
    offset: {
      crossAxis: 5,
      mainAxis: 5,
    },
    placement: "bottom-start" as const,
  },
} satisfies Partial<TooltipProps>;

/**
 * Grid-specific tooltip configuration
 * Optimized for the Grid view with top placement and immediate close on mouse leave
 * to prevent tooltip stacking when quickly moving across grid cells
 *
 * Key optimizations:
 * - openDelay: 500ms - requires user to hover longer before showing
 * - closeDelay: 0 - immediately closes when mouse leaves
 * - interactive: false - tooltip won't capture pointer events
 * - closeOnPointerDown/Scroll - closes on user interactions
 */
export const GRID_TOOLTIP_CONFIG = {
  ...TOOLTIP_DEFAULTS,
  interactive: false,
  openDelay: 500,
  closeDelay: 0,
  closeOnPointerDown: true,
  closeOnScroll: true,
  positioning: {
    ...TOOLTIP_DEFAULTS.positioning,
    placement: "top" as const,
  },
} satisfies Partial<TooltipProps>;
