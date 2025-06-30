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
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { GridRunsResponse } from "openapi/requests";
import { useOpenGroups } from "src/context/openGroups";

import type { GridTask } from "./utils";

type NavigationMode = "task" | "run" | "grid";

interface GridNavigationState {
  currentTaskIndex: number;
  currentRunIndex: number;
  mode: NavigationMode;
  isPreviewMode: boolean;
}

interface UseGridNavigationProps {
  nodes: Array<GridTask>;
  runs: Array<GridRunsResponse>;
}

export const useGridNavigation = ({ nodes, runs }: UseGridNavigationProps) => {
  const navigate = useNavigate();
  const { dagId = "", runId = "", taskId = "", groupId = "" } = useParams();
  const { toggleGroupId } = useOpenGroups();

  const [state, setState] = useState<GridNavigationState>({
    currentTaskIndex: 0,
    currentRunIndex: 0,
    mode: "grid",
    isPreviewMode: false,
  });

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keyPressTimeRef = useRef<number>(0);
  const LONG_PRESS_DURATION = 500; // ms

  // Initialize current indices based on URL params
  useEffect(() => {
    const currentTask = taskId || groupId;
    const taskIndex = currentTask ? nodes.findIndex((node) => node.id === currentTask) : 0;
    const runIndex = runId ? runs.findIndex((run) => run.run_id === runId) : 0;

    setState((prev) => ({
      ...prev,
      currentTaskIndex: taskIndex >= 0 ? taskIndex : 0,
      currentRunIndex: runIndex >= 0 ? runIndex : 0,
    }));
  }, [taskId, groupId, runId, nodes, runs]);

  const navigateToTaskRun = useCallback(
    (taskIndex: number, runIndex: number, isPreview = false) => {
      if (taskIndex < 0 || taskIndex >= nodes.length || runIndex < 0 || runIndex >= runs.length) {
        return;
      }

      const task = nodes[taskIndex];
      const run = runs[runIndex];

      if (!task || !run) return;

      const basePath = `/dags/${dagId}`;
      let targetPath: string;

      if (state.mode === "task") {
        // Task mode: navigate to task with current run
        if (task.isGroup) {
          targetPath = `${basePath}/tasks/group/${task.id}`;
        } else {
          targetPath = `${basePath}/tasks/${task.id}`;
        }
      } else if (state.mode === "run") {
        // Run mode: navigate to run with current task
        if (task.isGroup) {
          targetPath = `${basePath}/runs/${run.run_id}/tasks/group/${task.id}`;
        } else {
          targetPath = `${basePath}/runs/${run.run_id}/tasks/${task.id}`;
        }
      } else {
        // Grid mode: navigate to specific task and run
        if (task.isGroup) {
          targetPath = `${basePath}/runs/${run.run_id}/tasks/group/${task.id}`;
        } else {
          targetPath = `${basePath}/runs/${run.run_id}/tasks/${task.id}`;
        }
      }

      if (isPreview) {
        // For preview mode, we could show a tooltip or highlight without navigation
        // For now, we'll just update the state without navigation
        setState((prev) => ({
          ...prev,
          currentTaskIndex: taskIndex,
          currentRunIndex: runIndex,
          isPreviewMode: true,
        }));
      } else {
        navigate(targetPath, { replace: true });
        setState((prev) => ({
          ...prev,
          currentTaskIndex: taskIndex,
          currentRunIndex: runIndex,
          isPreviewMode: false,
        }));
      }
    },
    [dagId, navigate, nodes, runs, state.mode],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { key, metaKey, ctrlKey } = event;
      const isModifierPressed = metaKey || ctrlKey;
      
      keyPressTimeRef.current = Date.now();

      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();

        // Start long press timer for preview mode
        if (!longPressTimeoutRef.current) {
          longPressTimeoutRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, isPreviewMode: true }));
          }, LONG_PRESS_DURATION);
        }

        let newTaskIndex = state.currentTaskIndex;
        let newRunIndex = state.currentRunIndex;

        if (isModifierPressed) {
          // Cmd/Ctrl + Arrow: Jump to edges
          switch (key) {
            case "ArrowUp":
              newTaskIndex = 0;
              break;
            case "ArrowDown":
              newTaskIndex = nodes.length - 1;
              break;
            case "ArrowLeft":
              newRunIndex = 0;
              break;
            case "ArrowRight":
              newRunIndex = runs.length - 1;
              break;
          }
        } else {
          // Regular navigation
          switch (key) {
            case "ArrowUp":
              if (state.mode === "run") {
                // In run mode, only move vertically
                setState((prev) => ({ ...prev, mode: "grid" }));
              }
              newTaskIndex = Math.max(0, state.currentTaskIndex - 1);
              break;
            case "ArrowDown":
              if (state.mode === "run") {
                // In run mode, only move vertically
                setState((prev) => ({ ...prev, mode: "grid" }));
              }
              newTaskIndex = Math.min(nodes.length - 1, state.currentTaskIndex + 1);
              break;
            case "ArrowLeft":
              if (state.mode === "task") {
                // In task mode, only move horizontally
                setState((prev) => ({ ...prev, mode: "grid" }));
              }
              newRunIndex = Math.max(0, state.currentRunIndex - 1);
              break;
            case "ArrowRight":
              if (state.mode === "task") {
                // In task mode, only move horizontally
                setState((prev) => ({ ...prev, mode: "grid" }));
              }
              newRunIndex = Math.min(runs.length - 1, state.currentRunIndex + 1);
              break;
          }
        }

        // Handle group expansion/collapse
        if (key === "ArrowRight" && state.mode === "task") {
          const currentTask = nodes[state.currentTaskIndex];
          if (currentTask?.isGroup && !currentTask.isOpen) {
            toggleGroupId(currentTask.id);
            return;
          }
        } else if (key === "ArrowLeft" && state.mode === "task") {
          const currentTask = nodes[state.currentTaskIndex];
          if (currentTask?.isGroup && currentTask.isOpen) {
            toggleGroupId(currentTask.id);
            return;
          }
        }

        navigateToTaskRun(newTaskIndex, newRunIndex, state.isPreviewMode);
      }

      // Enter key to confirm navigation in preview mode
      if (key === "Enter" && state.isPreviewMode) {
        event.preventDefault();
        setState((prev) => ({ ...prev, isPreviewMode: false }));
        navigateToTaskRun(state.currentTaskIndex, state.currentRunIndex, false);
      }

      // Escape key to exit preview mode
      if (key === "Escape" && state.isPreviewMode) {
        event.preventDefault();
        setState((prev) => ({ ...prev, isPreviewMode: false }));
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }

      // Space key to toggle between navigation modes
      if (key === " " || key === "Space") {
        event.preventDefault();
        const modes: NavigationMode[] = ["grid", "task", "run"];
        const currentIndex = modes.indexOf(state.mode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setState((prev) => ({ ...prev, mode: nextMode }));
      }
    },
    [state, nodes, runs, navigateToTaskRun, toggleGroupId],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      
      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        // Clear long press timer
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }

        // If we were in preview mode and released the key, commit the navigation
        if (state.isPreviewMode) {
          const keyPressDuration = Date.now() - keyPressTimeRef.current;
          if (keyPressDuration >= LONG_PRESS_DURATION) {
            // Long press completed - commit navigation
            navigateToTaskRun(state.currentTaskIndex, state.currentRunIndex, false);
          }
          setState((prev) => ({ ...prev, isPreviewMode: false }));
        }
      }
    },
    [state.isPreviewMode, state.currentTaskIndex, state.currentRunIndex, navigateToTaskRun],
  );

  const setNavigationMode = useCallback((mode: NavigationMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    currentTaskIndex: state.currentTaskIndex,
    currentRunIndex: state.currentRunIndex,
    navigationMode: state.mode,
    isPreviewMode: state.isPreviewMode,
    setNavigationMode,
  };
};