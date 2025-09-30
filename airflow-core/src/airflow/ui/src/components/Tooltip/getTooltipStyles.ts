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
import { getArrowBorders } from "./tooltipUtils";

type TooltipStylesConfig = {
  readonly fontSize: string;
  readonly minWidth: string;
  readonly position: TooltipPosition;
  readonly rect: DOMRect;
  readonly tooltipOffset: number;
  readonly tooltipWidth: number;
  readonly viewportPadding: number;
};

type TooltipStyles = {
  readonly arrowStyle: React.CSSProperties;
  readonly tooltipStyle: React.CSSProperties;
};

const calculatePositionStyles = (position: TooltipPosition, rect: DOMRect, tooltipOffset: number) => {
  const baseStyles = {
    arrowLeft: "50%",
    arrowTop: "-4px",
    arrowTransform: "translateX(-50%)",
    leftPosition: 0,
    topPosition: 0,
    transform: "translateX(-50%)",
  };

  switch (position) {
    case "bottom-center":
      return {
        ...baseStyles,
        leftPosition: rect.left + globalThis.scrollX + rect.width / 2,
        topPosition: rect.bottom + globalThis.scrollY + tooltipOffset,
      };
    case "right-center":
      return {
        ...baseStyles,
        arrowLeft: "-4px",
        arrowTop: "50%",
        arrowTransform: "translateY(-50%)",
        leftPosition: rect.right + globalThis.scrollX + tooltipOffset,
        topPosition: rect.top + globalThis.scrollY + rect.height / 2,
        transform: "translateY(-50%)",
      };
    case "top-center":
      return {
        ...baseStyles,
        arrowTop: "100%",
        leftPosition: rect.left + globalThis.scrollX + rect.width / 2,
        topPosition: rect.top + globalThis.scrollY - tooltipOffset,
        transform: "translateX(-50%) translateY(-100%)",
      };
    default:
      return baseStyles;
  }
};

type AdjustForViewportBoundsConfig = {
  readonly position: TooltipPosition;
  readonly rect: DOMRect;
  readonly styles: ReturnType<typeof calculatePositionStyles>;
  readonly tooltipWidth: number;
  readonly viewportPadding: number;
};

const adjustForViewportBounds = ({
  position,
  rect,
  styles,
  tooltipWidth,
  viewportPadding,
}: AdjustForViewportBoundsConfig) => {
  const adjustedStyles = { ...styles };

  // Only adjust for center positions that can overflow horizontally
  if (position.includes("center") && position !== "right-center") {
    const viewportWidth = globalThis.innerWidth;
    const tooltipRightEdge = styles.leftPosition + tooltipWidth / 2;
    const tooltipLeftEdge = styles.leftPosition - tooltipWidth / 2;

    if (tooltipRightEdge > viewportWidth) {
      adjustedStyles.leftPosition = viewportWidth - tooltipWidth - viewportPadding;
      adjustedStyles.transform = position === "top-center" ? "translateY(-100%)" : "translateY(0)";
      adjustedStyles.arrowLeft = `${rect.left + rect.width / 2 - (viewportWidth - tooltipWidth - viewportPadding)}px`;
    } else if (tooltipLeftEdge < 0) {
      adjustedStyles.leftPosition = viewportPadding;
      adjustedStyles.transform = position === "top-center" ? "translateY(-100%)" : "translateY(0)";
      adjustedStyles.arrowLeft = `${rect.left + rect.width / 2 - viewportPadding}px`;
    }
  }

  return adjustedStyles;
};

export const getTooltipStyles = ({
  fontSize,
  minWidth,
  position,
  rect,
  tooltipOffset,
  tooltipWidth,
  viewportPadding,
}: TooltipStylesConfig): TooltipStyles => {
  const basePositionStyles = calculatePositionStyles(position, rect, tooltipOffset);
  const adjustedStyles = adjustForViewportBounds({
    position,
    rect,
    styles: basePositionStyles,
    tooltipWidth,
    viewportPadding,
  });

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: "var(--chakra-colors-bg-inverted)",
    borderRadius: "4px",
    color: "var(--chakra-colors-fg-inverted)",
    fontSize,
    left: `${adjustedStyles.leftPosition}px`,
    minWidth,
    padding: "8px",
    position: "absolute",
    top: `${adjustedStyles.topPosition}px`,
    transform: adjustedStyles.transform,
    transition: "opacity 0.2s ease, transform 0.2s ease",
    whiteSpace: "nowrap",
    zIndex: 1000,
  };

  const arrowStyle: React.CSSProperties = {
    content: '""',
    height: 0,
    left: adjustedStyles.arrowLeft,
    position: "absolute",
    top: adjustedStyles.arrowTop,
    transform: adjustedStyles.arrowTransform,
    transition: "opacity 0.2s ease",
    width: 0,
    ...getArrowBorders(position),
  };

  return { arrowStyle, tooltipStyle };
};
