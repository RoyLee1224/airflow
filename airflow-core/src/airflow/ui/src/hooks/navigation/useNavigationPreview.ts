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

import type { GridTask, RunWithDuration } from "src/layouts/Details/Grid/utils";
import type { NavigationIndices } from "../useGridNavigation";

const PREVIEW_STYLES = {
  BACKGROUND_COLOR: "var(--chakra-colors-blue-subtle)",
  PREVIEW_ATTRIBUTE: "data-navigation-preview",
} as const;

const applyTaskPreview = (task: GridTask): void => {
  const safeTaskId = task.id.replaceAll(".", "-");
  const taskElements = document.querySelectorAll<HTMLElement>(`#${safeTaskId}`);

  taskElements.forEach((element) => {
    element.style.backgroundColor = PREVIEW_STYLES.BACKGROUND_COLOR;
    element.setAttribute(PREVIEW_STYLES.PREVIEW_ATTRIBUTE, "true");
  });
};

const applyRunPreview = (run: RunWithDuration): void => {
  const runElements = document.querySelectorAll<HTMLElement>(
    `[data-run-id="${run.dag_run_id}"]`
  );

  runElements.forEach((element) => {
    element.style.backgroundColor = PREVIEW_STYLES.BACKGROUND_COLOR;
    element.setAttribute(PREVIEW_STYLES.PREVIEW_ATTRIBUTE, "true");
  });
};

export const useNavigationPreview = (
  runs: Array<RunWithDuration>,
  flatNodes: Array<GridTask>
) => {
  const clearPreviewEffect = useCallback(() => {
    const previewElements = document.querySelectorAll(
      `[${PREVIEW_STYLES.PREVIEW_ATTRIBUTE}="true"]`
    );
    
    previewElements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      htmlElement.style.backgroundColor = '';
      htmlElement.removeAttribute(PREVIEW_STYLES.PREVIEW_ATTRIBUTE);
    });
  }, []);

  const applyPreviewEffect = useCallback((indices: NavigationIndices | null) => {
    clearPreviewEffect();

    if (!indices) {
      return;
    }

    const run = runs[indices.runIndex];
    const task = flatNodes[indices.taskIndex];
    
    if (!run || !task) {
      return;
    }

    applyTaskPreview(task);
    applyRunPreview(run);
  }, [runs, flatNodes, clearPreviewEffect]);

  return {
    applyPreviewEffect,
    clearPreviewEffect,
  };
};