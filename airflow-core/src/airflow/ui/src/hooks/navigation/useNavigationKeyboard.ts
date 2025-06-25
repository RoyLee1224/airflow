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
import type { NavigationCalculator, ArrowKey } from "./NavigationCalculator";
import type { NavigationState } from "./useNavigationState";

const ARROW_KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"] as const;

type NavigationConfig = {
  LONG_PRESS_THRESHOLD: number;
  CONTINUOUS_INTERVAL: number;
  PREVIEW_DELAY: number;
};

type KeyboardState = {
  activeKey: ArrowKey | null;
  currentPreviewIndices: NavigationIndices | null;
  keyPressTime: number;
  timeouts: Array<NodeJS.Timeout>;
};

type Props = {
  isGridFocused: boolean;
  navigationCalculator: NavigationCalculator;
  navigateToPosition: (indices: NavigationIndices) => void;
  applyPreviewEffect: (indices: NavigationIndices | null) => void;
  clearPreviewEffect: () => void;
  setNavigationState: (state: NavigationState) => void;
  resetNavigationState: () => void;
  startPreviewMode: () => void;
  config: NavigationConfig;
};

/**
 * 專門處理鍵盤導航事件的 hook
 * 包含長按檢測、連續導航、預覽模式等複雜邏輯
 */
export const useNavigationKeyboard = ({
  isGridFocused,
  navigationCalculator,
  navigateToPosition,
  applyPreviewEffect,
  clearPreviewEffect,
  setNavigationState,
  resetNavigationState,
  startPreviewMode,
  config,
}: Props) => {
  const { runId, taskId, groupId } = useParams();
  
  const stateRef = useRef<KeyboardState>({
    activeKey: null,
    currentPreviewIndices: null,
    keyPressTime: 0,
    timeouts: [],
  });

  // 清理所有計時器
  const clearTimeouts = useCallback(() => {
    stateRef.current.timeouts.forEach(clearTimeout);
    stateRef.current.timeouts = [];
  }, []);

  // 開始連續導航
  const startContinuous = useCallback((
    key: ArrowKey, 
    isJump: boolean, 
    baseIndices: NavigationIndices
  ) => {
    setNavigationState('continuous');
    
    const navigateStep = () => {
      const newIndices = navigationCalculator.calculateNewIndices(key, isJump, baseIndices);

      // 檢查是否到達邊界
      if (navigationCalculator.areIndicesEqual(newIndices, baseIndices)) {
        return;
      }
       
      applyPreviewEffect(newIndices);
      
      // 更新當前預覽位置
      stateRef.current.currentPreviewIndices = { ...newIndices };
       
      const timeout = setTimeout(navigateStep, config.CONTINUOUS_INTERVAL);
      stateRef.current.timeouts.push(timeout);
       
      // 更新基準位置用於下次迭代
      Object.assign(baseIndices, newIndices);
    };
     
    navigateStep();
  }, [navigationCalculator, applyPreviewEffect, setNavigationState, config.CONTINUOUS_INTERVAL]);

  // 處理按鍵按下
  const handleKeyDown = useCallback((key: ArrowKey, isJump: boolean) => {
    // 防止重複按鍵
    if (stateRef.current.activeKey === key) {
      return;
    }

    const current = navigationCalculator.getCurrentIndices();
    const newIndices = navigationCalculator.calculateNewIndices(key, isJump);

    // 沒有變化就不處理
    if (navigationCalculator.areIndicesEqual(newIndices, current)) {
      return;
    }

    clearTimeouts();

    // 立即跳轉（Cmd/Ctrl + 箭頭鍵）
    if (isJump) {
      navigateToPosition(newIndices);
      return;
    }

    // 設置預覽模式 - 延遲顯示提示避免閃爍
    stateRef.current.activeKey = key;
    stateRef.current.keyPressTime = Date.now();
    
    // 延遲顯示預覽提示，避免快速按鍵時的閃爍
    const showPreviewTimeout = setTimeout(() => {
      if (stateRef.current.activeKey === key) {
        startPreviewMode(); // 延遲顯示預覽模式提示
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
  ]);

  // 處理按鍵釋放
  const handleKeyUp = useCallback((key: ArrowKey) => {
    if (stateRef.current.activeKey !== key) {
      return;
    }

    const pressDuration = Date.now() - stateRef.current.keyPressTime;
    
    clearTimeouts();
    clearPreviewEffect();
    resetNavigationState();
    
    // 根據按鍵時長決定導航位置
    if (pressDuration >= config.LONG_PRESS_THRESHOLD) {
      // 長按 - 使用最後的預覽位置或計算一步移動
      const finalIndices = stateRef.current.currentPreviewIndices ?? 
        navigationCalculator.calculateNewIndices(key, false);
      navigateToPosition(finalIndices);
    } else {
      // 短按 - 立即導航一步
      const newIndices = navigationCalculator.calculateNewIndices(key, false);
      navigateToPosition(newIndices);
    }
    
    // 重置狀態
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

  // 設置熱鍵 - 按下
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

  // 設置熱鍵 - 釋放
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

  // 清理副作用
  useEffect(() => () => {
    clearTimeouts();
    clearPreviewEffect();
  }, [clearTimeouts, clearPreviewEffect]);

  // URL 變化時重置狀態
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