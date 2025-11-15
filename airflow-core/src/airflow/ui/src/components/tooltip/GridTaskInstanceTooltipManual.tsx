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
import { useMemo, type ReactElement, type RefObject } from "react";

import type { LightGridTaskInstanceSummary } from "openapi/requests/types.gen";

import { TaskInstanceTooltipContent } from "./TaskInstanceTooltipContent";

type Props = {
  readonly instance: LightGridTaskInstanceSummary;
  readonly showRunId?: boolean;
  readonly showTaskId?: boolean;
  readonly triggerRef: RefObject<HTMLElement>;
};

/**
 * Manual positioned tooltip for Grid view
 * Uses the same positioning strategy as CalendarTooltip for consistent behavior
 * This provides more control over positioning and prevents tooltip stacking
 */
export const GridTaskInstanceTooltipManual = ({
  instance,
  showRunId = false,
  showTaskId = true,
  triggerRef,
}: Props): ReactElement | null => {
  const tooltipStyle = useMemo(() => {
    if (!triggerRef.current) {
      return { display: "none" };
    }

    const rect = triggerRef.current.getBoundingClientRect();

    return {
      backgroundColor: "var(--chakra-colors-bg-inverted)",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      color: "var(--chakra-colors-fg-inverted)",
      fontSize: "14px",
      left: `${rect.left + globalThis.scrollX + rect.width / 2}px`,
      padding: "8px 12px",
      pointerEvents: "none" as const,
      position: "absolute" as const,
      top: `${rect.top + globalThis.scrollY - 8}px`,
      transform: "translate(-50%, -100%)",
      whiteSpace: "nowrap" as const,
      zIndex: 1500,
    };
  }, [triggerRef]);

  const arrowStyle = useMemo(
    () => ({
      borderLeft: "4px solid transparent",
      borderRight: "4px solid transparent",
      borderTop: "4px solid var(--chakra-colors-bg-inverted)",
      bottom: "-4px",
      content: '""',
      height: 0,
      left: "50%",
      position: "absolute" as const,
      transform: "translateX(-50%)",
      width: 0,
    }),
    [],
  );

  return (
    <Portal>
      <div style={tooltipStyle}>
        <div style={arrowStyle} />
        <TaskInstanceTooltipContent
          showRunId={showRunId}
          showTaskId={showTaskId}
          taskInstance={instance}
        />
      </div>
    </Portal>
  );
};
