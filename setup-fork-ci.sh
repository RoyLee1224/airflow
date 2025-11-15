#!/bin/bash

# Fork Repo 視覺測試和 PR 預覽設置腳本
#
# 使用方式: ./setup-fork-ci.sh

set -e

echo "🚀 Setting up Visual Testing and PR Preview for Fork Repo"
echo ""

# 獲取 GitHub username
echo "📝 Please enter your GitHub username (e.g., RoyLee1224):"
read -r GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ GitHub username is required!"
  exit 1
fi

echo ""
echo "✅ Using GitHub username: $GITHUB_USERNAME"
echo ""

# 更新 workflow 文件
echo "📝 Updating workflow files..."

# 更新 visual-regression.yml
sed -i.bak "s/your-username/${GITHUB_USERNAME}/g" .github/workflows/visual-regression.yml
echo "  ✅ Updated visual-regression.yml"

# 更新 pr-preview.yml
sed -i.bak "s/your-username/${GITHUB_USERNAME}/g" .github/workflows/pr-preview.yml
echo "  ✅ Updated pr-preview.yml"

# 更新生成報告腳本
sed -i.bak "s/your-username/${GITHUB_USERNAME}/g" .github/scripts/generate-visual-report.js
echo "  ✅ Updated generate-visual-report.js"

# 刪除備份文件
rm -f .github/workflows/*.bak .github/scripts/*.bak

echo ""
echo "🎉 Configuration complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Enable GitHub Actions in your fork:"
echo "   → Go to https://github.com/${GITHUB_USERNAME}/airflow/actions"
echo "   → Click 'I understand my workflows, go ahead and enable them'"
echo ""
echo "2. Enable GitHub Pages:"
echo "   → Go to https://github.com/${GITHUB_USERNAME}/airflow/settings/pages"
echo "   → Source: GitHub Actions"
echo ""
echo "3. Set workflow permissions:"
echo "   → Go to https://github.com/${GITHUB_USERNAME}/airflow/settings/actions"
echo "   → Workflow permissions: Read and write permissions"
echo "   → ✓ Allow GitHub Actions to create and approve pull requests"
echo ""
echo "4. Test the setup:"
echo "   → Create a test PR in your fork"
echo "   → Check Actions tab for workflow runs"
echo "   → Look for bot comments in the PR"
echo ""
echo "5. Your preview URLs will be:"
echo "   → https://${GITHUB_USERNAME}.github.io/airflow/pr-[number]"
echo ""
echo "✨ Happy testing!"
