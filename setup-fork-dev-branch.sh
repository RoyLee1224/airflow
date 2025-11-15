#!/bin/bash

# Fork 開發分支設置腳本
# 保持 main 與 upstream 同步，使用 dev 分支進行開發和測試

set -e

echo "🚀 Setting up Fork Development Branch Structure"
echo ""
echo "這個腳本會："
echo "  1. 創建 dev 分支（包含所有 CI/CD 配置）"
echo "  2. 更新 workflows 以在 dev 分支上觸發"
echo "  3. 保持 main 分支乾淨（與 upstream 同步）"
echo ""

read -p "繼續？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# 獲取當前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 當前分支: $CURRENT_BRANCH"
echo ""

# 1. 創建 dev 分支
echo "📝 創建 dev 分支..."
git checkout -b dev 2>/dev/null || git checkout dev
git push -u origin dev

echo "✅ dev 分支已創建並推送"
echo ""

# 2. 更新 workflows 配置
echo "📝 更新 workflows 配置以在 dev 分支觸發..."

# 備份原始文件
cp .github/workflows/visual-regression.yml .github/workflows/visual-regression.yml.bak
cp .github/workflows/pr-preview.yml .github/workflows/pr-preview.yml.bak

# 更新 visual-regression.yml
cat > .github/workflows/visual-regression.yml.tmp << 'EOF'
name: Visual Regression Tests

on:
  pull_request:
    branches:
      - dev      # 改為在 dev 分支觸發
      - main     # 保留 main（以防需要）
    paths:
      - 'airflow-core/src/airflow/ui/**'
      - '.github/workflows/visual-regression.yml'
EOF

# 保留原文件的其餘部分
sed -n '/^permissions:/,$p' .github/workflows/visual-regression.yml.bak >> .github/workflows/visual-regression.yml.tmp
mv .github/workflows/visual-regression.yml.tmp .github/workflows/visual-regression.yml

# 更新 pr-preview.yml
cat > .github/workflows/pr-preview.yml.tmp << 'EOF'
name: PR Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - dev      # 改為在 dev 分支觸發
      - main     # 保留 main（以防需要）
    paths:
      - 'airflow-core/src/airflow/ui/**'
EOF

# 保留原文件的其餘部分
sed -n '/^permissions:/,$p' .github/workflows/pr-preview.yml.bak >> .github/workflows/pr-preview.yml.tmp
mv .github/workflows/pr-preview.yml.tmp .github/workflows/pr-preview.yml

echo "✅ Workflows 配置已更新"
echo ""

# 3. 提交更改
echo "📝 提交更改..."
git add .github/workflows/
git commit -m "ci: configure workflows to run on dev branch

- Change base branch from main to dev
- Keep main branch clean for upstream sync
- All development and testing happens on dev branch"

echo "✅ 更改已提交"
echo ""

# 4. 推送到 remote
echo "📤 推送到 remote..."
git push origin dev

echo "✅ 推送成功"
echo ""

# 清理備份文件
rm -f .github/workflows/*.bak

echo "🎉 設置完成！"
echo ""
echo "📋 分支結構："
echo ""
echo "  main  ← 與 upstream 同步（保持乾淨）"
echo "    │"
echo "    └─ dev  ← 開發主分支（包含 CI/CD 配置）"
echo "         │"
echo "         └─ feature/* ← 功能分支"
echo ""
echo "📝 下一步："
echo ""
echo "1. 確保 main 分支與 upstream 同步："
echo "   git checkout main"
echo "   git fetch upstream"
echo "   git merge upstream/main"
echo "   git push origin main"
echo ""
echo "2. 從 dev 創建功能分支："
echo "   git checkout dev"
echo "   git checkout -b feature/my-feature"
echo "   # 開發代碼..."
echo "   git push origin feature/my-feature"
echo ""
echo "3. 創建 PR（在你的 fork 內）："
echo "   Base: dev"
echo "   Compare: feature/my-feature"
echo "   → ✅ Workflows 會執行"
echo ""
echo "4. 向 upstream 貢獻時："
echo "   git checkout main"
echo "   git checkout -b feature/for-upstream"
echo "   # cherry-pick 需要的 commits（不包括 CI/CD）"
echo "   git push origin feature/for-upstream"
echo "   → 創建 PR 到 apache/airflow"
echo ""
echo "✨ 完成！"
