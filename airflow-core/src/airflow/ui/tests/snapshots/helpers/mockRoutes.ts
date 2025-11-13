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
import { mockConfig, mockDags, mockDagDetail, mockDagRuns } from "../fixtures/mockData";

/**
 * Setup all mock API routes for the application
 * This ensures consistent data across all screenshot tests
 */
export async function setupMockRoutes(page: Page) {
  // Mock config endpoint
  await page.route("**/ui/config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockConfig),
    });
  });

  // Mock DAGs list endpoint
  await page.route("**/ui/dags**", async (route) => {
    const url = new URL(route.request().url());
    const limit = Number(url.searchParams.get("limit")) || 25;
    const offset = Number(url.searchParams.get("offset")) || 0;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        dags: mockDags.slice(offset, offset + limit),
        total_entries: mockDags.length,
      }),
    });
  });

  // Mock specific DAG detail endpoint
  await page.route("**/ui/dags/:dagId", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockDagDetail),
    });
  });

  // Mock DAG runs endpoint
  await page.route("**/ui/dags/*/dag_runs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        dag_runs: mockDagRuns,
        total_entries: mockDagRuns.length,
      }),
    });
  });

  // Mock health endpoint
  await page.route("**/ui/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        metadatabase: { status: "healthy" },
        scheduler: { status: "healthy", latest_scheduler_heartbeat: "2025-01-13T10:00:00Z" },
        triggerer: { status: "healthy", latest_triggerer_heartbeat: "2025-01-13T10:00:00Z" },
      }),
    });
  });

  // Mock user info endpoint
  await page.route("**/ui/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        username: "admin",
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        roles: [{ name: "Admin" }],
      }),
    });
  });
}
