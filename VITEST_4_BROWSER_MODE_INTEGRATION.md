# Vitest 4.x + Browser Mode 整合方案

## 📋 目錄

1. [現狀分析](#現狀分析)
2. [Vitest 4.x 升級指南](#vitest-4x-升級指南)
3. [Browser Mode 配置](#browser-mode-配置)
4. [元件層級測試](#元件層級測試)
5. [快照測試實作](#快照測試實作)
6. [視覺回歸測試](#視覺回歸測試)
7. [設計系統驗證](#設計系統驗證)

---

## 現狀分析

### 主 UI 專案現狀
- **路徑**: `airflow-core/src/airflow/ui/`
- **Vitest 版本**: 3.2.4 (需要升級)
- **測試環境**: `happy-dom`
- **測試文件數**: 14 個
- **缺失**: 快照測試、視覺回歸測試

### Simple Auth Manager UI
- **路徑**: `airflow-core/src/airflow/api_fastapi/auth/managers/simple/ui/`
- **Vitest 版本**: 4.0.4 ✅
- **測試環境**: `happy-dom`

---

## Vitest 4.x 升級指南

### 步驟 1: 升級依賴 (主 UI 專案)

```bash
cd airflow-core/src/airflow/ui
pnpm add -D vitest@^4.0.0 @vitest/coverage-v8@^4.0.0 @vitest/browser@^4.0.0
```

**Browser Mode 相關依賴**:
```bash
# 選擇一個瀏覽器提供者
pnpm add -D @vitest/browser playwright  # Playwright (推薦)
# 或
pnpm add -D @vitest/browser webdriverio # WebdriverIO
```

### 步驟 2: 更新 vite.config.ts

```typescript
import react from "@vitejs/plugin-react-swc";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 1600, manifest: true },
  plugins: [
    react(),
    {
      name: "transform-url-src",
      transformIndexHtml: (html) =>
        html.replace(`src="./assets/`, `src="./static/assets/`).replace(`href="/`, `href="./`),
    },
    cssInjectedByJsPlugin(),
  ],
  resolve: { alias: { openapi: "/openapi-gen", src: "/src" } },
  server: {
    cors: true,
  },
  test: {
    // 保留現有的 Node 環境測試配置
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
    css: true,
    environment: "happy-dom",
    globals: true,
    mockReset: true,
    restoreMocks: true,
    setupFiles: "./testsSetup.ts",

    // 新增: Browser Mode 配置
    browser: {
      enabled: false, // 預設關閉，可透過 --browser 啟用
      name: "chromium", // 或 'firefox', 'webkit'
      provider: "playwright",
      headless: true,
      screenshotFailures: false, // 測試失敗時自動截圖
    },
  },
});
```

### 步驟 3: 更新 package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:browser": "vitest run --browser",
    "test:browser:ui": "vitest --browser --ui",
    "test:watch": "vitest",
    "test:watch:browser": "vitest --browser",
    "coverage": "vitest run --coverage",
    "coverage:browser": "vitest run --browser --coverage"
  }
}
```

---

## Browser Mode 配置

### 混合測試策略 (推薦)

創建兩個配置文件，分別處理 Node 環境和 Browser 環境測試：

**vitest.config.ts** (預設 - Node 環境)
```typescript
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["src/**/*.browser.test.{ts,tsx}"],
    // ... 其他配置
  },
});
```

**vitest.browser.config.ts** (Browser 環境)
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
    },
    include: ["src/**/*.browser.test.{ts,tsx}"],
  },
});
```

**執行命令**:
```bash
# Node 環境測試
pnpm vitest run

# Browser 環境測試
pnpm vitest run --config vitest.browser.config.ts
```

---

## 元件層級測試

### 使用 Browser Mode 的元件測試

**範例: DagCard.browser.test.tsx**

```typescript
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, describe } from "vitest";
import type { DAGWithLatestDagRunsResponse } from "openapi-gen/requests/types.gen";
import { DagCard } from "./DagCard";

// Browser Mode 可以使用真實的 DOM API
describe("DagCard - Browser Mode", () => {
  const mockDag: DAGWithLatestDagRunsResponse = {
    dag_id: "test_dag",
    dag_display_name: "Test DAG",
    is_paused: false,
    // ... 其他欄位
  };

  test("應該正確渲染 DAG 卡片", async () => {
    const { container } = render(<DagCard dag={mockDag} />);

    // Browser Mode 支援真實的 CSS 計算
    const card = container.querySelector('[data-testid="dag-card"]');
    expect(card).toBeVisible();

    // 檢查計算後的樣式
    const styles = window.getComputedStyle(card!);
    expect(styles.display).not.toBe("none");
  });

  test("應該正確處理使用者互動", async () => {
    const user = userEvent.setup();
    render(<DagCard dag={mockDag} />);

    const pauseButton = screen.getByRole("button", { name: /pause/i });

    // Browser Mode 支援真實的事件處理
    await user.click(pauseButton);

    // 驗證視覺變化
    expect(pauseButton).toHaveClass("active");
  });

  test("應該正確處理鍵盤導航", async () => {
    const user = userEvent.setup();
    render(<DagCard dag={mockDag} />);

    // 測試鍵盤可訪問性
    await user.tab();
    expect(screen.getByTestId("dag-id")).toHaveFocus();
  });
});
```

---

## 快照測試實作

### 1. 基本快照測試

**安裝依賴**:
```bash
pnpm add -D @vitest/snapshot
```

**範例: Time.snapshot.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TimezoneContext } from "src/context/timezone";
import { Wrapper } from "src/utils/Wrapper";
import Time from "./Time";

describe("Time Component - Snapshots", () => {
  it("應該匹配 UTC 時間快照", () => {
    const fixedDate = new Date("2024-01-15T10:30:00Z");

    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "UTC", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    expect(container).toMatchSnapshot();
  });

  it("應該匹配特定時區快照", () => {
    const fixedDate = new Date("2024-01-15T10:30:00Z");

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

  it("應該匹配 inline 快照", () => {
    const fixedDate = new Date("2024-01-15T10:30:00Z");

    const { container } = render(
      <TimezoneContext.Provider
        value={{ selectedTimezone: "UTC", setSelectedTimezone: vi.fn() }}
      >
        <Time datetime={fixedDate.toISOString()} />
      </TimezoneContext.Provider>,
      { wrapper: Wrapper }
    );

    expect(container.innerHTML).toMatchInlineSnapshot();
  });
});
```

### 2. Props 快照測試

**範例: DagCard.snapshot.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DAGWithLatestDagRunsResponse } from "openapi-gen/requests/types.gen";
import { DagCard } from "./DagCard";
import { GMTWrapper } from "../../test-utils";

describe("DagCard - Props Snapshots", () => {
  const baseDag: DAGWithLatestDagRunsResponse = {
    dag_id: "test_dag",
    dag_display_name: "Test DAG",
    is_paused: false,
    tags: [],
    // ... 其他必要欄位
  };

  it("應該匹配無標籤的 DAG 快照", () => {
    const { container } = render(
      <DagCard dag={baseDag} />,
      { wrapper: GMTWrapper }
    );
    expect(container).toMatchSnapshot();
  });

  it("應該匹配有多個標籤的 DAG 快照", () => {
    const dagWithTags = {
      ...baseDag,
      tags: [
        { name: "production", dag_id: "test_dag" },
        { name: "critical", dag_id: "test_dag" },
        { name: "daily", dag_id: "test_dag" },
      ],
    };

    const { container } = render(
      <DagCard dag={dagWithTags} />,
      { wrapper: GMTWrapper }
    );
    expect(container).toMatchSnapshot();
  });

  it("應該匹配暫停狀態的 DAG 快照", () => {
    const pausedDag = { ...baseDag, is_paused: true };

    const { container } = render(
      <DagCard dag={pausedDag} />,
      { wrapper: GMTWrapper }
    );
    expect(container).toMatchSnapshot();
  });
});
```

### 3. 更新快照

```bash
# 更新所有快照
pnpm vitest run -u

# 更新特定測試文件的快照
pnpm vitest run DagCard.snapshot.test.tsx -u

# 互動式更新快照
pnpm vitest --ui
```

---

## 視覺回歸測試

Vitest 4.0 原生支援視覺回歸測試！

### 1. 配置視覺回歸測試

**安裝依賴**:
```bash
pnpm add -D @vitest/browser playwright pixelmatch
```

**更新 vite.config.ts**:
```typescript
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      screenshotFailures: true, // 失敗時自動截圖
      viewport: {
        width: 1280,
        height: 720,
      },
    },
  },
});
```

### 2. 視覺回歸測試範例

**範例: DagCard.visual.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { page } from "@vitest/browser/context";
import type { DAGWithLatestDagRunsResponse } from "openapi-gen/requests/types.gen";
import { DagCard } from "./DagCard";

describe("DagCard - Visual Regression", () => {
  const mockDag: DAGWithLatestDagRunsResponse = {
    dag_id: "visual_test_dag",
    dag_display_name: "Visual Test DAG",
    is_paused: false,
    tags: [
      { name: "production", dag_id: "visual_test_dag" },
      { name: "critical", dag_id: "visual_test_dag" },
    ],
    // ... 其他欄位
  };

  test("應該匹配 DagCard 預設狀態的視覺快照", async () => {
    render(<DagCard dag={mockDag} />);

    // 等待元件完全渲染
    await page.waitForTimeout(100);

    // 截圖並比對
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.1, // 允許 10% 的差異
    });
  });

  test("應該匹配暫停狀態的視覺快照", async () => {
    const pausedDag = { ...mockDag, is_paused: true };
    render(<DagCard dag={pausedDag} />);

    await page.waitForTimeout(100);

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      name: "dag-card-paused",
      threshold: 0.1,
    });
  });

  test("應該匹配特定元素的視覺快照", async () => {
    render(<DagCard dag={mockDag} />);

    // 只截取特定元素
    const element = await page.locator('[data-testid="dag-card"]');
    const screenshot = await element.screenshot();

    expect(screenshot).toMatchImageSnapshot();
  });

  test("應該匹配 hover 狀態的視覺快照", async () => {
    render(<DagCard dag={mockDag} />);

    const card = await page.locator('[data-testid="dag-card"]');
    await card.hover();
    await page.waitForTimeout(100); // 等待 CSS transition

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      name: "dag-card-hover",
    });
  });
});
```

### 3. 自定義視覺比對配置

**創建 vitest.visual.config.ts**:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      viewport: {
        width: 1280,
        height: 720,
      },
    },
    // 視覺測試專用配置
    include: ["src/**/*.visual.test.{ts,tsx}"],
    testTimeout: 30000, // 視覺測試需要更長時間
  },
});
```

