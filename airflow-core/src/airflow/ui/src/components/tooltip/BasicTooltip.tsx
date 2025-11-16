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
import { Portal } from "@chakra-ui/react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cloneElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ManualTooltipConfig, TooltipPlacement } from "./manualTooltipConfig";
import { MANUAL_TOOLTIP_DEFAULTS } from "./manualTooltipConfig";

type Props = {
  /**
   * Trigger element (must be a single React element)
   */
  readonly children: ReactElement;

  /**
   * Tooltip configuration (placement, offset, styles, etc.)
   */
  readonly config?: ManualTooltipConfig;

  /**
   * Tooltip content
   */
  readonly content: ReactNode;

  /**
   * Delay in milliseconds before showing tooltip
   * @default 500
   */
  readonly delayMs?: number;
};

/**
 * Calculate tooltip position based on trigger element and placement
 */
const calculatePosition = (
  rect: DOMRect,
  placement: TooltipPlacement,
  offset: number,
): { left: string; top: string; transform: string } => {
  const { bottom, height, left, right, top, width } = rect;
  const scrollX = globalThis.scrollX;
  const scrollY = globalThis.scrollY;

  switch (placement) {
    case "top":
      return {
        left: `${left + scrollX + width / 2}px`,
        top: `${top + scrollY - offset}px`,
        transform: "translate(-50%, -100%)",
      };

    case "top-start":
      return {
        left: `${left + scrollX}px`,
        top: `${top + scrollY - offset}px`,
        transform: "translateY(-100%)",
      };

    case "top-end":
      return {
        left: `${right + scrollX}px`,
        top: `${top + scrollY - offset}px`,
        transform: "translate(-100%, -100%)",
      };

    case "bottom":
      return {
        left: `${left + scrollX + width / 2}px`,
        top: `${bottom + scrollY + offset}px`,
        transform: "translateX(-50%)",
      };

    case "bottom-start":
      return {
        left: `${left + scrollX}px`,
        top: `${bottom + scrollY + offset}px`,
        transform: "none",
      };

    case "bottom-end":
      return {
        left: `${right + scrollX}px`,
        top: `${bottom + scrollY + offset}px`,
        transform: "translateX(-100%)",
      };

    case "left":
      return {
        left: `${left + scrollX - offset}px`,
        top: `${top + scrollY + height / 2}px`,
        transform: "translate(-100%, -50%)",
      };

    case "right":
      return {
        left: `${right + scrollX + offset}px`,
        top: `${top + scrollY + height / 2}px`,
        transform: "translateY(-50%)",
      };

    default:
      return {
        left: `${left + scrollX + width / 2}px`,
        top: `${top + scrollY - offset}px`,
        transform: "translate(-50%, -100%)",
      };
  }
};

/**
 * Calculate arrow position and style based on placement
 */
const getArrowStyle = (placement: TooltipPlacement, customArrowStyle?: CSSProperties): CSSProperties => {
  const baseStyle: CSSProperties = {
    content: '""',
    height: 0,
    position: "absolute",
    width: 0,
    ...customArrowStyle,
  };

  switch (placement) {
    case "top":
    case "top-start":
    case "top-end":
      return {
        ...baseStyle,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderTop: "4px solid var(--chakra-colors-bg-inverted)",
        bottom: "-4px",
        left: placement === "top" ? "50%" : placement === "top-start" ? "12px" : undefined,
        right: placement === "top-end" ? "12px" : undefined,
        transform: placement === "top" ? "translateX(-50%)" : undefined,
      };

    case "bottom":
    case "bottom-start":
    case "bottom-end":
      return {
        ...baseStyle,
        borderBottom: "4px solid var(--chakra-colors-bg-inverted)",
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        left: placement === "bottom" ? "50%" : placement === "bottom-start" ? "12px" : undefined,
        right: placement === "bottom-end" ? "12px" : undefined,
        top: "-4px",
        transform: placement === "bottom" ? "translateX(-50%)" : undefined,
      };

    case "left":
      return {
        ...baseStyle,
        borderBottom: "4px solid transparent",
        borderLeft: "4px solid var(--chakra-colors-bg-inverted)",
        borderTop: "4px solid transparent",
        right: "-4px",
        top: "50%",
        transform: "translateY(-50%)",
      };

    case "right":
      return {
        ...baseStyle,
        borderBottom: "4px solid transparent",
        borderRight: "4px solid var(--chakra-colors-bg-inverted)",
        borderTop: "4px solid transparent",
        left: "-4px",
        top: "50%",
        transform: "translateY(-50%)",
      };

    default:
      return baseStyle;
  }
};

/**
 * Basic tooltip with integrated hover management and manual positioning
 *
 * This is the foundation component for all tooltips. Use specialized wrappers
 * (TaskInstanceTooltip, CalendarTooltip) for common use cases.
 *
 * @example
 * ```tsx
 * <BasicTooltip
 *   delayMs={500}
 *   content={<div>Tooltip content</div>}
 * >
 *   <Badge>Task</Badge>
 * </BasicTooltip>
 * ```
 */
export const BasicTooltip = ({ children, config, content, delayMs = 500 }: Props): ReactElement => {
  const triggerRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const {
    arrowStyle: customArrowStyle,
    containerStyle: customContainerStyle,
    offset = MANUAL_TOOLTIP_DEFAULTS.offset!,
    placement = MANUAL_TOOLTIP_DEFAULTS.placement!,
    showArrow = MANUAL_TOOLTIP_DEFAULTS.showArrow,
    zIndex = MANUAL_TOOLTIP_DEFAULTS.zIndex,
  } = config ?? {};

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);
  }, [delayMs]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsOpen(false);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const tooltipStyle = useMemo(() => {
    if (!isOpen || !triggerRef.current) {
      return { display: "none" };
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const position = calculatePosition(rect, placement, offset);

    return {
      backgroundColor: "var(--chakra-colors-bg-inverted)",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      color: "var(--chakra-colors-fg-inverted)",
      fontSize: "14px",
      padding: "8px 12px",
      pointerEvents: "none" as const,
      position: "absolute" as const,
      whiteSpace: "nowrap" as const,
      zIndex,
      ...position,
      ...customContainerStyle,
    };
  }, [isOpen, placement, offset, zIndex, customContainerStyle]);

  const arrowStyle = useMemo(() => getArrowStyle(placement, customArrowStyle), [placement, customArrowStyle]);

  // Clone children and attach event handlers + ref
  const trigger = cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ref: triggerRef,
  });

  return (
    <>
      {trigger}
      {isOpen && (
        <Portal>
          <div style={tooltipStyle}>
            {showArrow && <div style={arrowStyle} />}
            {content}
          </div>
        </Portal>
      )}
    </>
  );
};
