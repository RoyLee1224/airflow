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
import { useCallback, useState } from "react";

export type NavigationState = 'continuous' | 'idle' | 'previewing';

/**
 * 專門管理導航狀態的 hook
 * 將狀態邏輯從主 hook 中分離出來，提高可維護性
 */
export const useNavigationState = () => {
  const [isInPreviewMode, setIsInPreviewMode] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState>('idle');

  const resetNavigationState = useCallback(() => {
    setIsInPreviewMode(false);
    setNavigationState('idle');
  }, []);

  const startPreviewMode = useCallback(() => {
    setIsInPreviewMode(true);
    setNavigationState('previewing');
  }, []);

  const startContinuousMode = useCallback(() => {
    setNavigationState('continuous');
  }, []);

  return {
    isInPreviewMode,
    navigationState,
    setNavigationState,
    resetNavigationState,
    startPreviewMode,
    startContinuousMode,
  };
}; 