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
import { Box, Flex } from "@chakra-ui/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { RefObject } from "react";
import { Link } from "react-router-dom";

import { HoverTooltip } from "src/components/HoverTooltip";
import type { TaskInstanceResponse } from "openapi/requests/types.gen";
import { TaskRecentRunsTooltipManual } from "src/components/tooltip/TaskRecentRunsTooltipManual";
import { getTaskInstanceLink } from "src/utils/links";

dayjs.extend(duration);

const BAR_HEIGHT = 60;

export const TaskRecentRuns = ({
  taskInstances,
}: {
  readonly taskInstances: Array<TaskInstanceResponse>;
}) => {
  if (!taskInstances.length) {
    return undefined;
  }

  const taskInstancesWithDuration = taskInstances.map((taskInstance) => ({
    ...taskInstance,
    duration:
      dayjs.duration(dayjs(taskInstance.end_date ?? dayjs()).diff(taskInstance.start_date)).asSeconds() || 0,
  }));

  const max = Math.max.apply(
    undefined,
    taskInstancesWithDuration.map((taskInstance) => taskInstance.duration),
  );

  return (
    <Flex alignItems="flex-end" flexDirection="row-reverse">
      {taskInstancesWithDuration.map((taskInstance) => (
        <HoverTooltip
          delayMs={500}
          key={taskInstance.dag_run_id}
          tooltip={(triggerRef: RefObject<HTMLElement>) => (
            <TaskRecentRunsTooltipManual taskInstance={taskInstance} triggerRef={triggerRef} />
          )}
        >
          <Link to={getTaskInstanceLink(taskInstance)}>
            <Box p={1}>
              <Box
                bg={`${taskInstance.state ?? "none"}.solid`}
                borderRadius="4px"
                height={`${(taskInstance.duration / max) * BAR_HEIGHT}px`}
                minHeight={1}
                width="4px"
              />
            </Box>
          </Link>
        </HoverTooltip>
      ))}
    </Flex>
  );
};
