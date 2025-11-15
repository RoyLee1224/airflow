#!/bin/bash

# 在當前分支測試 workflows 的腳本
# 使用方式: ./test-workflows-on-current-branch.sh

set -e

echo "🚀 Setting up workflows to test on current branch"
echo ""

# 獲取當前分支名
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "claude/airflow-vitest-snapshot-tests-0139dNs4W4bMfwKBMbyFsdrZ" ]; then
  echo "⚠️  Warning: This script is designed for the claude/airflow-vitest-snapshot-tests-0139dNs4W4bMfwKBMbyFsdrZ branch"
  echo "   Current branch: $CURRENT_BRANCH"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📝 Updating workflow files to include current branch..."
echo ""

# 備份原始文件
cp .github/workflows/visual-regression.yml .github/workflows/visual-regression.yml.bak
cp .github/workflows/pr-preview.yml .github/workflows/pr-preview.yml.bak

# 更新 visual-regression.yml
sed -i '/on:/,/pull_request:/ {
  /pull_request:/a\
    branches:\
      - main\
      - "claude/**"
}' .github/workflows/visual-regression.yml

# 更新 pr-preview.yml
sed -i '/on:/,/pull_request:/ {
  /types: \[opened, synchronize, reopened\]/a\
    branches:\
      - main\
      - "claude/**"
}' .github/workflows/pr-preview.yml

echo "✅ Workflow files updated!"
echo ""
echo "📋 Changes made:"
echo "  - Added 'claude/**' to allowed branches"
echo "  - Workflows will now trigger on PRs to claude/* branches"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Commit the changes:"
echo "   git add .github/workflows/"
echo "   git commit -m 'ci: enable workflows on claude branches'"
echo "   git push"
echo ""
echo "2. Create a test branch:"
echo "   git checkout -b test-workflows-$(date +%s)"
echo "   echo 'test' >> airflow-core/src/airflow/ui/TEST.md"
echo "   git add airflow-core/src/airflow/ui/TEST.md"
echo "   git commit -m 'test: trigger workflows'"
echo "   git push origin test-workflows-$(date +%s)"
echo ""
echo "3. Create PR on GitHub:"
echo "   Base: $CURRENT_BRANCH"
echo "   Compare: test-workflows-*"
echo ""
echo "✨ Workflows should now execute!"
echo ""
echo "💡 To restore original files:"
echo "   mv .github/workflows/visual-regression.yml.bak .github/workflows/visual-regression.yml"
echo "   mv .github/workflows/pr-preview.yml.bak .github/workflows/pr-preview.yml"
