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
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router-dom";

import type { GridTask, RunWithDuration } from "src/layouts/Details/Grid/utils";
import { getTaskNavigationPath } from "src/utils/links";

const ARROW_KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"] as const;

type ArrowKey = (typeof ARROW_KEYS)[number];

type UseGridNavigationProps = {
  flatNodes: Array<GridTask>;
  isGridFocused: boolean;
  openGroupIds: Array<string>;
  runs: Array<RunWithDuration>;
};

export const useGridNavigation = ({ flatNodes, isGridFocused, openGroupIds, runs }: UseGridNavigationProps) => {
  const navigate = useNavigate();
  const { dagId = "", groupId = "", runId = "", taskId = "" } = useParams();

  const getCurrentIndices = useCallback(() => {
    const currentRunIndex = runs.findIndex((run) => run.dag_run_id === runId);
    const currentTaskId = groupId || taskId;
    const currentTaskIndex = flatNodes.findIndex((node) => node.id === currentTaskId);

    return {
      runIndex: Math.max(0, currentRunIndex),
      taskIndex: Math.max(0, currentTaskIndex),
    };
  }, [runs, flatNodes, runId, taskId, groupId]);

  const navigateToPosition = useCallback(
    (runIndex: number, taskIndex: number) => {
      if (runs.length === 0 || flatNodes.length === 0) {
        return;
      }

      const run = runs[runIndex];
      const task = flatNodes[taskIndex];

      if (!run || !task) {
        return;
      }

      const { search } = globalThis.location;
      const searchParams = new URLSearchParams(search);
      const path = getTaskNavigationPath({
        dagId,
        isGroup: task.isGroup,
        isMapped: Boolean(task.is_mapped),
        runId: run.dag_run_id,
        taskId: task.id,
      });

      navigate(
        {
          pathname: path,
          search: searchParams.toString(),
        },
        { replace: true },
      );
    },
    [navigate, dagId, runs, flatNodes],
  );

  const getNextTaskIndex = useCallback(
    (currentIndex: number, direction: -1 | 1, isQuickJump: boolean) => {
      const maxTaskIndex = flatNodes.length - 1;

      if (isQuickJump) {
        return direction > 0 ? maxTaskIndex : 0;
      }

      const currentTask = flatNodes[currentIndex];
      if (!currentTask) {
        return Math.max(0, Math.min(maxTaskIndex, currentIndex + direction));
      }

      // Moving DOWN: check if we should enter an expanded group
      if (direction === 1 && currentTask.isGroup && currentTask.firstChildIndex !== undefined) {
        return currentTask.firstChildIndex;
      }

      // Moving UP: check if we should return to parent group
      if (direction === -1 && taskId && !groupId && currentTask.isFirstChildOfParent && currentTask.parentId) {
        const parentIndex = flatNodes.findIndex(node => node.id === currentTask.parentId);
        if (parentIndex !== -1) {
          return parentIndex;
        }
      }

      // Default navigation: move to next/previous task
      return Math.max(0, Math.min(maxTaskIndex, currentIndex + direction));
    },
    [flatNodes, groupId, taskId],
  );

  const handleKeyNavigation = useCallback(
    (key: ArrowKey, isQuickJump: boolean) => {
      const { runIndex, taskIndex } = getCurrentIndices();
      const maxRunIndex = runs.length - 1;

      const getRunIndex = (direction: -1 | 1) =>
        isQuickJump
          ? direction > 0
            ? maxRunIndex
            : 0
          : Math.max(0, Math.min(maxRunIndex, runIndex + direction));

      const navigationConfig = {
        ArrowDown: [runIndex, getNextTaskIndex(taskIndex, 1, isQuickJump)],
        ArrowLeft: [getRunIndex(1), taskIndex],
        ArrowRight: [getRunIndex(-1), taskIndex],
        ArrowUp: [runIndex, getNextTaskIndex(taskIndex, -1, isQuickJump)],
      } as const;

      const [newRunIndex, newTaskIndex] = navigationConfig[key];

      navigateToPosition(newRunIndex, newTaskIndex);
    },
    [getCurrentIndices, navigateToPosition, runs.length, getNextTaskIndex],
  );

  const hotkeys = ARROW_KEYS.flatMap((key) => [key, `mod+${key}`]);

  useHotkeys(
    hotkeys,
    (event, _handler) => {
      event.stopPropagation();
      const isQuickJump = event.metaKey || event.ctrlKey;

      handleKeyNavigation(event.key as ArrowKey, isQuickJump);
    },
    {
      enabled: isGridFocused,
      preventDefault: true,
    },
  );

  return {
    getCurrentIndices,
    navigateToPosition,
  };
};
