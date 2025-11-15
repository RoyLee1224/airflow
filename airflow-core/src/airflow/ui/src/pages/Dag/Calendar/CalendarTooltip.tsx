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

import { CALENDAR_MANUAL_TOOLTIP_CONFIG, CustomTooltip } from "src/components/tooltip";

import { CalendarTooltipContent } from "./CalendarTooltipContent";
import type { CalendarCellData, CalendarColorMode } from "./types";

type Props = {
  readonly cellData: CalendarCellData | undefined;
  readonly children: ReactElement;
  readonly delayMs?: number;
  readonly viewMode?: CalendarColorMode;
};

/**
 * Simplified calendar cell tooltip using CustomTooltip
 *
 * No more HoverTooltip wrapper, no manual ref passing - just clean, simple usage
 *
 * @example
 * ```tsx
 * <CalendarTooltip cellData={cellData} viewMode="total">
 *   <Box width="14px" height="14px" />
 * </CalendarTooltip>
 * ```
 */
export const CalendarTooltip = ({
  cellData,
  children,
  delayMs = 500,
  viewMode = "total",
}: Props): ReactElement => {
  if (!cellData) {
    return children;
  }

  return (
    <CustomTooltip
      config={{
        ...CALENDAR_MANUAL_TOOLTIP_CONFIG,
        containerStyle: {
          minWidth: "200px",
          whiteSpace: "nowrap",
        },
      }}
      content={<CalendarTooltipContent cellData={cellData} viewMode={viewMode} />}
      delayMs={delayMs}
    >
      {children}
    </CustomTooltip>
  );
};
