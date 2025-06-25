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
import type { GridTask, RunWithDuration } from "src/layouts/Details/Grid/utils";
import type { NavigationIndices } from "../useGridNavigation";

export type ArrowKey = "ArrowDown" | "ArrowUp" | "ArrowLeft" | "ArrowRight";

type NavigationContext = {
  groupId: string;
  taskId: string;
  runId: string;
};

type NavigationTarget = {
  run: RunWithDuration | null;
  task: GridTask | null;
  isValid: boolean;
};

/**
 * 專門處理網格導航計算的類
 * 將複雜的導航邏輯封裝到一個可測試、可復用的類中
 */
export class NavigationCalculator {
  constructor(
    private readonly flatNodes: Array<GridTask>,
    private readonly runs: Array<RunWithDuration>,
    private readonly context: NavigationContext
  ) {}

  /**
   * 從 URL 參數獲取當前位置
   */
  getCurrentIndices = (): NavigationIndices => {
    const runIndex = Math.max(
      0,
      this.runs.findIndex((run) => run.dag_run_id === this.context.runId)
    );
    
    const currentTaskId = this.context.groupId || this.context.taskId;
    const taskIndex = Math.max(
      0,
      this.flatNodes.findIndex((node) => node.id === currentTaskId)
    );

    return { runIndex, taskIndex };
  };

  /**
   * 計算任務索引的下一個位置
   * 處理任務組的導航邏輯
   */
  getNextTaskIndex(current: number, direction: -1 | 1, isJump: boolean): number {
    // 快速跳轉到邊界
    if (isJump) {
      return direction > 0 ? this.flatNodes.length - 1 : 0;
    }
    
    const next = current + direction;

    // 邊界檢查
    if (next < 0 || next >= this.flatNodes.length) {
      return current;
    }
     
         const currentTask = this.flatNodes[current];
     const isMovingDown = direction === 1;
      
     // 向下移動時，如果當前是展開的組，進入第一個子任務
     if (isMovingDown && currentTask && this.isExpandedGroup(currentTask)) {
       return currentTask.firstChildIndex!;
     }

     // 向上移動時，如果是組的第一個子任務，返回到父組
     if (currentTask && this.shouldReturnToParent(currentTask, next, isMovingDown)) {
       const parentIndex = this.findParentIndex(currentTask, current);
       return parentIndex !== -1 ? parentIndex : next;
     }
     
    return next;
  }

  /**
   * 計算運行索引的下一個位置
   */
  getNextRunIndex(current: number, direction: -1 | 1, isJump: boolean): number {
    if (isJump) {
      return direction > 0 ? this.runs.length - 1 : 0;
    }

    return Math.max(0, Math.min(this.runs.length - 1, current + direction));
  }

  /**
   * 根據箭頭鍵計算新的索引位置
   */
  calculateNewIndices(
    key: ArrowKey,
    isJump: boolean,
    base?: NavigationIndices
  ): NavigationIndices {
    const current = base ?? this.getCurrentIndices();
    
    switch (key) {
      case "ArrowDown":
        return { 
          ...current, 
          taskIndex: this.getNextTaskIndex(current.taskIndex, 1, isJump) 
        };
      case "ArrowLeft":
        return { 
          ...current, 
          runIndex: this.getNextRunIndex(current.runIndex, 1, isJump) 
        };
      case "ArrowRight":
        return { 
          ...current, 
          runIndex: this.getNextRunIndex(current.runIndex, -1, isJump) 
        };
      case "ArrowUp":
        return { 
          ...current, 
          taskIndex: this.getNextTaskIndex(current.taskIndex, -1, isJump) 
        };
      default:
        return current;
    }
  }

  /**
   * 獲取導航目標（任務和運行）
   */
  getNavigationTarget(indices: NavigationIndices): NavigationTarget {
    const run = this.runs[indices.runIndex] ?? null;
    const task = this.flatNodes[indices.taskIndex] ?? null;
    const isValid = Boolean(run && task);

    return { run, task, isValid };
  }

  /**
   * 檢查兩個索引是否相等
   */
  areIndicesEqual(a: NavigationIndices, b: NavigationIndices): boolean {
    return a.runIndex === b.runIndex && a.taskIndex === b.taskIndex;
  }

  // 私有輔助方法

  private isExpandedGroup(task: GridTask): boolean {
    return Boolean(
      task?.isGroup && 
      task.firstChildIndex !== undefined
    );
  }

  private shouldReturnToParent(
    currentTask: GridTask,
    nextIndex: number,
    isMovingDown: boolean
  ): boolean {
    return (
      !isMovingDown &&
      Boolean(this.context.taskId) &&
      !this.context.groupId &&
      Boolean(this.flatNodes[nextIndex]?.isFirstChildOfParent) &&
      Boolean(currentTask?.parentId)
    );
  }

  private findParentIndex(currentTask: GridTask, currentIndex: number): number {
    return this.flatNodes.findIndex((node, index) => 
      index < currentIndex && node.id === currentTask?.parentId
    );
  }
} 