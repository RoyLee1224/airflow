# Airflow CI/CD Configuration

這個目錄包含 Airflow 專案的 CI/CD 配置和腳本。

## 📁 目錄結構

```
.github/
├── workflows/
│   ├── visual-regression.yml    # 視覺回歸測試工作流
│   └── pr-preview.yml           # PR 預覽部署工作流
├── scripts/
│   ├── compare-screenshots.js   # 截圖對比腳本
│   ├── generate-visual-report.js # 報告生成腳本
│   └── package.json             # 腳本依賴
└── README.md                    # 本文件
```

## 🚀 工作流程

### 1. Visual Regression Tests (`visual-regression.yml`)

**觸發條件:**
- PR 創建、更新時
- 修改 `airflow-core/src/airflow/ui/**` 路徑下的文件

**功能:**
- 執行視覺回歸測試 (Base vs PR)
- 對比截圖差異
- 生成視覺測試報告
- 在 PR 中自動評論結果
- 上傳截圖和報告到 Artifacts
- 部署報告到 GitHub Pages

**執行時間:** 約 5-10 分鐘

**示例輸出:**

```markdown
## 🎨 Visual Regression Test Results

⚠️ 3 visual change(s) detected

### 📊 Summary
- **Total tests**: 15
- **✅ Passed**: 12
- **🔄 Changed**: 3

### 🔍 Visual Changes Detected
[截圖對比表格...]
```

### 2. PR Preview Deployment (`pr-preview.yml`)

**觸發條件:**
- PR 創建、更新、重新打開時
- 修改 `airflow-core/src/airflow/ui/**` 路徑下的文件

**功能:**
- 構建 UI 應用
- 部署到預覽環境 (GitHub Pages)
- 在 PR 中評論預覽 URL
- 生成 QR Code 用於移動設備測試
- PR 關閉時自動清理

**執行時間:** 約 3-5 分鐘

**預覽 URL 格式:**
```
https://[username].github.io/airflow/pr-[number]
```

## 🔧 腳本說明

### compare-screenshots.js

截圖對比腳本，使用 `pixelmatch` 進行像素級對比。

**功能:**
- 查找所有截圖文件
- 對比 base 和 PR 分支的截圖
- 生成差異圖片
- 輸出 JSON 格式的對比結果

**使用方式:**
```bash
cd .github/scripts
npm install
node compare-screenshots.js
```

**輸出文件:**
- `visual-report/comparison-results.json` - 對比結果
- `visual-report/diffs/*.png` - 差異圖片

### generate-visual-report.js

視覺測試報告生成器，創建精美的 HTML 報告。

**功能:**
- 讀取對比結果
- 生成互動式 HTML 報告
- 生成 JSON 報告（用於 PR 評論）

**使用方式:**
```bash
node generate-visual-report.js
```

**輸出文件:**
- `visual-report/index.html` - HTML 報告
- `visual-report/report.json` - JSON 報告

## 📦 依賴安裝

### Workflow 依賴

Workflows 會自動安裝所需依賴，無需手動操作。

### 本地測試腳本

如果需要在本地測試腳本:

```bash
cd .github/scripts
npm install
```

依賴包括:
- `pixelmatch` - 圖片對比
- `pngjs` - PNG 圖片處理

## 🛠️ 配置

### GitHub Secrets (可選)

根據選擇的部署方案，可能需要配置以下 Secrets:

**Vercel 部署:**
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

**Netlify 部署:**
```
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

**Percy (視覺測試服務):**
```
PERCY_TOKEN
```

### GitHub Pages

1. 前往 Repository Settings → Pages
2. Source 選擇 "GitHub Actions"
3. 保存設置

### Workflow 權限

確保 workflows 有足夠的權限:

```yaml
permissions:
  contents: write      # 讀寫代碼
  pull-requests: write # 評論 PR
  deployments: write   # 創建部署
  pages: write         # 部署到 Pages
```

## 📊 使用範例

### 提交 PR

1. 創建分支並修改 UI:
```bash
git checkout -b feature/update-ui
# 修改 UI 代碼
git add .
git commit -m "feat: update DagCard UI"
git push origin feature/update-ui
```

2. 在 GitHub 上創建 PR

3. 等待 CI 執行（約 5-10 分鐘）

4. 查看 PR 評論中的:
   - 視覺變更摘要
   - 截圖對比
   - 預覽環境 URL
   - 視覺測試報告連結

5. 訪問預覽環境測試

6. 審查視覺測試報告

### 查看測試結果

**方式 1: PR 評論**
- 直接在 PR 頁面查看 Bot 評論
- 包含摘要和截圖對比

**方式 2: GitHub Actions**
- 前往 Actions 頁面
- 點擊對應的 workflow run
- 查看詳細日誌和 artifacts

**方式 3: 視覺測試報告**
- 點擊 PR 評論中的報告連結
- 查看完整的 HTML 報告

**方式 4: Artifacts**
- 在 workflow run 頁面下載 artifacts
- 包含所有截圖和報告

## 🐛 問題排查

### Workflow 失敗

1. 查看 Actions 頁面的錯誤日誌
2. 檢查是否有權限問題
3. 確認依賴是否正確安裝
4. 檢查配置文件語法

### 截圖對比失敗

常見原因:
- 字體渲染差異 → 使用系統字體
- 動畫未完成 → 增加等待時間
- 時間相關數據 → 使用固定數據
- 閾值過嚴格 → 調整 threshold

### 預覽部署失敗

檢查:
1. GitHub Pages 是否啟用
2. 構建輸出目錄是否正確
3. workflow 權限是否足夠

### PR 評論未顯示

檢查:
1. `pull-requests: write` 權限
2. 腳本是否正確執行
3. 報告文件是否生成

## 📈 性能優化

### 快取策略

workflows 已配置快取:
- pnpm store
- Playwright 瀏覽器
- node_modules

### 並行執行

可以配置 matrix strategy 並行執行:
```yaml
strategy:
  matrix:
    browser: [chromium, firefox]
```

### 條件執行

只在必要時執行:
```yaml
on:
  pull_request:
    paths:
      - 'airflow-core/src/airflow/ui/**'
```

## 🔗 相關資源

- [完整 CI/CD 指南](../CI_CD_VISUAL_TESTING_GUIDE.md)
- [Vitest 整合指南](../VITEST_4_BROWSER_MODE_INTEGRATION.md)
- [測試範例](../airflow-core/src/airflow/ui/examples/)

## 💡 最佳實踐

1. **定期更新 Base 截圖** - 合併到主分支後更新基準
2. **審查所有視覺變更** - 不要忽略"小"變更
3. **測試多種場景** - 響應式、主題、瀏覽器
4. **保持測試穩定** - 使用固定數據、禁用動畫
5. **及時清理** - 定期清理舊的預覽部署和 artifacts

## 🤝 貢獻

如果你發現問題或有改進建議:

1. 提出 Issue
2. 提交 Pull Request
3. 更新文檔

---

**維護者**: Airflow Team
**最後更新**: 2024-01-15
