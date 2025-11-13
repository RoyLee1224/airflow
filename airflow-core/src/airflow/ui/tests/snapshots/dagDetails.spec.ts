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

test.describe("DAG Details Page Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test("captures dag overview dashboard", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator");
    await waitForAppReady(page);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_dashboard",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dag overview grid view", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator/grid");
    await waitForAppReady(page);

    // Wait for grid to render
    await page.waitForTimeout(1000);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_grid",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dag overview graph view", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator/graph");
    await waitForAppReady(page);

    // Wait for graph to render
    await page.waitForTimeout(1500);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_graph",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dag overview code view", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator/code");
    await waitForAppReady(page);

    // Wait for code to render
    await page.waitForTimeout(1000);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_code",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dag overview details tab", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator/details");
    await waitForAppReady(page);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_details",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });

  test("captures dag overview events tab", async ({ page }, testInfo) => {
    await page.goto("/dags/example_bash_operator/events");
    await waitForAppReady(page);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "dag_overview_events",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });
});
