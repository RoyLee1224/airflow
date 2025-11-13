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
import type { Page } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export interface ScreenshotOptions {
  /**
   * The name of the screenshot file (without extension)
   * Example: "dag_list" will create "dag_list.png"
   */
  name: string;

  /**
   * Optional selector to screenshot a specific element
   * If not provided, screenshots the full page
   */
  selector?: string;

  /**
   * Whether to wait for network idle before taking screenshot
   * Default: true
   */
  waitForNetworkIdle?: boolean;

  /**
   * Additional wait time in milliseconds after page load
   * Default: 500
   */
  additionalWaitTime?: number;

  /**
   * Whether this is a full page screenshot
   * Default: true
   */
  fullPage?: boolean;

  /**
   * Custom viewport for this screenshot
   */
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Helper to take a screenshot and save it to the docs directory
 * This automatically determines light/dark theme from the test project name
 */
export async function takeDocScreenshot(
  page: Page,
  options: ScreenshotOptions,
  projectName: string,
) {
  const {
    name,
    selector,
    waitForNetworkIdle = true,
    additionalWaitTime = 500,
    fullPage = true,
    viewport,
  } = options;

  // Determine theme from project name
  const theme = projectName.includes("dark") ? "dark" : "light";
  const docsDir = join(process.cwd(), "..", "..", "..", "docs", "img", `ui-${theme}`);

  // Ensure directory exists
  mkdirSync(docsDir, { recursive: true });

  // Set viewport if specified
  if (viewport) {
    await page.setViewportSize(viewport);
  }

  // Wait for network to be idle
  if (waitForNetworkIdle) {
    await page.waitForLoadState("networkidle");
  }

  // Additional wait for animations/transitions to complete
  await page.waitForTimeout(additionalWaitTime);

  // Take the screenshot
  const screenshotPath = join(docsDir, `${name}.png`);

  if (selector) {
    const element = page.locator(selector);
    await element.screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({
      path: screenshotPath,
      fullPage,
    });
  }

  return screenshotPath;
}

/**
 * Helper to setup the page with common mock data
 */
export async function setupMockData(page: Page) {
  // Intercept API calls and return mock data
  // This will be expanded with more comprehensive mocks

  await page.route("**/ui/config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        auth_manager: "airflow.providers.fab.auth_manager.fab_auth_manager.FabAuthManager",
        base_date_param: null,
        base_url: "http://localhost:8080",
        dagbag_size: 16,
        default_ui_timezone: "UTC",
        hide_paused_dags_by_default: false,
        navbar_color: "",
        page_size: 25,
        require_confirmation_dag_change: true,
        state_color_mapping: {
          queued: "gray",
          running: "lime",
          success: "green",
          failed: "red",
        },
        test_connection: "Disabled",
        version: "3.0.0.dev0",
      }),
    });
  });
}

/**
 * Wait for the app to be fully loaded and ready
 */
export async function waitForAppReady(page: Page) {
  // Wait for the main app container to be visible
  await page.waitForSelector('[data-testid="main-content"], main, #root > div', {
    timeout: 10000,
  });

  // Wait for any loading spinners to disappear
  await page.waitForSelector('[data-testid="loading"], .loading', {
    state: "detached",
    timeout: 5000,
  }).catch(() => {
    // It's okay if there's no loading spinner
  });
}
