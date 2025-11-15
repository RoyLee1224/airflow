# 🚀 Visual Testing & PR Preview 快速開始指南

這份指南幫助你快速設置並使用 Airflow 的視覺測試和 PR 預覽功能。

## ⚡ 5 分鐘快速開始

### 步驟 1: 安裝依賴（首次設置）

```bash
# 進入 UI 專案目錄
cd airflow-core/src/airflow/ui

# 安裝 Vitest 4.x + Browser Mode
pnpm add -D vitest@^4.0.0 @vitest/browser@^4.0.0 playwright

# 安裝 Playwright 瀏覽器
npx playwright install chromium

# 安裝 CI 腳本依賴
cd ../../../../../.github/scripts
npm install
```

### 步驟 2: 配置測試環境

```bash
cd airflow-core/src/airflow/ui

# 複製配置範本
cp vitest.browser.config.example.ts vitest.browser.config.ts
cp testsSetup.browser.example.ts testsSetup.browser.ts
```

### 步驟 3: 啟用 GitHub Pages（可選）

如果要查看視覺測試報告和 PR 預覽：

1. 前往 GitHub Repository → Settings → Pages
2. Source 選擇 "GitHub Actions"
3. 點擊 Save

### 步驟 4: 創建你的第一個視覺測試

```bash
cd airflow-core/src/airflow/ui/src/components
```

創建 `MyComponent.visual.test.tsx`:

```typescript
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { MyComponent } from "./MyComponent";

test("應該匹配 MyComponent 視覺快照", async () => {
  render(<MyComponent />);

  // 等待渲染完成
  await page.waitForTimeout(200);

  // 截圖並比對
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot();
});
```

### 步驟 5: 本地測試

```bash
cd airflow-core/src/airflow/ui

# 執行視覺測試
pnpm vitest run --config vitest.browser.config.ts

# 更新快照（首次執行）
pnpm vitest run --config vitest.browser.config.ts -u
```

### 步驟 6: 提交 PR 並查看結果

```bash
git add .
git commit -m "feat: add visual test for MyComponent"
git push origin your-branch
```

在 GitHub 上創建 PR，然後：

1. **等待 CI 完成**（約 5-10 分鐘）
2. **查看 Bot 評論** - 包含視覺變更和預覽 URL
3. **點擊預覽連結** - 在真實環境測試 UI
4. **查看視覺報告** - 檢視詳細的截圖對比

---

## 📊 你會看到什麼？

### 1. PR 中的 Bot 評論

#### 視覺回歸測試結果

```markdown
## 🎨 Visual Regression Test Results

⚠️ 2 visual change(s) detected

### 📊 Summary
- **Total tests**: 10
- **✅ Passed**: 8
- **🔄 Changed**: 2

### 🔍 Visual Changes Detected

<details>
<summary><strong>MyComponent.visual.test.tsx</strong> - 3.5% difference</summary>

| Before (Base) | After (PR) | Diff |
|---------------|------------|------|
| [Screenshot]  | [Screenshot] | [Diff Image] |

</details>
```

#### PR 預覽部署

```markdown
## 🚀 PR Preview Deployed!

### 🔗 Preview URLs
- **PR Preview**: [Visit Preview](https://...) ✅ Live
- **Visual Tests**: [View Report](https://...) 📊 Available

### 📱 Test on Different Devices
- Desktop: [Link]
- Mobile: [QR Code]
```

### 2. 視覺測試報告頁面

精美的 HTML 報告，包含：
- 📊 測試統計摘要
- 🖼️ 並排截圖對比
- 📈 差異百分比
- 🔍 可放大查看細節

### 3. 預覽環境

實際可訪問的 UI 環境：
- ✅ 測試響應式設計
- ✅ 測試主題切換
- ✅ 測試互動功能
- ✅ 在真實設備上測試

---

## 🎯 常見使用場景

### 場景 1: 修改現有元件

```bash
# 1. 修改元件代碼
vim src/components/DagCard.tsx

# 2. 本地測試（可選）
pnpm vitest run src/components/DagCard.visual.test.tsx

# 3. 提交 PR
git commit -am "refactor: update DagCard styling"
git push

# 4. 在 PR 中查看視覺變更
```

**預期結果:**
- Bot 評論顯示視覺變更
- 可以看到修改前後的對比
- 預覽環境可以實際測試

### 場景 2: 新增元件

```bash
# 1. 創建新元件
cat > src/components/NewCard.tsx << 'EOF'
export const NewCard = () => <div>New Component</div>;
EOF

# 2. 創建視覺測試
cat > src/components/NewCard.visual.test.tsx << 'EOF'
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { NewCard } from "./NewCard";

test("應該匹配 NewCard 快照", async () => {
  render(<NewCard />);
  await page.waitForTimeout(200);
  expect(await page.screenshot()).toMatchImageSnapshot();
});
EOF

# 3. 執行並創建基準快照
pnpm vitest run src/components/NewCard.visual.test.tsx -u

# 4. 提交 PR
git add .
git commit -m "feat: add NewCard component"
git push
```

**預期結果:**
- Bot 評論顯示 "✨ New screenshot"
- 可以在預覽環境看到新元件
- 未來變更會自動與此快照對比

### 場景 3: 修復 UI Bug

