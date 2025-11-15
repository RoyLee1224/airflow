# CI/CD 視覺測試整合指南

完整的 CI/CD 設置，在 PR 中自動顯示 UI 變更對比。

## 📋 目錄

1. [功能概述](#功能概述)
2. [架構說明](#架構說明)
3. [快速開始](#快速開始)
4. [配置詳解](#配置詳解)
5. [PR 工作流程](#pr-工作流程)
6. [部署方案](#部署方案)
7. [最佳實踐](#最佳實踐)
8. [問題排查](#問題排查)

---

## 功能概述

### ✨ 主要功能

1. **自動視覺回歸測試** - PR 提交時自動執行視覺測試
2. **截圖對比** - 自動對比 base 分支和 PR 分支的 UI 截圖
3. **PR 評論展示** - 在 PR 中自動評論，展示視覺變更
4. **互動式報告** - 生成精美的 HTML 報告，展示所有變更
5. **預覽部署** - 自動部署 PR 預覽環境，可直接訪問測試
6. **自動標籤** - 根據測試結果自動添加 PR 標籤

### 🎯 使用場景

- **開發階段** - 實時查看 UI 變更
- **Code Review** - 審查者可以直接看到視覺變更
- **回歸測試** - 防止意外的 UI 變更
- **設計驗證** - 確保實作符合設計稿

---

## 架構說明

### 工作流程圖

```
┌─────────────┐
│  開發者提交  │
│     PR      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│   GitHub Actions 觸發           │
│                                 │
│  1. Visual Regression Tests     │
│  2. PR Preview Deployment       │
└──────┬──────────────────────┬───┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  執行測試     │      │  構建 & 部署  │
│  - Base 分支 │      │  - 打包 UI    │
│  - PR 分支   │      │  - 部署預覽   │
│  - 截圖對比   │      └──────┬───────┘
└──────┬───────┘              │
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  生成報告     │      │  評論 PR     │
│  - HTML      │      │  - 預覽 URL  │
│  - JSON      │      │  - QR Code   │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────────────┐
│     PR 評論          │
│  - 視覺變更對比      │
│  - 截圖展示          │
│  - 差異百分比        │
│  - 報告連結          │
└─────────────────────┘
```

### 文件結構

```
.github/
├── workflows/
│   ├── visual-regression.yml    # 視覺回歸測試工作流
│   └── pr-preview.yml           # PR 預覽部署工作流
└── scripts/
    ├── compare-screenshots.js   # 截圖對比腳本
    ├── generate-visual-report.js # 報告生成腳本
    └── package.json             # 腳本依賴

airflow-core/src/airflow/ui/
├── vitest.browser.config.ts     # Browser Mode 配置
├── testsSetup.browser.ts        # 測試設置
└── src/
    └── **/*.visual.test.tsx     # 視覺測試文件
```

---

## 快速開始

### 步驟 1: 安裝依賴

```bash
# 在 UI 專案中安裝 Vitest 4.x + Browser Mode
cd airflow-core/src/airflow/ui
pnpm add -D vitest@^4.0.0 @vitest/browser@^4.0.0 playwright
npx playwright install chromium

# 在 CI 腳本目錄安裝依賴
cd .github/scripts
npm install
```

### 步驟 2: 配置 Browser Mode

創建 `vitest.browser.config.ts`:

```bash
cp vitest.browser.config.example.ts vitest.browser.config.ts
cp testsSetup.browser.example.ts testsSetup.browser.ts
```

### 步驟 3: 編寫視覺測試

參考 `examples/` 目錄中的範例:

```typescript
// src/components/DagCard.visual.test.tsx
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { DagCard } from "./DagCard";

test("應該匹配 DagCard 視覺快照", async () => {
  render(<DagCard dag={mockDag} />);
  await page.waitForTimeout(200);

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot();
});
```

### 步驟 4: 配置 GitHub Actions

文件已自動創建在 `.github/workflows/`:
- `visual-regression.yml` - 視覺測試
- `pr-preview.yml` - 預覽部署

### 步驟 5: 啟用 GitHub Pages (可選)

如果要使用 GitHub Pages 部署報告:

1. 前往 Repository Settings → Pages
2. Source 選擇 "GitHub Actions"
3. 保存設置

### 步驟 6: 提交 PR 測試

```bash
git add .
git commit -m "feat: add visual regression testing"
git push origin feature-branch

# 創建 PR，工作流會自動執行
```

---

## 配置詳解

### Visual Regression Workflow

**`.github/workflows/visual-regression.yml`**

主要步驟:

1. **執行測試 (PR 分支)**
   ```yaml
   - name: Run visual regression tests (PR)
     run: pnpm vitest run --config vitest.browser.config.ts
   ```

2. **執行測試 (Base 分支)**
   ```yaml
   - name: Checkout base branch
     uses: actions/checkout@v4
     with:
       ref: ${{ github.event.pull_request.base.ref }}
   ```

3. **對比截圖**
   ```yaml
   - name: Compare screenshots
     run: node .github/scripts/compare-screenshots.js
   ```

4. **生成報告**
   ```yaml
   - name: Generate visual test report
     run: node .github/scripts/generate-visual-report.js
   ```

5. **評論 PR**
   ```yaml
   - name: Comment PR with visual changes
     uses: actions/github-script@v7
   ```

### PR Preview Workflow

**`.github/workflows/pr-preview.yml`**

主要步驟:

1. **構建 UI**
   ```yaml
   - name: Build UI
     run: pnpm build
     env:
       VITE_BASE_PATH: /pr-${{ github.event.pull_request.number }}
   ```

2. **部署預覽**
   ```yaml
   - name: Deploy to GitHub Pages
     uses: peaceiris/actions-gh-pages@v4
     with:
       publish_dir: airflow-core/src/airflow/ui/dist
       destination_dir: pr-${{ github.event.pull_request.number }}
   ```

3. **評論預覽 URL**
   ```yaml
   - name: Comment PR with preview URL
     uses: actions/github-script@v7
   ```

---

## PR 工作流程

### 開發者視角

1. **提交代碼到 PR**
   ```bash
   git push origin feature-branch
   ```

2. **自動觸發 CI**
   - Visual Regression Tests 開始執行
   - PR Preview 開始構建和部署

3. **等待 CI 完成**
   - 大約 5-10 分鐘
   - 可以在 Actions 頁面查看進度

4. **查看 PR 評論**
   - Bot 會自動評論，包含:
     - 視覺變更摘要
     - 截圖對比表格
     - 預覽環境 URL
     - 視覺測試報告連結

5. **審查變更**
   - 點擊預覽 URL 查看實際 UI
   - 查看視覺測試報告
   - 檢查截圖對比

### 審查者視角

1. **收到 PR 通知**

2. **查看 Bot 評論**
   - 快速了解視覺變更
   - 查看截圖對比

3. **訪問預覽環境**
   - 在真實環境測試 UI
   - 測試響應式設計
   - 測試主題切換

4. **審查視覺測試報告**
   - 查看詳細的變更列表
   - 確認變更是否符合預期

5. **批准或請求修改**

---

## 部署方案

### 方案 1: GitHub Pages (推薦)

**優點:**
- 免費
- 與 GitHub 深度整合
- 自動 HTTPS
- 配置簡單

**配置:**
```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
    destination_dir: pr-${{ github.event.pull_request.number }}
```

**訪問 URL:**
```
https://your-username.github.io/airflow/pr-123
```

### 方案 2: Vercel

**優點:**
- 部署速度快
- 自動 CDN
- 支援 Serverless Functions
- 精美的部署管理界面

**配置:**

1. 創建 Vercel 帳號並獲取 Token
2. 在 GitHub Secrets 中添加:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

3. 在 workflow 中使用:
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    alias-domains: pr-${{ github.event.pull_request.number }}-airflow.vercel.app
```

**訪問 URL:**
```
https://pr-123-airflow.vercel.app
```

### 方案 3: Netlify

**優點:**
- 簡單易用
- 支援 Split Testing
- 即時回滾
- 免費額度大

**配置:**

1. 創建 Netlify 帳號並獲取 Token
2. 在 GitHub Secrets 中添加:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`

3. 在 workflow 中使用:
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v3
  with:
    publish-dir: ./dist
    production-deploy: false
    alias: pr-${{ github.event.pull_request.number }}
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**訪問 URL:**
```
https://pr-123--your-site.netlify.app
```

### 方案對比

| 功能 | GitHub Pages | Vercel | Netlify |
|-----|--------------|--------|---------|
| **價格** | 免費 | 免費額度 | 免費額度 |
| **部署速度** | 中等 | 快 | 快 |
| **CDN** | 有 | 全球 | 全球 |
| **HTTPS** | 自動 | 自動 | 自動 |
| **自定義域名** | 支援 | 支援 | 支援 |
| **配置複雜度** | 簡單 | 中等 | 簡單 |
| **適合場景** | 開源專案 | 商業專案 | 靜態網站 |

---

## PR 評論範例

### 視覺回歸測試評論

```markdown
## 🎨 Visual Regression Test Results

⚠️ 3 visual change(s) detected

### 📊 Summary
- **Total tests**: 15
- **✅ Passed**: 12
- **❌ Failed**: 0
- **🔄 Changed**: 3

### 🔍 Visual Changes Detected

<details>
<summary><strong>DagCard.tsx</strong> - 5.2% difference</summary>

| Before (Base) | After (PR) | Diff |
|---------------|------------|------|
| ![Before](url) | ![After](url) | ![Diff](url) |

</details>

<details>
<summary><strong>SearchBar.tsx</strong> - 2.1% difference</summary>

| Before (Base) | After (PR) | Diff |
|---------------|------------|------|
| ![Before](url) | ![After](url) | ![Diff](url) |

</details>

📄 [View Full Report](https://your-username.github.io/airflow/pr-123/visual-report)
```

### PR 預覽評論

```markdown
## 🚀 PR Preview Deployed!

Your changes have been deployed to a preview environment.

### 🔗 Preview URLs

| Environment | URL | Status |
|-------------|-----|--------|
| **PR Preview** | [Visit Preview](url) | ✅ Live |
| **Visual Tests** | [View Report](url) | 📊 Available |

### 📱 Test on Different Devices

- **Desktop**: [Preview Link](url)
- **Mobile**: Scan QR Code below

![QR Code](qr-code-url)

### 🎨 What to test

- [ ] Visual appearance and layout
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark/Light theme switching
- [ ] Interactive elements and animations
- [ ] Cross-browser compatibility
```

---

## 最佳實踐

### 1. 視覺測試編寫

✅ **DO:**
- 使用固定的測試數據
- 等待動畫完成後截圖
- 測試關鍵 UI 元件
- 設置合理的差異閾值

❌ **DON'T:**
- 測試所有元件（太慢）
- 使用隨機數據
- 依賴時間相關數據
- 設置過於嚴格的閾值

### 2. CI/CD 優化

**並行執行:**
```yaml
jobs:
  visual-tests:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - run: pnpm vitest --browser=${{ matrix.browser }}
```

**快取優化:**
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}
```

**條件執行:**
```yaml
on:
  pull_request:
    paths:
      - 'airflow-core/src/airflow/ui/**'
      - '!**/*.md'
```

### 3. 報告優化

**減少 Artifact 大小:**
- 只保存有差異的截圖
- 壓縮圖片
- 設置合理的保留天數

**報告訪問優化:**
- 部署到 CDN
- 生成索引頁面
- 支援搜尋和過濾

### 4. 團隊協作

**審查流程:**
1. 視覺變更必須有對應的 Issue/Ticket
2. 審查者必須訪問預覽環境測試
3. 大型 UI 變更需要設計師審核
4. 所有視覺測試必須通過才能合併

**通知設定:**
- Slack/Teams 通知
- Email 摘要
- GitHub 通知

---

## 問題排查

### 常見問題

#### 1. 測試超時

**問題:**
```
Error: Test timeout of 30000ms exceeded
```

**解決方案:**
```typescript
// 增加測試超時時間
test("long test", async () => {
  // ...
}, { timeout: 60000 });

// 或在配置文件中全局設置
// vitest.browser.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000,
  },
});
```

#### 2. 截圖差異過大

**問題:**
```
Expected screenshot to match, but got 25% difference
```

**可能原因:**
- 字體渲染差異
- 動畫未完成
- 時間相關數據

**解決方案:**
```typescript
// 1. 等待動畫完成
await page.waitForTimeout(300);

// 2. 禁用動畫
await page.addStyleTag({
  content: '* { animation-duration: 0s !important; }'
});

// 3. 使用固定數據
const fixedDate = new Date('2024-01-15T10:00:00Z');

// 4. 調整閾值
expect(screenshot).toMatchImageSnapshot({
  threshold: 0.2, // 允許 20% 差異
});
```

#### 3. Playwright 安裝失敗

**問題:**
```
Failed to install browsers
```

**解決方案:**
```bash
# 手動安裝
npx playwright install chromium --with-deps

# 或在 CI 中
- run: npx playwright install-deps chromium
```

#### 4. 預覽部署失敗

**問題:**
```
Error: Failed to deploy to GitHub Pages
```

**檢查項目:**
1. GitHub Pages 是否啟用
2. workflow 權限是否正確
3. 構建輸出目錄是否正確

**解決方案:**
```yaml
# 確保權限正確
permissions:
  contents: write
  pages: write
  id-token: write

# 檢查構建輸出
- run: ls -la airflow-core/src/airflow/ui/dist
```

#### 5. PR 評論未顯示

**問題:**
Bot 沒有評論 PR

**檢查項目:**
1. workflow 權限
2. GitHub token 權限
3. 腳本錯誤

**解決方案:**
```yaml
permissions:
  pull-requests: write

# 添加調試
- name: Debug
  run: |
    echo "PR Number: ${{ github.event.pull_request.number }}"
    cat visual-report/report.json
```

---

## 進階配置

### 1. 多環境測試

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    viewport:
      - { width: 375, height: 667 }   # Mobile
      - { width: 768, height: 1024 }  # Tablet
      - { width: 1920, height: 1080 } # Desktop
```

### 2. 性能預算

```yaml
- name: Check bundle size
  run: |
    SIZE=$(du -sk dist | cut -f1)
    if [ $SIZE -gt 5000 ]; then
      echo "Bundle too large: ${SIZE}KB"
      exit 1
    fi
```

### 3. 無障礙測試

```yaml
- name: Accessibility tests
  run: |
    npx pa11y-ci --sitemap https://preview-url/sitemap.xml
```

### 4. 整合第三方服務

**Percy (視覺測試服務):**
```yaml
- name: Percy visual tests
  run: npx percy exec -- npm run test:visual
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

**Chromatic (Storybook 視覺測試):**
```yaml
- name: Publish to Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## 相關資源

- [VITEST_4_BROWSER_MODE_INTEGRATION.md](./VITEST_4_BROWSER_MODE_INTEGRATION.md) - Vitest 4.x 整合指南
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Playwright 文檔](https://playwright.dev/)
- [Vitest Browser Mode](https://vitest.dev/guide/browser.html)

---

## 總結

這套 CI/CD 方案提供:

✅ **自動化視覺回歸測試** - 每次 PR 自動執行
✅ **直觀的截圖對比** - 在 PR 中直接查看變更
✅ **預覽環境** - 實際訪問測試 UI
✅ **精美的測試報告** - HTML 報告展示所有細節
✅ **自動化工作流** - 減少手動操作
✅ **團隊協作** - 更好的 Code Review 體驗

立即開始使用，提升你的 UI 測試和審查流程！🚀
