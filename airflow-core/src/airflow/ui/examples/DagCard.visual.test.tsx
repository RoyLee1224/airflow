/* eslint-disable unicorn/no-null */

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

/**
 * 範例：視覺回歸測試
 *
 * 這個文件展示如何使用 Vitest 4.x Browser Mode 進行視覺回歸測試。
 * 視覺測試可以捕獲實際的像素輸出，檢測 CSS、布局和渲染問題。
 *
 * 注意：這個測試需要在 Browser Mode 下執行
 * 運行命令：pnpm vitest run --browser --config vitest.browser.config.ts
 */

import { render } from "@testing-library/react";
import { expect, test, describe, beforeAll, vi } from "vitest";
import { page } from "@vitest/browser/context";
import i18n from "i18next";
import type { DagTagResponse, DAGWithLatestDagRunsResponse } from "openapi-gen/requests/types.gen";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";
import { TimezoneProvider } from "../src/context/timezone";
import { BaseWrapper } from "../src/utils/Wrapper";
import { DagCard } from "../src/pages/DagsList/DagCard";

// Mock timezone context
vi.mock("../src/context/timezone", async () => {
  const actual = await vi.importActual("../src/context/timezone");

  return {
    ...actual,
    TimezoneProvider: ({ children }: PropsWithChildren) => children,
    useTimezone: () => ({
      selectedTimezone: "UTC",
      setSelectedTimezone: vi.fn(),
    }),
  };
});

// Custom wrapper
const GMTWrapper = ({ children }: PropsWithChildren) => (
  <BaseWrapper>
    <MemoryRouter>
      <TimezoneProvider>{children}</TimezoneProvider>
    </MemoryRouter>
  </BaseWrapper>
);

// 基礎 Mock DAG 數據
const createMockDag = (
  overrides?: Partial<DAGWithLatestDagRunsResponse>
): DAGWithLatestDagRunsResponse => ({
  asset_expression: null,
  bundle_name: "dags-folder",
  bundle_version: "1",
  dag_display_name: "visual_test_dag",
  dag_id: "visual_test_dag",
  description: "Test DAG for visual regression testing",
  file_token: "test_token",
  fileloc: "/files/dags/test.py",
  has_import_errors: false,
  has_task_concurrency_limits: false,
  is_favorite: false,
  is_paused: false,
  is_stale: false,
  last_expired: null,
  last_parse_duration: 0.23,
  last_parsed_time: "2024-01-15T10:00:00+00:00",
  latest_dag_runs: [
    {
      dag_id: "visual_test_dag",
      duration: 10.5,
      end_date: "2024-01-15T10:30:00Z",
      id: 1,
      logical_date: "2024-01-15T10:00:00Z",
      run_after: "2024-01-15T10:00:00Z",
      run_id: "scheduled__2024-01-15T10:00:00+00:00",
      start_date: "2024-01-15T10:00:00Z",
      state: "success",
    },
  ],
  max_active_runs: 16,
  max_active_tasks: 16,
  max_consecutive_failed_dag_runs: 0,
  next_dagrun_data_interval_end: "2024-01-16T00:00:00+00:00",
  next_dagrun_data_interval_start: "2024-01-15T00:00:00+00:00",
  next_dagrun_logical_date: "2024-01-15T00:00:00+00:00",
  next_dagrun_run_after: "2024-01-15T12:00:00+00:00",
  owners: ["airflow"],
  pending_actions: [],
  relative_fileloc: "test.py",
  tags: [],
  timetable_description: "Daily",
  timetable_summary: "0 0 * * *",
  ...overrides,
});

beforeAll(async () => {
  await i18n.init({
    defaultNS: "components",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    lng: "en",
    ns: ["components"],
    resources: {
      en: {
        components: {
          limitedList: "+{{count}} more",
        },
      },
    },
  });
});