```bash
# 1. 重現 Bug（視覺測試應該失敗）
pnpm vitest run src/components/BuggyComponent.visual.test.tsx

# 2. 修復 Bug
vim src/components/BuggyComponent.tsx

# 3. 確認修復（測試應該通過）
pnpm vitest run src/components/BuggyComponent.visual.test.tsx

# 4. 更新快照（如果 UI 有預期的變更）
pnpm vitest run src/components/BuggyComponent.visual.test.tsx -u

# 5. 提交 PR
git commit -am "fix: resolve UI rendering issue"
git push
```

**預期結果:**
- Bot 評論顯示視覺變更（如果有）
- 可以確認 Bug 已修復
- Code reviewer 可以看到修復前後的對比

---

## 💡 實用技巧

### 技巧 1: 測試響應式設計

```typescript
test("應該在不同視窗大小正確顯示", async () => {
  const viewports = [
    { width: 375, height: 667 },   // Mobile
    { width: 768, height: 1024 },  // Tablet
    { width: 1920, height: 1080 }, // Desktop
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    render(<MyComponent />);
    await page.waitForTimeout(200);

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      name: `my-component-${viewport.width}x${viewport.height}`,
    });
  }
});
```

### 技巧 2: 測試主題切換

```typescript
test("應該在暗色主題正確顯示", async () => {
  // 設置暗色主題
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  render(<MyComponent />);
  await page.waitForTimeout(200);

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    name: "my-component-dark-theme",
  });
});
```

### 技巧 3: 測試互動狀態

```typescript
test("應該在 hover 狀態正確顯示", async () => {
  render(<MyComponent />);

  const element = await page.locator('[data-testid="my-element"]');
  await element.hover();
  await page.waitForTimeout(300); // 等待 transition

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    name: "my-component-hover",
  });
});
```

### 技巧 4: 只截圖特定元素

```typescript
test("應該匹配按鈕視覺快照", async () => {
  render(<MyComponent />);

  const button = await page.locator('button[type="submit"]');
  const screenshot = await button.screenshot();

  expect(screenshot).toMatchImageSnapshot({
    name: "submit-button",
  });
});
```

---

## 🔧 調試技巧

### 問題: 測試失敗 - 差異過大

```bash
# 1. 查看差異圖片
ls -la **/__image_snapshots__/__diff_output__/

# 2. 在瀏覽器中打開差異圖片
open **/__image_snapshots__/__diff_output__/*.png

# 3. 如果變更是預期的，更新快照
pnpm vitest run -u

# 4. 如果不是預期的，修復代碼
vim src/components/MyComponent.tsx
```

### 問題: CI 中測試通過，但本地失敗

可能原因：
- 字體差異
- 操作系統渲染差異
- 瀏覽器版本差異

解決方案：
```bash
# 使用與 CI 相同的 Playwright 版本
npx playwright install chromium --with-deps

# 在 headless 模式執行（與 CI 相同）
pnpm vitest run --config vitest.browser.config.ts --browser.headless
```

### 問題: 預覽部署失敗

檢查清單：
- [ ] GitHub Pages 已啟用
- [ ] Workflow 有 `pages: write` 權限
- [ ] 構建成功（檢查 Actions 日誌）
- [ ] `dist` 目錄存在

---

## 📚 下一步

### 學習更多

- 📖 [完整 CI/CD 指南](./CI_CD_VISUAL_TESTING_GUIDE.md)
- 📖 [Vitest 4.x 整合指南](./VITEST_4_BROWSER_MODE_INTEGRATION.md)
- 📖 [測試範例](./airflow-core/src/airflow/ui/examples/)

### 進階功能

1. **多瀏覽器測試**
   - 配置 Firefox、WebKit
   - 確保跨瀏覽器兼容性

2. **視覺測試服務整合**
   - Percy
   - Chromatic
   - Applitools

3. **自定義部署方案**
   - Vercel
   - Netlify
   - 自建服務器

---

## ❓ 常見問題

### Q: 需要為每個元件都寫視覺測試嗎？

A: 不需要。優先測試：
- 核心 UI 元件
- 容易出現視覺 Bug 的元件
- 經常修改的元件
- 複雜的佈局元件

### Q: 視覺測試太慢怎麼辦？

A:
- 在本地使用 happy-dom 進行快速測試
- 在 CI 中執行完整的視覺測試
- 使用 `test.concurrent` 並行執行

### Q: 如何處理動態內容（時間、隨機數）？

A:
```typescript
// 使用固定的測試數據
const fixedDate = new Date('2024-01-15T10:00:00Z');
const fixedId = 'test-id-12345';

// Mock 隨機函數
vi.spyOn(Math, 'random').mockReturnValue(0.5);
```

### Q: PR 預覽環境可以訪問 API 嗎？

A:
- 默認預覽環境是靜態的
- 可以配置指向測試 API 環境
- 或使用 MSW 模擬 API

---

## 🎉 總結

現在你已經學會：

✅ 如何設置視覺測試環境
✅ 如何編寫視覺測試
✅ 如何在 PR 中查看 UI 變更
✅ 如何使用預覽環境測試
✅ 如何調試和優化測試

**開始享受更好的 UI 開發體驗吧！** 🚀

有任何問題歡迎查看完整文檔或提出 Issue。
