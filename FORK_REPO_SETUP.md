# Fork Repo 視覺測試和 PR 預覽設置指南

這份指南專門針對在 **Fork Repository** 中使用視覺測試和 PR 預覽功能。

## 📋 目錄

1. [Fork Repo 工作原理](#fork-repo-工作原理)
2. [快速設置（3 分鐘）](#快速設置)
3. [手動設置](#手動設置)
4. [測試驗證](#測試驗證)
5. [常見問題](#常見問題)

---

## Fork Repo 工作原理

### 兩種 PR 情況

#### 情況 1: Fork 內部 PR ✅ 推薦用於測試

```
你的 Fork (RoyLee1224/airflow)
  └─ feature-branch
       ↓ PR
     main branch
```

**特點:**
- ✅ Workflows 在你的 fork 執行
- ✅ 完全控制 CI/CD 流程
- ✅ 可以看到所有自動化功能
- ✅ 預覽 URL: `https://RoyLee1224.github.io/airflow/pr-123`

**適用場景:**
- 開發和測試新功能
- 驗證 CI/CD 配置
- 在提交到上游前先測試

#### 情況 2: Fork → 上游 PR

```
你的 Fork (RoyLee1224/airflow)
         ↓ PR
原始 Repo (apache/airflow)
```

**特點:**
- ❌ Workflows 在上游 repo 執行（如果有的話）
- ❌ 你無法控制上游的 CI/CD
- ✅ 標準的開源貢獻流程

**適用場景:**
- 向上游專案貢獻代碼
- 提交 bug 修復或新功能

---

## 快速設置

### 方法 1: 使用自動化腳本（推薦）

```bash
cd /home/user/airflow

# 執行設置腳本
./setup-fork-ci.sh

# 腳本會提示輸入你的 GitHub username
# 然後自動更新所有配置文件
```

### 方法 2: 一鍵設置命令

```bash
# 替換 YOUR_GITHUB_USERNAME 為你的 GitHub 用戶名
GITHUB_USER="RoyLee1224"

# 更新所有配置文件中的 URL
find .github -type f \( -name "*.yml" -o -name "*.js" \) -exec sed -i "s/your-username/${GITHUB_USER}/g" {} +

echo "✅ 配置完成！"
echo "預覽 URL 將會是: https://${GITHUB_USER}.github.io/airflow/pr-[number]"
```

### 然後在 GitHub 網頁上完成設置

#### 1. 啟用 GitHub Actions

訪問: `https://github.com/RoyLee1224/airflow/actions`

如果看到 workflows 被禁用：
- 點擊 **"I understand my workflows, go ahead and enable them"**

#### 2. 啟用 GitHub Pages

訪問: `https://github.com/RoyLee1224/airflow/settings/pages`

設置:
- **Source**: GitHub Actions
- 點擊 **Save**

#### 3. 設置 Workflow 權限

訪問: `https://github.com/RoyLee1224/airflow/settings/actions`

設置:
- **Workflow permissions**: Read and write permissions
- ✓ **Allow GitHub Actions to create and approve pull requests**
- 點擊 **Save**

✅ 完成！現在可以測試了。

---

## 手動設置

如果你想手動更新配置文件：

### 1. 更新 Visual Regression Workflow

編輯 `.github/workflows/visual-regression.yml`:

```yaml
# 找到這些地方並替換 your-username 為你的 GitHub username

# 第 85 行附近
- name: Deploy report to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  if: always()
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./visual-report
    destination_dir: pr-${{ github.event.pull_request.number }}

# 第 100 行附近
📄 [View Full Report](https://RoyLee1224.github.io/airflow/pr-${context.issue.number})
```

### 2. 更新 PR Preview Workflow

編輯 `.github/workflows/pr-preview.yml`:

```yaml
# 第 102 行附近
const previewUrl = 'https://RoyLee1224.github.io/airflow/pr-${{ github.event.pull_request.number }}';
```

### 3. 更新報告生成腳本

編輯 `.github/scripts/generate-visual-report.js`:

```javascript
// 第 50 行附近
changes: changes.map(change => ({
  name: change.name,
  status: change.status || 'changed',
  diff: change.diffPercentage || 0,
  baseUrl: change.basePath
    ? `https://RoyLee1224.github.io/airflow/pr-${process.env.PR_NUMBER}/${path.relative(CONFIG.outputDir, change.basePath)}`
    : null,
  // ... 其他配置
})),
```

---

## 測試驗證

### 創建測試 PR

```bash
# 1. 確保在你的 fork 的主分支
git checkout main
git pull origin main

# 2. 創建測試分支
git checkout -b test-visual-ci

# 3. 做一個簡單的修改
echo "# Test Visual CI" >> TEST_CI.md
git add TEST_CI.md
git commit -m "test: trigger visual regression and PR preview"

# 4. 推送到你的 fork
git push origin test-visual-ci
```

### 在 GitHub 上創建 PR

1. 訪問: `https://github.com/RoyLee1224/airflow`
2. 點擊 **"Compare & pull request"**
3. **Base repository**: `RoyLee1224/airflow`
4. **Base branch**: `main`
5. **Head branch**: `test-visual-ci`
6. 點擊 **"Create pull request"**

### 驗證自動化功能

#### ✅ 檢查 1: GitHub Actions 執行

1. 前往 PR 頁面
2. 往下滾動到 **"Checks"** 區域
3. 應該看到:
   - ✓ Visual Regression Tests
   - ✓ PR Preview Deployment

#### ✅ 檢查 2: Bot 評論

等待 5-10 分鐘後，Bot 應該會評論：

```markdown
## 🎨 Visual Regression Test Results
[視覺測試結果...]

## 🚀 PR Preview Deployed!
Preview URL: https://RoyLee1224.github.io/airflow/pr-1
```

#### ✅ 檢查 3: 訪問預覽環境

點擊 Bot 評論中的預覽 URL，應該可以看到部署的 UI。

#### ✅ 檢查 4: 查看視覺測試報告

訪問: `https://RoyLee1224.github.io/airflow/pr-1/visual-report`

應該看到精美的 HTML 報告。

---

## 常見問題

### Q1: Workflows 沒有執行？

**檢查清單:**
- [ ] GitHub Actions 已啟用？
- [ ] Workflow 文件在正確的分支？
- [ ] PR 是在 fork 內部創建的？（不是向上游）
- [ ] 修改的文件路徑符合觸發條件？

**解決方案:**
```bash
# 檢查 workflows 是否存在
ls -la .github/workflows/

# 檢查文件內容
cat .github/workflows/visual-regression.yml | grep "on:"

# 確保 PR 觸發條件正確
# 應該看到:
# on:
#   pull_request:
#     paths:
#       - 'airflow-core/src/airflow/ui/**'
```

### Q2: Bot 沒有評論 PR？

**可能原因:**
1. Workflow 權限不足
2. GitHub token 權限問題
3. 腳本執行失敗

**解決方案:**
```bash
# 1. 檢查 workflow 權限
# Settings → Actions → General → Workflow permissions
# 應該是: "Read and write permissions"

# 2. 查看 Actions 日誌
# 前往 Actions 頁面，點擊失敗的 workflow
# 查看詳細錯誤訊息

# 3. 手動觸發 workflow
# 在 Actions 頁面，選擇 workflow，點擊 "Run workflow"
```

### Q3: 預覽頁面 404？

**可能原因:**
1. GitHub Pages 未啟用
2. 部署失敗
3. URL 不正確

**解決方案:**
```bash
# 1. 檢查 GitHub Pages 設置
# Settings → Pages
# Source 應該是 "GitHub Actions"

# 2. 檢查部署狀態
# Settings → Environments → github-pages
# 應該看到最近的部署記錄

# 3. 驗證 URL 格式
# 應該是: https://[username].github.io/[repo]/pr-[number]
# 例如: https://RoyLee1224.github.io/airflow/pr-1
```

### Q4: 視覺測試一直失敗？

**可能原因:**
1. Playwright 未安裝
2. 測試超時
3. 截圖差異過大

**解決方案:**
```bash
# 1. 本地測試
cd airflow-core/src/airflow/ui
pnpm install
npx playwright install chromium
pnpm vitest run --config vitest.browser.config.ts

# 2. 查看測試日誌
# 在 Actions 頁面查看詳細錯誤

# 3. 調整閾值
# 編輯測試文件，增加 threshold:
expect(screenshot).toMatchImageSnapshot({
  threshold: 0.2  // 允許 20% 差異
});
```

### Q5: 如何在本地預覽報告？

```bash
# 1. 下載 artifacts
# 在 PR 的 Actions 頁面下載 "visual-test-report"

# 2. 解壓並打開
unzip visual-test-report.zip
cd visual-report
python3 -m http.server 8000

# 3. 訪問
# http://localhost:8000/index.html
```

### Q6: 如何禁用某個 workflow？

```bash
# 方法 1: 在 GitHub 上禁用
# Actions → 選擇 workflow → "..." → Disable workflow

# 方法 2: 刪除或重命名文件
mv .github/workflows/visual-regression.yml .github/workflows/visual-regression.yml.disabled

# 方法 3: 修改觸發條件
# 編輯 workflow 文件，移除 pull_request 觸發器
```

---

## 進階配置

### 只在特定分支執行

編輯 workflow 文件：

```yaml
on:
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'airflow-core/src/airflow/ui/**'
```

### 添加手動觸發

```yaml
on:
  pull_request:
    # ... 現有配置
  workflow_dispatch:  # 添加這行
```

然後可以在 Actions 頁面手動運行。

### 使用不同的部署服務

#### Vercel

```yaml
# 在 .github/workflows/pr-preview.yml 中
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

需要在 Settings → Secrets 中添加：
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Netlify

```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v3
  with:
    publish-dir: airflow-core/src/airflow/ui/dist
    production-deploy: false
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 完整測試檢查清單

在提交真實的功能 PR 之前，使用這個檢查清單：

### 設置檢查

- [ ] GitHub Actions 已啟用
- [ ] GitHub Pages 已啟用（Source: GitHub Actions）
- [ ] Workflow 權限已設置（Read and write）
- [ ] 允許 Actions 創建和批准 PR
- [ ] 配置文件中的 username 已更新

### 功能檢查

- [ ] 創建測試 PR
- [ ] Visual Regression workflow 執行成功
- [ ] PR Preview workflow 執行成功
- [ ] Bot 評論出現在 PR 中
- [ ] 預覽 URL 可以訪問
- [ ] 視覺測試報告可以訪問
- [ ] 截圖對比正常顯示

### 本地測試

- [ ] 依賴已安裝（vitest, playwright）
- [ ] 本地測試可以執行
- [ ] 快照可以生成
- [ ] Browser mode 正常運作

---

## 下一步

設置完成後，你可以：

1. **開發新功能**
   - 創建 feature branch
   - 開發並測試
   - 在 fork 內提交 PR
   - 查看自動化測試結果

2. **向上游貢獻**
   - 確保在 fork 內測試通過
   - 從 fork 向上游提交 PR
   - 參考 fork 內的測試結果

3. **持續改進**
   - 優化測試配置
   - 添加更多測試
   - 調整 CI/CD 流程

---

## 支援

如果遇到問題：

1. 查看 [常見問題](#常見問題)
2. 檢查 [Actions 日誌](https://github.com/RoyLee1224/airflow/actions)
3. 參考 [完整 CI/CD 指南](./CI_CD_VISUAL_TESTING_GUIDE.md)
4. 查看 [快速開始指南](./QUICK_START_VISUAL_TESTING.md)

---

**祝測試愉快！** 🚀