describe("DagCard - Visual Regression Tests", () => {
  describe("基本外觀", () => {
    test("應該匹配預設狀態的視覺快照", async () => {
      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      // 等待元件完全渲染（包括 CSS transitions）
      await page.waitForTimeout(200);

      // 截取整個頁面
      const screenshot = await page.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-default",
        threshold: 0.1, // 允許 10% 的像素差異
      });
    });

    test("應該匹配暫停狀態的視覺快照", async () => {
      const mockDag = createMockDag({ is_paused: true });
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(200);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-paused",
        threshold: 0.1,
      });
    });

    test("應該匹配失敗狀態的視覺快照", async () => {
      const mockDag = createMockDag({
        latest_dag_runs: [
          {
            dag_id: "visual_test_dag",
            duration: 10.5,
            end_date: "2024-01-15T10:30:00Z",
            id: 1,
            logical_date: "2024-01-15T10:00:00Z",
            run_after: "2024-01-15T10:00:00Z",
            run_id: "scheduled__2024-01-15T10:00:00+00:00",
            start_date: "2024-01-15T10:00:00Z",
            state: "failed",
          },
        ],
      });

      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      await page.waitForTimeout(200);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-failed",
        threshold: 0.1,
      });
    });
  });

  describe("互動狀態", () => {
    test("應該匹配 hover 狀態的視覺快照", async () => {
      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      // 找到卡片元素並 hover
      const card = await page.locator('[data-testid="dag-card"]');
      await card.hover();

      // 等待 hover 動畫完成
      await page.waitForTimeout(300);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-hover",
        threshold: 0.15, // hover 狀態可能需要更高的容忍度
      });
    });

    test("應該匹配 focus 狀態的視覺快照", async () => {
      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      // 使用 Tab 鍵導航到卡片
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-focus",
        threshold: 0.1,
      });
    });
  });

  describe("標籤顯示", () => {
    test("應該匹配多個標籤的視覺快照", async () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "production" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "critical" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "daily" },
      ];

      const mockDag = createMockDag({ tags });
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(200);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-with-tags",
        threshold: 0.1,
      });
    });

    test("應該匹配超多標籤的視覺快照", async () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag1" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag2" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag3" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag4" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag5" },
        { dag_display_name: "visual_test_dag", dag_id: "visual_test_dag", name: "tag6" },
      ];

      const mockDag = createMockDag({ tags });
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(200);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-many-tags",
        threshold: 0.1,
      });
    });
  });

  describe("元素級別截圖", () => {
    test("應該匹配卡片頭部的視覺快照", async () => {
      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(200);

      // 只截取特定元素
      const header = await page.locator('[data-testid="dag-card-header"]');
      const screenshot = await header.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-header-only",
        threshold: 0.1,
      });
    });

    test("應該匹配狀態徽章的視覺快照", async () => {
      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(200);

      const badge = await page.locator('[data-testid="state-badge"]');
      const screenshot = await badge.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        name: "state-badge-success",
        threshold: 0.05, // 小元素可以使用更嚴格的閾值
      });
    });
  });

  describe("響應式設計", () => {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`應該在 ${name} 視窗正確顯示`, async () => {
        // 設置視窗大小
        await page.setViewportSize({ width, height });

        const mockDag = createMockDag();
        render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

        await page.waitForTimeout(300);

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
          name: `dag-card-${name}`,
          threshold: 0.15, // 響應式變化可能需要更高的容忍度
        });
      });
    });
  });

  describe("暗色主題", () => {
    test("應該匹配亮色主題的視覺快照", async () => {
      // 設置亮色主題
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "light");
      });

      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(300);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-light-theme",
        threshold: 0.1,
      });
    });

    test("應該匹配暗色主題的視覺快照", async () => {
      // 設置暗色主題
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });

      const mockDag = createMockDag();
      render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      await page.waitForTimeout(300);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: "dag-card-dark-theme",
        threshold: 0.1,
      });
    });
  });
});

/**
 * 視覺回歸測試最佳實踐：
 *
 * 1. 設置固定的視窗大小確保一致性
 * 2. 等待動畫和 transitions 完成後再截圖
 * 3. 使用描述性的快照名稱
 * 4. 根據元素大小和複雜度調整閾值
 * 5. 測試不同的主題和響應式斷點
 * 6. 使用元素級別截圖測試特定組件
 * 7. 測試互動狀態（hover, focus, active）
 * 8. 在 CI 環境中使用 headless 模式
 *
 * 常見問題排查：
 * - 字體渲染差異：使用系統字體或確保字體已加載
 * - 動畫問題：增加等待時間或禁用動畫
 * - 時間相關：使用固定的測試數據
 * - 隨機值：避免使用隨機 ID 或顏色
 */