### 4. 多瀏覽器視覺測試

```typescript
import { expect, test, describe } from "vitest";
import { page, browser } from "@vitest/browser/context";

describe.each([
  { browserName: "chromium" },
  { browserName: "firefox" },
  { browserName: "webkit" },
])("DagCard - $browserName", ({ browserName }) => {
  test(`應該在 ${browserName} 中正確渲染`, async () => {
    render(<DagCard dag={mockDag} />);

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      name: `dag-card-${browserName}`,
    });
  });
});
```

---

## 設計系統驗證

### 1. Chakra UI 元件快照測試

**範例: ChakraComponents.design.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { expect, describe, it } from "vitest";
import { Button, Badge, Card, Tag } from "@chakra-ui/react";
import { ChakraWrapper } from "src/utils/ChakraWrapper";

describe("Design System - Chakra UI Components", () => {
  describe("Button Variants", () => {
    it("應該匹配所有 Button 變體快照", () => {
      const variants = ["solid", "outline", "ghost", "link"];

      variants.forEach((variant) => {
        const { container } = render(
          <Button variant={variant}>測試按鈕</Button>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`button-${variant}`);
      });
    });
  });

  describe("Color Schemes", () => {
    it("應該匹配所有顏色方案快照", () => {
      const colorSchemes = ["blue", "green", "red", "yellow", "gray"];

      colorSchemes.forEach((colorScheme) => {
        const { container } = render(
          <Badge colorScheme={colorScheme}>狀態徽章</Badge>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`badge-${colorScheme}`);
      });
    });
  });
});
```

### 2. 設計 Token 驗證

**範例: DesignTokens.test.tsx**

```typescript
import { expect, describe, it } from "vitest";
import { theme } from "@chakra-ui/react";

