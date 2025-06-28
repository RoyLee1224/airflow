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
import { useCallback, useRef, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams } from "react-router-dom";

import type { NavigationIndices } from "../useGridNavigation";
import { NavigationCalculator, type ArrowKey } from "./NavigationCalculator";
import type { NavigationState } from "./useNavigationState";

const ARROW_KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"] as const;

type NavigationConfig = {
  CONTINUOUS_INTERVAL: number;
  LONG_PRESS_THRESHOLD: number;
  PREVIEW_DELAY: number;
};

type KeyboardState = {
  activeKey: ArrowKey | null;
  currentPreviewIndices: NavigationIndices | null;
  keyPressTime: number;
  timeouts: Array<NodeJS.Timeout>;
};

type Props = {
  applyPreviewEffect: (indices: NavigationIndices | null) => void;
  clearPreviewEffect: () => void;
  config: NavigationConfig;
  isGridFocused: boolean;
  navigateToPosition: (indices: NavigationIndices) => void;
  navigationCalculator: NavigationCalculator;
  resetNavigationState: () => void;
  setNavigationState: (state: NavigationState) => void;
  startPreviewMode: () => void;
};

export const useNavigationKeyboard = ({
  applyPreviewEffect,
  clearPreviewEffect,
  config,
  isGridFocused,
  navigateToPosition,
  navigationCalculator,
  resetNavigationState,
  setNavigationState,
  startPreviewMode,
}: Props) => {
  const { groupId, runId, taskId } = useParams();
  
  const stateRef = useRef<KeyboardState>({
    activeKey: null,
    currentPreviewIndices: null,
    keyPressTime: 0,
    timeouts: [],
  });

  const clearTimeouts = useCallback(() => {
    stateRef.current.timeouts.forEach(clearTimeout);
    stateRef.current.timeouts = [];
  }, []);

  const startContinuous = useCallback((
    key: ArrowKey, 
    isJump: boolean, 
    baseIndices: NavigationIndices
  ) => {
    setNavigationState('continuous');
    
    const navigateStep = () => {
      const newIndices = navigationCalculator.calculateNewIndices(key, isJump, baseIndices);

      if (NavigationCalculator.areIndicesEqual(newIndices, baseIndices)) {
        return;
      }
       
      applyPreviewEffect(newIndices);
      stateRef.current.currentPreviewIndices = { ...newIndices };
       
      const timeout = setTimeout(navigateStep, config.CONTINUOUS_INTERVAL);

      stateRef.current.timeouts.push(timeout);
      Object.assign(baseIndices, newIndices);
    };
     
    navigateStep();
  }, [navigationCalculator, applyPreviewEffect, setNavigationState, config.CONTINUOUS_INTERVAL]);

  const handleKeyDown = useCallback((key: ArrowKey, isJump: boolean) => {
    if (stateRef.current.activeKey === key) {
      return;
    }

    const current = navigationCalculator.getCurrentIndices();
    const newIndices = navigationCalculator.calculateNewIndices(key, isJump);

    if (NavigationCalculator.areIndicesEqual(newIndices, current)) {
      return;
    }

    clearTimeouts();

    if (isJump) {
      navigateToPosition(newIndices);

      return;
    }

    stateRef.current.activeKey = key;
    stateRef.current.keyPressTime = Date.now();
    
    const showPreviewTimeout = setTimeout(() => {
      if (stateRef.current.activeKey === key) {
        startPreviewMode();
      }
    }, config.PREVIEW_DELAY);

    stateRef.current.timeouts.push(showPreviewTimeout);

    const longPressTimeout = setTimeout(() => {
      if (stateRef.current.activeKey === key) {
        applyPreviewEffect(newIndices);
        stateRef.current.currentPreviewIndices = { ...newIndices };
        startContinuous(key, isJump, { ...newIndices });
      }
    }, config.LONG_PRESS_THRESHOLD);
    
    stateRef.current.timeouts.push(longPressTimeout);
  }, [
    navigationCalculator,
    clearTimeouts,
    navigateToPosition,
    startPreviewMode,
    applyPreviewEffect,
    startContinuous,
    config.LONG_PRESS_THRESHOLD,
    config.PREVIEW_DELAY,
  ]);

  const handleKeyUp = useCallback((key: ArrowKey) => {
    if (stateRef.current.activeKey !== key) {
      return;
    }

    const pressDuration = Date.now() - stateRef.current.keyPressTime;
    
    clearTimeouts();
    clearPreviewEffect();
    resetNavigationState();
    
    if (pressDuration >= config.LONG_PRESS_THRESHOLD) {
      const finalIndices = stateRef.current.currentPreviewIndices ?? 
        navigationCalculator.calculateNewIndices(key, false);

      navigateToPosition(finalIndices);
    } else {
      const newIndices = navigationCalculator.calculateNewIndices(key, false);

      navigateToPosition(newIndices);
    }
    
    stateRef.current.activeKey = null;
    stateRef.current.currentPreviewIndices = null;
  }, [
    clearTimeouts,
    clearPreviewEffect,
    resetNavigationState,
    config.LONG_PRESS_THRESHOLD,
    navigationCalculator,
    navigateToPosition,
  ]);

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

  useEffect(() => () => {
    clearTimeouts();
    clearPreviewEffect();
  }, [clearTimeouts, clearPreviewEffect]);

  useEffect(() => {
    clearTimeouts();
    clearPreviewEffect();
    resetNavigationState();
    stateRef.current.activeKey = null;
    stateRef.current.currentPreviewIndices = null;
  }, [runId, taskId, groupId, clearTimeouts, clearPreviewEffect, resetNavigationState]);

  return {
    handleKeyDown,
    handleKeyUp,
  };
}; 