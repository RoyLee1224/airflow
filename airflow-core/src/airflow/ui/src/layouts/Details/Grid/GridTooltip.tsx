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
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import type { LightGridTaskInstanceSummary } from "openapi/requests/types.gen";
import Time from "src/components/Time";
import { getDuration } from "src/utils";

type Props = {
  readonly instance: LightGridTaskInstanceSummary;
  readonly taskId: string;
  readonly triggerRef: RefObject<HTMLElement>;
};

export const GridTooltip = ({ instance, taskId, triggerRef }: Props) => {
  const { t: translate } = useTranslation();

  const tooltipStyle = useMemo(() => {
    if (!triggerRef.current) {
      return { display: "none" };
    }

    const rect = triggerRef.current.getBoundingClientRect();

    return {
      backgroundColor: "var(--chakra-colors-bg-inverted)",
      borderRadius: "4px",
      color: "var(--chakra-colors-fg-inverted)",
      fontSize: "12px",
      left: `${rect.right + globalThis.scrollX + 4}px`,
      padding: "8px",
      position: "absolute" as const,
      top: `${rect.bottom + globalThis.scrollY}px`,
      whiteSpace: "nowrap" as const,
      zIndex: 1000,
    };
  }, [triggerRef]);

  const duration = useMemo(() => {
    if (instance.min_start_date === null || instance.max_end_date === null) {
      return undefined;
    }

    return getDuration(instance.min_start_date, instance.max_end_date);
  }, [instance.min_start_date, instance.max_end_date]);

  return (
    <Box style={tooltipStyle}>
      <strong>{translate("taskId")}:</strong> {taskId}
      <br />
      <strong>{translate("state")}:</strong> {instance.state ?? "no_status"}
      {instance.min_start_date !== null && (
        <>
          <br />
          <strong>{translate("startDate")}:</strong> <Time datetime={instance.min_start_date} />
        </>
      )}
      {instance.max_end_date !== null && (
        <>
          <br />
          <strong>{translate("endDate")}:</strong> <Time datetime={instance.max_end_date} />
        </>
      )}
      {Boolean(duration) && (
        <>
          <br />
          <strong>{translate("duration")}:</strong> {duration}
        </>
      )}
      {/* Show child states for mapped tasks */}
      {Boolean(instance.child_states && Object.keys(instance.child_states).length > 0) && (
        <>
          <br />
          <strong>{translate("mappedTasks")}:</strong>{" "}
          {Object.entries(instance.child_states ?? {})
            .map(([state, count]) => `${count} ${state}`)
            .join(", ")}
        </>
      )}
    </Box>
  );
};
