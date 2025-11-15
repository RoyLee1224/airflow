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
 * 範例：複雜元件的快照測試
 *
 * 展示如何為 DagCard 這種複雜元件創建全面的快照測試，
 * 包括不同的 props 組合和狀態變化。
 */

import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
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
  dag_display_name: "test_dag",
  dag_id: "test_dag",
  description: null,
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
      dag_id: "test_dag",
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

describe("DagCard - Snapshot Tests", () => {
  describe("基本狀態", () => {
    it("應該匹配無標籤的 DAG 快照", () => {
      const mockDag = createMockDag();
      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      expect(container).toMatchSnapshot();
    });

    it("應該匹配暫停狀態的 DAG 快照", () => {
      const mockDag = createMockDag({ is_paused: true });
      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      expect(container).toMatchSnapshot();
    });

    it("應該匹配標記為最愛的 DAG 快照", () => {
      const mockDag = createMockDag({ is_favorite: true });
      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      expect(container).toMatchSnapshot();
    });

    it("應該匹配過時的 DAG 快照", () => {
      const mockDag = createMockDag({ is_stale: true });
      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });

      expect(container).toMatchSnapshot();
    });
  });

  describe("標籤變化", () => {
    it("應該匹配單個標籤的快照", () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "production" },
      ];
      const mockDag = createMockDag({ tags });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });

    it("應該匹配多個標籤的快照", () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "production" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "critical" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "daily" },
      ];
      const mockDag = createMockDag({ tags });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });

    it("應該匹配超過顯示限制的標籤快照", () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "tag1" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "tag2" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "tag3" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "tag4" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "tag5" },
      ];
      const mockDag = createMockDag({ tags });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });
  });

  describe("DAG 執行狀態", () => {
    const states = [
      "success",
      "failed",
      "running",
      "queued",
      "skipped",
    ] as const;

    states.forEach((state) => {
      it(`應該匹配 ${state} 狀態的快照`, () => {
        const mockDag = createMockDag({
          latest_dag_runs: [
            {
              dag_id: "test_dag",
              duration: 10.5,
              end_date: "2024-01-15T10:30:00Z",
              id: 1,
              logical_date: "2024-01-15T10:00:00Z",
              run_after: "2024-01-15T10:00:00Z",
              run_id: "scheduled__2024-01-15T10:00:00+00:00",
              start_date: "2024-01-15T10:00:00Z",
              state,
            },
          ],
        });

        const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe("調度配置", () => {
    it("應該匹配每小時調度的快照", () => {
      const mockDag = createMockDag({
        timetable_description: "Hourly",
        timetable_summary: "0 * * * *",
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });

    it("應該匹配每週調度的快照", () => {
      const mockDag = createMockDag({
        timetable_description: "Weekly",
        timetable_summary: "0 0 * * 0",
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });

    it("應該匹配自定義調度的快照", () => {
      const mockDag = createMockDag({
        timetable_description: "Custom schedule",
        timetable_summary: "*/15 * * * *",
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });
  });

  describe("擁有者信息", () => {
    it("應該匹配單個擁有者的快照", () => {
      const mockDag = createMockDag({
        owners: ["john.doe"],
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });

    it("應該匹配多個擁有者的快照", () => {
      const mockDag = createMockDag({
        owners: ["john.doe", "jane.smith", "team.data"],
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });
  });

  describe("組合狀態", () => {
    it("應該匹配複雜組合狀態的快照", () => {
      const tags: DagTagResponse[] = [
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "production" },
        { dag_display_name: "test_dag", dag_id: "test_dag", name: "critical" },
      ];

      const mockDag = createMockDag({
        is_paused: true,
        is_favorite: true,
        tags,
        owners: ["john.doe", "jane.smith"],
        latest_dag_runs: [
          {
            dag_id: "test_dag",
            duration: 120.5,
            end_date: "2024-01-15T12:00:00Z",
            id: 1,
            logical_date: "2024-01-15T10:00:00Z",
            run_after: "2024-01-15T10:00:00Z",
            run_id: "scheduled__2024-01-15T10:00:00+00:00",
            start_date: "2024-01-15T10:00:00Z",
            state: "failed",
          },
        ],
      });

      const { container } = render(<DagCard dag={mockDag} />, { wrapper: GMTWrapper });
      expect(container).toMatchSnapshot();
    });
  });
});

/**
 * 複雜元件快照測試的建議：
 *
 * 1. 使用工廠函數創建測試數據（如 createMockDag）
 * 2. 測試所有重要的 props 組合
 * 3. 測試邊界情況（空數組、極值等）
 * 4. 分組相關的測試用例
 * 5. 使用描述性的測試名稱
 * 6. 保持測試數據的一致性和可預測性
 */
