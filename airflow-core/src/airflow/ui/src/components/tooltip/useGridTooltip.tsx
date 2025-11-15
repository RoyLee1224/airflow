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
import { useState, useRef, useCallback, useEffect, type ReactNode, type RefObject } from "react";

type GridTooltipState = {
  content: ReactNode;
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement> | null;
};

type UseGridTooltipReturn = {
  hideTooltip: () => void;
  renderTooltip: () => ReactNode;
  showTooltip: (content: ReactNode, triggerRef: RefObject<HTMLElement>) => void;
};

/**
 * Custom hook for managing a single shared tooltip instance across grid cells
 * This prevents tooltip stacking when quickly moving across multiple grid items
 */
export const useGridTooltip = (openDelay = 400): UseGridTooltipReturn => {
  const [tooltipState, setTooltipState] = useState<GridTooltipState>({
    content: null,
    isOpen: false,
    triggerRef: null,
  });
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(
    (content: ReactNode, triggerRef: RefObject<HTMLElement>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to show the tooltip
      timeoutRef.current = setTimeout(() => {
        setTooltipState({
          content,
          isOpen: true,
          triggerRef,
        });
      }, openDelay);
    },
    [openDelay],
  );

  const hideTooltip = useCallback(() => {
    // Clear any pending show timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    // Immediately hide the tooltip
    setTooltipState({
      content: null,
      isOpen: false,
      triggerRef: null,
    });
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

  const renderTooltip = useCallback(() => {
    if (!tooltipState.isOpen || !tooltipState.triggerRef?.current) {
      return null;
    }

    const rect = tooltipState.triggerRef.current.getBoundingClientRect();

    return (
      <Portal>
        <div
          style={{
            backgroundColor: "var(--chakra-colors-bg-inverted)",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            color: "var(--chakra-colors-fg-inverted)",
            fontSize: "14px",
            left: `${rect.left + globalThis.scrollX + rect.width / 2}px`,
            padding: "8px 12px",
            pointerEvents: "none",
            position: "absolute",
            top: `${rect.top + globalThis.scrollY - 8}px`,
            transform: "translate(-50%, -100%)",
            whiteSpace: "nowrap",
            zIndex: 1500,
          }}
        >
          {tooltipState.content}
          <div
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid var(--chakra-colors-bg-inverted)",
              bottom: "-4px",
              content: '""',
              height: 0,
              left: "50%",
              position: "absolute",
              transform: "translateX(-50%)",
              width: 0,
            }}
          />
        </div>
      </Portal>
    );
  }, [tooltipState]);

  return {
    hideTooltip,
    renderTooltip,
    showTooltip,
  };
};
