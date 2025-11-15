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
import type { CSSProperties } from "react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end";

export type ManualTooltipConfig = {
  /**
   * Show arrow indicator
   */
  readonly showArrow?: boolean;

  /**
   * Tooltip placement relative to trigger element
   */
  readonly placement?: TooltipPlacement;

  /**
   * Distance from trigger element (in pixels)
   */
  readonly offset?: number;

  /**
   * Custom CSS styles for tooltip container
   */
  readonly containerStyle?: CSSProperties;

  /**
   * Custom CSS styles for arrow
   */
  readonly arrowStyle?: CSSProperties;

  /**
   * z-index for tooltip
   */
  readonly zIndex?: number;
};

/**
 * Default configuration for manual tooltips
 */
export const MANUAL_TOOLTIP_DEFAULTS: ManualTooltipConfig = {
  arrowStyle: {},
  containerStyle: {},
  offset: 8,
  placement: "top",
  showArrow: true,
  zIndex: 1500,
};

/**
 * Grid-optimized manual tooltip configuration
 * - Top placement to avoid covering content below
 * - Minimal offset for compact grid layouts
 */
export const GRID_MANUAL_TOOLTIP_CONFIG: ManualTooltipConfig = {
  ...MANUAL_TOOLTIP_DEFAULTS,
  offset: 8,
  placement: "top",
};

/**
 * Calendar-optimized manual tooltip configuration
 * - Bottom placement to match existing behavior
 */
export const CALENDAR_MANUAL_TOOLTIP_CONFIG: ManualTooltipConfig = {
  ...MANUAL_TOOLTIP_DEFAULTS,
  offset: 8,
  placement: "bottom",
};
