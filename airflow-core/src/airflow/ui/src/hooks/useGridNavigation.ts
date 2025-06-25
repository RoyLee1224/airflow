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
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { GridTask, RunWithDuration } from "src/layouts/Details/Grid/utils";
import { getTaskNavigationPath } from "src/utils/links";

import { NavigationCalculator } from "./navigation/NavigationCalculator";
import { useNavigationKeyboard } from "./navigation/useNavigationKeyboard";
import { useNavigationPreview } from "./navigation/useNavigationPreview";
import { useNavigationState } from "./navigation/useNavigationState";

// 配置常量 - 優化的UX時序設計
export const NAVIGATION_CONFIG = {
  CONTINUOUS_INTERVAL: 100,  // 連續導航間隔 (毫秒) - 流暢的連續導航
  LONG_PRESS_THRESHOLD: 500, // 長按閾值 (毫秒) - 明確的長按意圖
  PREVIEW_DELAY: 200,        // 預覽延遲 (毫秒) - 避免快速操作時的閃爍
} as const;

export type NavigationIndices = {
  runIndex: number;
  taskIndex: number;
};

type Props = {
  flatNodes: Array<GridTask>;
  isGridFocused: boolean;
  runs: Array<RunWithDuration>;
};

export const useGridNavigation = ({ flatNodes, isGridFocused, runs }: Props) => {
  const navigate = useNavigate();
  const { dagId = "", groupId = "", runId = "", taskId = "" } = useParams();
  
  // 創建導航計算器實例 - 使用 useMemo 避免重新創建
  const navigationCalculator = useMemo(
    () => new NavigationCalculator(flatNodes, runs, { groupId, runId, taskId }),
    [flatNodes, runs, groupId, taskId, runId]
  );

  // 分離關注點：狀態管理
  const {
    isInPreviewMode,
    navigationState,
    resetNavigationState,
    setNavigationState,
    startPreviewMode,
  } = useNavigationState();

  // 分離關注點：視覺預覽效果
  const { applyPreviewEffect, clearPreviewEffect } = useNavigationPreview(
    runs,
    flatNodes
  );

  // 導航執行函數
  const navigateToPosition = useCallback((indices: NavigationIndices) => {
    const { isValid, run, task } = navigationCalculator.getNavigationTarget(indices);
    
    if (!isValid || !run || !task) {
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
  }, [navigate, dagId, navigationCalculator]);

  // 分離關注點：鍵盤事件處理
  const keyboardHandlers = useNavigationKeyboard({
    applyPreviewEffect,
    clearPreviewEffect,
    config: NAVIGATION_CONFIG,
    isGridFocused,
    navigateToPosition,
    navigationCalculator,
    resetNavigationState,
    setNavigationState,
    startPreviewMode,
  });

  return {
    getCurrentIndices: navigationCalculator.getCurrentIndices,
    isInPreviewMode,
    navigateToPosition,
    navigationState,
    ...keyboardHandlers,
  };
};
