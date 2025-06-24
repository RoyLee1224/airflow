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
import { useCallback, useRef, useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router-dom";

import type { GridTask, RunWithDuration } from "src/layouts/Details/Grid/utils";
import { getTaskNavigationPath } from "src/utils/links";

const ARROW_KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"] as const;
const LONG_PRESS_THRESHOLD = 200;
const CONTINUOUS_INTERVAL = 150;

type ArrowKey = (typeof ARROW_KEYS)[number];

type Props = {
  flatNodes: Array<GridTask>;
  isGridFocused: boolean;
  runs: Array<RunWithDuration>;
};

type NavigationIndices = {
  runIndex: number;
  taskIndex: number;
};

export const useGridNavigation = ({ flatNodes, isGridFocused, runs }: Props) => {
  const navigate = useNavigate();
  const { dagId = "", groupId = "", runId = "", taskId = "" } = useParams();
  
  const [isInPreviewMode, setIsInPreviewMode] = useState(false);
  const [navigationState, setNavigationState] = useState<'continuous' | 'idle' | 'previewing'>('idle');
  
  const stateRef = useRef({
    activeKey: null as ArrowKey | null,
    currentPreviewIndices: null as NavigationIndices | null,
    keyPressTime: 0,
    timeouts: [] as Array<NodeJS.Timeout>,
  });

  // Get current position from URL
  const getCurrentIndices = useCallback((): NavigationIndices => {
    const runIndex = Math.max(0, runs.findIndex((run) => run.dag_run_id === runId));
    const currentTaskId = groupId || taskId;
    const taskIndex = Math.max(0, flatNodes.findIndex((node) => node.id === currentTaskId));

    return { runIndex, taskIndex };
  }, [runs, flatNodes, runId, taskId, groupId]);

  // Calculate next task index with TaskGroup navigation
  const getNextTaskIndex = useCallback((current: number, direction: -1 | 1, isJump: boolean) => {
    if (isJump) {
      return direction > 0 ? flatNodes.length - 1 : 0;
    }
    
    const next = current + direction;

    if (next < 0 || next >= flatNodes.length) {
      return current;
    }
     
    const currentTask = flatNodes[current];
    const isMovingDown = direction === 1;
     
    // Enter expanded group
    if (isMovingDown && currentTask?.isGroup && currentTask.firstChildIndex !== undefined) {
      return currentTask.firstChildIndex;
    }

    // Return to parent from first child
    if (!isMovingDown && Boolean(taskId) && !groupId && flatNodes[next]?.isFirstChildOfParent && Boolean(currentTask?.parentId)) {
      const parentIndex = flatNodes.findIndex((node, index) => 
        index < current && node.id === currentTask?.parentId
      );

      return parentIndex === -1 ? next : parentIndex;
    }
     
    return next;
  }, [flatNodes, taskId, groupId]);

  // Calculate next run index
  const getNextRunIndex = useCallback((current: number, direction: -1 | 1, isJump: boolean) => {
    if (isJump) {
      return direction > 0 ? runs.length - 1 : 0;
    }

    return Math.max(0, Math.min(runs.length - 1, current + direction));
  }, [runs.length]);

  // Apply visual effects
  const applyPreviewEffect = useCallback((indices: NavigationIndices | null) => {
    // Clear existing effects
    document.querySelectorAll('[data-navigation-preview="true"]').forEach((element) => {
      const htmlElement = element as HTMLElement;

      htmlElement.style.backgroundColor = '';
      htmlElement.dataset.navigationPreview = "";
    });

    if (!indices) {
      return;
    }

    const run = runs[indices.runIndex];
    const task = flatNodes[indices.taskIndex];
    
    if (!run || !task) {
      return;
    }

    // Apply to task elements
    const taskElements = document.querySelectorAll<HTMLElement>(`#${task.id.replaceAll(".", "-")}`);

    taskElements.forEach((element) => {
      element.style.backgroundColor = "var(--chakra-colors-blue-subtle)";
      element.dataset.navigationPreview = "true";
    });

    // Apply to run column
    const runElements = document.querySelectorAll<HTMLElement>(`[data-run-id="${run.dag_run_id}"]`);

    runElements.forEach((element) => {
      element.style.backgroundColor = "var(--chakra-colors-blue-subtle)";
      element.dataset.navigationPreview = "true";
    });
  }, [runs, flatNodes]);

  // Execute navigation
  const navigateToPosition = useCallback((indices: NavigationIndices) => {
    const run = runs[indices.runIndex];
    const task = flatNodes[indices.taskIndex];

    if (!run || !task) {
      return;
    }

    const { search } = globalThis.location;
    const path = getTaskNavigationPath({
      dagId,
      isGroup: task.isGroup,
      isMapped: Boolean(task.is_mapped),
      runId: run.dag_run_id,
      taskId: task.id,
    });

    navigate({ pathname: path, search }, { replace: true });
  }, [navigate, dagId, runs, flatNodes]);

  // Calculate new indices for a key
  const calculateNewIndices = useCallback((key: ArrowKey, isJump: boolean, base?: NavigationIndices) => {
    const current = base ?? getCurrentIndices();
    
    switch (key) {
      case "ArrowDown":
        return { ...current, taskIndex: getNextTaskIndex(current.taskIndex, 1, isJump) };
      case "ArrowLeft":
        return { ...current, runIndex: getNextRunIndex(current.runIndex, 1, isJump) };
      case "ArrowRight":
        return { ...current, runIndex: getNextRunIndex(current.runIndex, -1, isJump) };
      case "ArrowUp":
        return { ...current, taskIndex: getNextTaskIndex(current.taskIndex, -1, isJump) };
      default:
        return current;
    }
  }, [getCurrentIndices, getNextTaskIndex, getNextRunIndex]);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    stateRef.current.timeouts.forEach(clearTimeout);
    stateRef.current.timeouts = [];
  }, []);

  // Start continuous navigation
  const startContinuous = useCallback((key: ArrowKey, isJump: boolean, baseIndices: NavigationIndices) => {
    setNavigationState('continuous');
    
    const navigateStep = () => {
      const newIndices = calculateNewIndices(key, isJump, baseIndices);

      if (newIndices.runIndex === baseIndices.runIndex && newIndices.taskIndex === baseIndices.taskIndex) {
        return; // Reached boundary
      }
       
      applyPreviewEffect(newIndices);
      
      // Update current preview position
      stateRef.current.currentPreviewIndices = { ...newIndices };
       
      const timeout = setTimeout(navigateStep, CONTINUOUS_INTERVAL);

      stateRef.current.timeouts.push(timeout);
       
      // Update base for next iteration
      Object.assign(baseIndices, newIndices);
    };
     
    navigateStep();
  }, [calculateNewIndices, applyPreviewEffect]);

  // Handle key press
  const handleKeyDown = useCallback((key: ArrowKey, isJump: boolean) => {
    if (stateRef.current.activeKey === key) {
      return;
    }

    const current = getCurrentIndices();
    const newIndices = calculateNewIndices(key, isJump);

    // No change
    if (newIndices.runIndex === current.runIndex && newIndices.taskIndex === current.taskIndex) {
      return;
    }

    clearTimeouts();

    // Immediate navigation for quick jump
    if (isJump) {
      navigateToPosition(newIndices);

      return;
    }

    // Set up preview mode
    stateRef.current.activeKey = key;
    stateRef.current.keyPressTime = Date.now();
    setIsInPreviewMode(true);
    setNavigationState('previewing');

    const timeout = setTimeout(() => {
      if (stateRef.current.activeKey === key) {
        applyPreviewEffect(newIndices);
        // Set initial preview position
        stateRef.current.currentPreviewIndices = { ...newIndices };
        startContinuous(key, isJump, { ...newIndices });
      }
    }, LONG_PRESS_THRESHOLD);
    
    stateRef.current.timeouts.push(timeout);
  }, [getCurrentIndices, calculateNewIndices, clearTimeouts, navigateToPosition, applyPreviewEffect, startContinuous]);

  // Handle key release
  const handleKeyUp = useCallback((key: ArrowKey) => {
    if (stateRef.current.activeKey !== key) {
      return;
    }

    const pressDuration = Date.now() - stateRef.current.keyPressTime;
    
    clearTimeouts();
    applyPreviewEffect(null);
    setIsInPreviewMode(false);
    setNavigationState('idle');
    
    // Navigate to final position
    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      // Use the last preview position if available, otherwise calculate one step
      const finalIndices = stateRef.current.currentPreviewIndices ?? calculateNewIndices(key, false);

      navigateToPosition(finalIndices);
    } else {
      // Short press - immediate navigation
      const newIndices = calculateNewIndices(key, false);

      navigateToPosition(newIndices);
    }
    
    // Reset state
    stateRef.current.activeKey = null;
    stateRef.current.currentPreviewIndices = null;
  }, [clearTimeouts, applyPreviewEffect, calculateNewIndices, navigateToPosition]);

  // Setup hotkeys
  useHotkeys(
    ARROW_KEYS.flatMap((key) => [key, `mod+${key}`]),
    (event) => {
      event.stopPropagation();
      handleKeyDown(event.key as ArrowKey, event.metaKey || event.ctrlKey);
    },
    { 
      enabled: isGridFocused, 
      keydown: true, 
      keyup: false,
      preventDefault: true,
    }
  );

  useHotkeys(
    ARROW_KEYS.flatMap((key) => [key, `mod+${key}`]),
    (event) => {
      event.stopPropagation();
      handleKeyUp(event.key as ArrowKey);
    },
    { 
      enabled: isGridFocused, 
      keydown: false, 
      keyup: true, 
      preventDefault: true,
    }
  );

  // Cleanup on unmount or URL change
  useEffect(() => () => {
    clearTimeouts();
    applyPreviewEffect(null);
  }, [clearTimeouts, applyPreviewEffect]);

  useEffect(() => {
    clearTimeouts();
    applyPreviewEffect(null);
    setIsInPreviewMode(false);
    setNavigationState('idle');
    stateRef.current.activeKey = null;
    stateRef.current.currentPreviewIndices = null;
  }, [runId, taskId, groupId, clearTimeouts, applyPreviewEffect]);

  return {
    getCurrentIndices,
    isInPreviewMode,
    navigateToPosition,
    navigationState,
  };
};