describe("Design System - Tokens", () => {
  it("應該包含所有必要的顏色 token", () => {
    const requiredColors = [
      "blue",
      "green",
      "red",
      "yellow",
      "gray",
      "bg",
      "fg",
    ];

    requiredColors.forEach((color) => {
      expect(theme.colors).toHaveProperty(color);
    });

    // 快照整個顏色系統
    expect(theme.colors).toMatchSnapshot("design-colors");
  });

  it("應該包含所有間距 token", () => {
    expect(theme.space).toMatchSnapshot("design-spacing");
  });

  it("應該包含所有字體大小 token", () => {
    expect(theme.fontSizes).toMatchSnapshot("design-font-sizes");
  });
});
```

### 3. 響應式設計驗證

**範例: Responsive.visual.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { page } from "@vitest/browser/context";
import { DagsList } from "src/pages/DagsList/DagsList";

describe("Responsive Design - Visual Tests", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`應該在 ${name} 視窗正確顯示`, async () => {
      await page.setViewportSize({ width, height });

      render(<DagsList />);
      await page.waitForTimeout(200);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        name: `dags-list-${name}`,
        threshold: 0.1,
      });
    });
  });
});
```

### 4. 主題切換驗證

**範例: ThemeSwitching.visual.test.tsx**

```typescript
import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { page } from "@vitest/browser/context";
import { ThemeProvider } from "next-themes";
import { DagCard } from "./DagCard";

describe("Theme Switching - Visual Tests", () => {
  const mockDag = { /* ... */ };

  test("應該匹配亮色主題快照", async () => {
    render(
      <ThemeProvider forcedTheme="light">
        <DagCard dag={mockDag} />
      </ThemeProvider>
    );

    await page.waitForTimeout(100);
    const screenshot = await page.screenshot();

    expect(screenshot).toMatchImageSnapshot({
      name: "dag-card-light-theme",
    });
  });

  test("應該匹配暗色主題快照", async () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <DagCard dag={mockDag} />
      </ThemeProvider>
    );

    await page.waitForTimeout(100);
    const screenshot = await page.screenshot();

    expect(screenshot).toMatchImageSnapshot({
      name: "dag-card-dark-theme",
    });
  });
});
```

