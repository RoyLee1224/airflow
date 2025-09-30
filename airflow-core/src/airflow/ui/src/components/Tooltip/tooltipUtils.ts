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
import type { TooltipPosition } from "./BaseTooltip";

type PositionOptions = {
  readonly position: TooltipPosition;
  readonly required: number;
  readonly space: number;
};

type TooltipDimensions = {
  readonly estimatedHeight: number;
  readonly offset: number;
  readonly width: number;
};

type ViewportBounds = {
  readonly height: number;
  readonly width: number;
};

type CalculateBestPositionConfig = {
  readonly dimensions: TooltipDimensions;
  readonly preferredPosition: TooltipPosition;
  readonly rect: DOMRect;
  readonly viewport: ViewportBounds;
};

export const calculateBestPosition = ({
  dimensions,
  preferredPosition,
  rect,
  viewport,
}: CalculateBestPositionConfig): TooltipPosition => {
  if (preferredPosition !== "bottom-center") {
    return preferredPosition;
  }

  const spaceBelow = viewport.height - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = viewport.width - rect.right;

  const positions: Array<PositionOptions> = [
    {
      position: "bottom-center",
      required: dimensions.estimatedHeight + dimensions.offset,
      space: spaceBelow,
    },
    { position: "top-center", required: dimensions.estimatedHeight + dimensions.offset, space: spaceAbove },
    { position: "right-center", required: dimensions.width + dimensions.offset, space: spaceRight },
  ];

  // Find first position with enough space
  const viablePosition = positions.find((pos) => pos.space >= pos.required);

  if (viablePosition) {
    return viablePosition.position;
  }

  // Fallback: position with most available space
  const bestPosition = positions.reduce((best, current) => (current.space > best.space ? current : best));

  return bestPosition.position;
};

export const parseMinWidth = (minWidth: string): number => {
  const numericValue = Number.parseInt(minWidth.replaceAll(/\D/gu, ""), 10);

  return Number.isNaN(numericValue) ? 200 : numericValue;
};

type ArrowBorders = {
  readonly borderBottom?: string;
  readonly borderLeft?: string;
  readonly borderRight?: string;
  readonly borderTop?: string;
};

export const getArrowBorders = (position: TooltipPosition): ArrowBorders => {
  const borderColor = "4px solid var(--chakra-colors-bg-inverted)";
  const transparent = "4px solid transparent";

  switch (position) {
    case "bottom-center":
      return {
        borderBottom: borderColor,
        borderLeft: transparent,
        borderRight: transparent,
        borderTop: "none",
      };
    case "right-center":
      return {
        borderBottom: transparent,
        borderLeft: "none",
        borderRight: borderColor,
        borderTop: transparent,
      };
    case "top-center":
      return {
        borderBottom: "none",
        borderLeft: transparent,
        borderRight: transparent,
        borderTop: borderColor,
      };
    default:
      return {
        borderBottom: borderColor,
        borderLeft: transparent,
        borderRight: transparent,
        borderTop: "none",
      };
  }
};
