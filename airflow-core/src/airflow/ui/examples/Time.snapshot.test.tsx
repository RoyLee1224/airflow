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
 * 範例：快照測試
 *
 * 這個文件展示如何為 Time 元件編寫快照測試。
 * 快照測試可以捕獲元件的 HTML 輸出，並在未來的變更中檢測意外的改動。
 *
 * 使用方式：
 * 1. 首次執行會創建快照文件
 * 2. 後續執行會比對當前輸出與快照
 * 3. 如果變更是預期的，使用 `pnpm vitest run -u` 更新快照
 */

import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TimezoneContext } from "../src/context/timezone";
import { Wrapper } from "../src/utils/Wrapper";
import Time from "../src/components/Time";

describe("Time Component - Snapshot Tests", () => {
  // 使用固定的日期確保快照穩定
  const fixedDate = new Date("2024-01-15T10:30:00Z");

  it("應該匹配 UTC 時區的快照", () => {
    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "UTC", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    // 完整的 HTML 結構快照
    expect(container).toMatchSnapshot();
  });

  it("應該匹配 US/Samoa 時區的快照", () => {
    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "US/Samoa", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    expect(container).toMatchSnapshot();
  });

  it("應該匹配 Asia/Tokyo 時區的快照", () => {
    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "Asia/Tokyo", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    expect(container).toMatchSnapshot();
  });

  it("應該匹配 inline 快照 - 僅文字內容", () => {
    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "UTC", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    // Inline snapshot - 直接儲存在測試文件中
    expect(container.textContent).toMatchInlineSnapshot(
      `"2024-01-15 10:30:00"`
    );
  });

  describe("不同日期格式", () => {
    const testCases = [
      {
        name: "過去日期",
        date: new Date("2020-05-10T08:15:30Z"),
      },
      {
        name: "未來日期",
        date: new Date("2025-12-25T23:59:59Z"),
      },
      {
        name: "午夜時間",
        date: new Date("2024-06-01T00:00:00Z"),
      },
      {
        name: "正午時間",
        date: new Date("2024-06-01T12:00:00Z"),
      },
    ];

    testCases.forEach(({ name, date }) => {
      it(`應該匹配 ${name} 的快照`, () => {
        const { container } = render(
          <TimezoneContext.Provider
            value={{ selectedTimezone: "UTC", setSelectedTimezone: vi.fn() }}
          >
            <Time datetime={date.toISOString()} />
          </TimezoneContext.Provider>,
          { wrapper: Wrapper }
        );

        expect(container).toMatchSnapshot();
      });
    });
  });
});

/**
 * 快照測試最佳實踐：
 *
 * 1. 使用固定的測試數據（固定日期、固定 ID 等）
 * 2. 避免使用隨機值或動態數據
 * 3. 保持快照小而專注
 * 4. 定期審查快照變更
 * 5. 將大型快照拆分為多個小快照
 * 6. 使用描述性的測試名稱
 * 7. 快照文件應該提交到版本控制
 */