---

## 執行測試

### 測試命令總覽

```bash
# 執行所有測試 (Node 環境)
pnpm test

# 執行 Browser Mode 測試
pnpm test:browser

# 執行視覺回歸測試
pnpm vitest run --config vitest.visual.config.ts

# 互動式 UI 模式
pnpm vitest --ui

# 生成覆蓋率報告
pnpm coverage

# 更新快照
pnpm vitest run -u

# Watch 模式
pnpm test:watch
```

### CI/CD 整合

**GitHub Actions 範例**:

```yaml
name: Vitest Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run browser tests
        run: pnpm test:browser

      - name: Run visual regression tests
        run: pnpm vitest run --config vitest.visual.config.ts

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: |
            **/__image_snapshots__/
            **/__diff_output__/

      - name: Generate coverage report
        run: pnpm coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

---

## 最佳實踐

### 1. 測試命名規範

```
Component.test.tsx        # 基本功能測試 (happy-dom)
Component.browser.test.tsx # Browser Mode 測試
Component.snapshot.test.tsx # 快照測試
Component.visual.test.tsx  # 視覺回歸測試
Component.design.test.tsx  # 設計系統驗證
```

### 2. 快照組織

```
src/
  components/
    DagCard/
      DagCard.tsx
      DagCard.test.tsx
      DagCard.snapshot.test.tsx
      __snapshots__/
        DagCard.snapshot.test.tsx.snap
```

### 3. 視覺快照組織

```
src/
  components/
    DagCard/
      DagCard.visual.test.tsx
      __image_snapshots__/
        dag-card-default.png
        dag-card-paused.png
        dag-card-hover.png
```

### 4. 測試策略

1. **快速反饋**: 優先使用 `happy-dom` 進行單元測試
2. **真實環境**: 使用 Browser Mode 測試複雜互動和 DOM API
3. **視覺驗證**: 使用視覺回歸測試確保 UI 一致性
4. **設計系統**: 定期驗證設計 token 和元件變體

---

## 遷移計劃

### Phase 1: 基礎設施 (1-2 天)
- [ ] 升級 Vitest 到 4.x
- [ ] 配置 Browser Mode
- [ ] 設置 CI/CD pipeline

### Phase 2: 快照測試 (3-5 天)
- [ ] 為現有 14 個測試文件添加快照測試
- [ ] 建立快照審查流程

### Phase 3: 視覺回歸測試 (5-7 天)
- [ ] 配置視覺測試環境
- [ ] 為核心元件建立視覺基準
- [ ] 整合到 PR 審查流程

### Phase 4: 設計系統驗證 (3-5 天)
- [ ] 建立設計 token 測試
- [ ] 驗證所有 Chakra UI 元件變體
- [ ] 響應式設計測試

---

## 參考資源

- [Vitest 4.0 Release Notes](https://github.com/vitest-dev/vitest/releases/tag/v4.0.0)
- [Vitest Browser Mode 文檔](https://vitest.dev/guide/browser.html)
- [Playwright 文檔](https://playwright.dev/)
- [Testing Library 文檔](https://testing-library.com/)
- [Chakra UI Testing](https://chakra-ui.com/docs/styled-system/test)

---

## 問題排查

### Browser Mode 常見問題

**問題**: Playwright 安裝失敗
```bash
# 解決方案: 手動安裝 Playwright 瀏覽器
npx playwright install chromium
```

**問題**: 測試超時
```typescript
// 解決方案: 增加測試超時時間
test("long running test", async () => {
  // ...
}, { timeout: 30000 });
```

**問題**: 視覺快照差異過大
```typescript
// 解決方案: 調整閾值或使用固定的測試數據
expect(screenshot).toMatchImageSnapshot({
  threshold: 0.2, // 增加容忍度
});
```

---

## 結論

透過整合 Vitest 4.x + Browser Mode，Airflow 可以獲得:

✅ 真實瀏覽器環境測試
✅ 完整的快照測試支援
✅ 原生視覺回歸測試
✅ 設計系統自動化驗證
✅ 更好的 CI/CD 整合

這將大幅提升 UI 測試的可靠性和開發體驗！
