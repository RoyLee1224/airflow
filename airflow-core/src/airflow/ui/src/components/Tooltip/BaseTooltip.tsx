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
import { Box } from "@chakra-ui/react";
import { useMemo } from "react";
import type { ReactNode, RefObject } from "react";

import { getTooltipStyles } from "./getTooltipStyles";
import { useTooltipPosition } from "./useTooltipPosition";

export type TooltipPosition = "bottom-center" | "right-center" | "top-center";

type Props = {
  readonly children: ReactNode;
  readonly estimatedHeight?: number;
  readonly fontSize?: string;
  readonly minWidth?: string;
  readonly position?: TooltipPosition;
  readonly showArrow?: boolean;
  readonly tooltipOffset?: number;
  readonly triggerRef: RefObject<HTMLElement>;
  readonly viewportPadding?: number;
};

export const BaseTooltip = ({
  children,
  estimatedHeight = 80,
  fontSize = "12px",
  minWidth = "200px",
  position = "bottom-center",
  showArrow = true,
  tooltipOffset = 8,
  triggerRef,
  viewportPadding = 16,
}: Props) => {
  const positionData = useTooltipPosition({
    estimatedHeight,
    minWidth,
    position,
    tooltipOffset,
    triggerRef,
  });

  const { arrowStyle, tooltipStyle } = useMemo(() => {
    if (!positionData) {
      return {
        arrowStyle: { display: "none" },
        tooltipStyle: { display: "none" },
      };
    }

    return getTooltipStyles({
      fontSize,
      minWidth,
      position: positionData.finalPosition,
      rect: positionData.rect,
      tooltipOffset,
      tooltipWidth: positionData.tooltipWidth,
      viewportPadding,
    });
  }, [positionData, fontSize, minWidth, tooltipOffset, viewportPadding]);

  return (
    <Box style={tooltipStyle}>
      {Boolean(showArrow) && <Box style={arrowStyle} />}
      {children}
    </Box>
  );
};
