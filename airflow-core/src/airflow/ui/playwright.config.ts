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
import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration for Playwright tests used for UI snapshot testing
 * and documentation screenshot generation.
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/snapshots",
  // Maximum time one test can run
  timeout: 30 * 1000,
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: Boolean(process.env.CI),
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: "html",
  // Shared settings for all the projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173",
    // Collect trace when retrying the failed test
    trace: "on-first-retry",
    // Screenshots on failure
    screenshot: "only-on-failure",
  },

  // Configure projects for different themes and viewports
  projects: [
    {
      name: "light-theme-desktop",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "dark-theme-desktop",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: "pnpm dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173",
    // Reuse existing server in local dev, start fresh in CI
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
