# Vitest 4.x Browser Mode 測試範例

這個目錄包含了展示如何使用 Vitest 4.x + Browser Mode 進行元件測試、快照測試和視覺回歸測試的範例文件。

## 📁 範例文件

### 快照測試 (Snapshot Tests)

1. **Time.snapshot.test.tsx**
   - 展示基本的快照測試
   - 使用固定測試數據確保穩定性
   - Inline 快照 vs 文件快照
   - 多時區快照測試

2. **DagCard.snapshot.test.tsx**
   - 複雜元件的快照測試
   - 多種 Props 組合測試
   - 不同狀態的快照
   - 使用工廠函數創建測試數據

### 視覺回歸測試 (Visual Regression Tests)

3. **DagCard.visual.test.tsx**
   - 使用 Vitest Browser Mode 進行視覺測試
   - 全頁面截圖 vs 元素級截圖
   - 互動狀態測試（hover, focus）
   - 響應式設計測試
   - 主題切換測試

### 設計系統驗證 (Design System Tests)

4. **DesignSystem.test.tsx**
   - 設計 Tokens 驗證
   - UI 元件變體測試
   - Typography 系統測試
   - 間距系統測試
   - 無障礙性驗證

## 🚀 執行測試

### 執行所有範例測試（Node 環境）

```bash
cd /home/user/airflow/airflow-core/src/airflow/ui
pnpm vitest run examples/
```

### 執行快照測試

```bash
pnpm vitest run examples/*.snapshot.test.tsx
```

### 執行視覺回歸測試（需要 Browser Mode）

```bash
# 首先需要配置 Browser Mode (參考 vitest.browser.config.example.ts)
pnpm vitest run --browser examples/*.visual.test.tsx
```

### 更新快照

```bash
pnpm vitest run examples/ -u
```

## 📋 前置需求

### 快照測試
- Vitest 3.x+ 或 4.x
- @testing-library/react
- 不需要額外依賴

### 視覺回歸測試
- Vitest 4.x+
- @vitest/browser
- Playwright 或 WebdriverIO

安裝命令：
```bash
pnpm add -D vitest@^4.0.0 @vitest/browser@^4.0.0 playwright
npx playwright install chromium
```

## 🔧 配置文件

### vitest.browser.config.example.ts
完整的 Browser Mode 配置範例，包括：
- 瀏覽器選擇 (Chromium, Firefox, WebKit)
- Provider 配置 (Playwright)
- 視窗大小設置
- 截圖配置
- 測試超時設置

使用方式：
```bash
cp vitest.browser.config.example.ts vitest.browser.config.ts
# 根據需要調整配置
pnpm vitest run --config vitest.browser.config.ts
```

### testsSetup.browser.example.ts
Browser Mode 測試設置文件範例，包括：
- 瀏覽器環境設置
- 測試輔助函數
- 動畫控制
- 主題切換
- 截圖輔助

使用方式：
```bash
cp testsSetup.browser.example.ts testsSetup.browser.ts
# 在 vitest.browser.config.ts 中引用此文件
```

## 📚 學習路徑

如果你是第一次使用這些測試技術，建議按以下順序學習：

1. **快照測試入門** → 閱讀 `Time.snapshot.test.tsx`
   - 了解基本快照概念
   - 學習如何創建和更新快照
   - 理解測試數據穩定性的重要性

2. **複雜元件快照** → 閱讀 `DagCard.snapshot.test.tsx`
   - 學習如何測試複雜元件
   - 了解工廠函數模式
   - 掌握多種狀態組合測試

3. **設計系統驗證** → 閱讀 `DesignSystem.test.tsx`
   - 了解設計 Token 測試
   - 學習元件變體驗證
   - 掌握無障礙性測試

4. **視覺回歸測試** → 閱讀 `DagCard.visual.test.tsx`
   - 配置 Browser Mode
   - 學習視覺截圖測試
   - 掌握互動和響應式測試

## 🎯 最佳實踐

### 快照測試
✅ 使用固定的測試數據（固定日期、ID 等）
✅ 保持快照小而專注
✅ 定期審查快照變更
✅ 使用描述性的測試名稱
❌ 避免使用隨機值
❌ 不要提交過大的快照

### 視覺回歸測試
✅ 等待動畫完成後再截圖
✅ 使用固定的視窗大小
✅ 根據元素複雜度調整閾值
✅ 測試主題和響應式斷點
❌ 避免依賴時間相關的數據
❌ 不要在不同環境使用不同的字體

### 設計系統測試
✅ 測試所有元件變體
✅ 驗證無障礙性屬性
✅ 記錄設計決策
✅ 與設計師協作維護
❌ 不要忽略邊界情況
❌ 不要跳過響應式測試

## 🔗 相關資源

- [完整整合指南](/home/user/airflow/VITEST_4_BROWSER_MODE_INTEGRATION.md)
- [Vitest Browser Mode 文檔](https://vitest.dev/guide/browser.html)
- [Playwright 文檔](https://playwright.dev/)
- [Testing Library 文檔](https://testing-library.com/)

## ❓ 常見問題

### 為什麼視覺測試失敗？
1. 檢查是否有動畫未完成
2. 確認測試數據是固定的
3. 調整閾值（threshold）
4. 檢查字體是否已加載

### 如何更新快照？
```bash
pnpm vitest run -u
```

### 如何在 CI 中執行視覺測試？
參考 [VITEST_4_BROWSER_MODE_INTEGRATION.md](/home/user/airflow/VITEST_4_BROWSER_MODE_INTEGRATION.md#cicd-整合) 中的 GitHub Actions 範例。

### 測試太慢怎麼辦？
- Browser Mode 測試較慢，考慮分開執行
- 使用 `test.concurrent` 並行執行獨立測試
- 在本地開發時使用 Node 環境測試
- 在 CI 或重要變更時執行視覺測試

## 💡 貢獻

這些範例文件是為了幫助團隊理解和採用現代測試技術。如果你有改進建議或發現問題，歡迎：

1. 提出 Issue 討論
2. 提交 Pull Request 改進範例
3. 分享你的測試經驗和最佳實踐

---

**注意**: 這些範例文件僅用於學習和參考，不會在實際測試套件中執行（除非移動到 `src/` 目錄下）。
