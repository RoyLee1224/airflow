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
import { test, expect } from "@playwright/test";
import { setupMockRoutes } from "./helpers/mockRoutes";
import { takeDocScreenshot, waitForAppReady } from "./helpers/screenshot";

test.describe("DAGs List Page Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test("captures dag_list screenshot", async ({ page }, testInfo) => {
    await page.goto("/dags");
    await waitForAppReady(page);

    // Wait for DAG list to load
    await page.waitForSelector('[data-testid="dag-list"], .dag-list, table', {
      timeout: 10000,
    });

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_list",
        fullPage: false,
        viewport: { width: 1280, height: 800 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures home page screenshot", async ({ page }, testInfo) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Wait for home page elements
    await page.waitForSelector('[data-testid="home"], main', {
      timeout: 10000,
    });

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: testInfo.project.name.includes("dark") ? "home_dark" : "home_light",
        fullPage: true,
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dags page with filters", async ({ page }, testInfo) => {
    await page.goto("/dags");
    await waitForAppReady(page);

    // Wait for DAG list
    await page.waitForSelector('[data-testid="dag-list"], table');

    // Try to open filters (if available)
    const filterButton = page.locator('button:has-text("Filters"), [aria-label*="filter"]').first();
    if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_list_with_filters",
        fullPage: false,
        viewport: { width: 1280, height: 800 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });
});
