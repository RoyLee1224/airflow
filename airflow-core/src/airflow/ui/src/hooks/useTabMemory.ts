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
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";

import type { TabItem } from "./useRequiredActionTabs";

export const TabStorageKeys = {
  DAG: "tab_view_dag",
  MAPPED_TASK_INSTANCE: "tab_view_mapped_ti",
  RUN: "tab_view_run",
  TASK: "tab_view_task",
  TASK_GROUP: "tab_view_task_group",
  TASK_INSTANCE: "tab_view_ti",
} as const;

export type TabStorageKey = (typeof TabStorageKeys)[keyof typeof TabStorageKeys];

type UseTabMemoryOptions = {
  currentPath: string;
  enabled?: boolean;
  storageKey: TabStorageKey;
  tabs: Array<TabItem>;
};

export const useTabMemory = (options: UseTabMemoryOptions) => {
  const { currentPath, enabled = true, storageKey, tabs } = options;
  const navigate = useNavigate();

  const normalizedPath = currentPath.replace(/\/$/u, "");
  const segments = normalizedPath.split("/");
  const lastSegment = segments[segments.length - 1] ?? "";
  const isTabSegment = tabs.some((tab) => tab.value === lastSegment);
  const baseUrl = isTabSegment && lastSegment !== "" ? segments.slice(0, -1).join("/") : normalizedPath;

  // Use entity-based storage key instead of URL-based key
  const [lastTab, setLastTab] = useLocalStorage<string>(storageKey, tabs[0]?.value ?? "");

  useEffect(() => {
    if (!enabled || tabs.length === 0) {
      return;
    }

    const normalizedCurrentPath = currentPath.replace(/\/$/u, "");
    const normalizedBase = baseUrl.replace(/\/$/u, "");

    const pathSegments = normalizedCurrentPath.split("/");
    const baseSegments = normalizedBase.split("/");
    const currentTab = pathSegments[baseSegments.length] ?? "";

    const isValidTab = tabs.some((tab) => tab.value === currentTab);
    const isLastTabInCurrentTabs = !lastTab || tabs.some((tab) => tab.value === lastTab);

    // Only update localStorage if both currentTab is valid AND lastTab is also in current tabs
    // This prevents different page types (e.g., Task Instance vs Task Group) from overwriting each other's tab memory
    if (isValidTab && isLastTabInCurrentTabs) {
      setLastTab(currentTab);
    }

    const isAtBaseUrl =
      normalizedCurrentPath === normalizedBase || normalizedCurrentPath === `${normalizedBase}/`;
    const hasValidSavedTab = Boolean(lastTab) && tabs.some((tab) => tab.value === lastTab);
    const shouldRedirect = isAtBaseUrl && hasValidSavedTab && lastTab !== tabs[0]?.value;

    if (shouldRedirect) {
      const redirectPath = lastTab ? `${normalizedBase}/${lastTab}` : normalizedBase;

      void Promise.resolve(
        navigate(redirectPath, {
          replace: true,
        }),
      );
    }
  }, [baseUrl, currentPath, enabled, lastTab, navigate, setLastTab, tabs]);
};
