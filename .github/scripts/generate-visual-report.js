#!/usr/bin/env node

/**
 * 生成視覺測試報告
 *
 * 這個腳本會生成一個 HTML 報告，展示所有的視覺變更。
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  inputFile: 'visual-report/comparison-results.json',
  outputDir: 'visual-report',
  outputFile: 'visual-report/index.html',
};

function generateHTML(results) {
  const changes = results.comparisons.filter(
    c => c.diffPixels > 0 || c.status === 'new' || c.status === 'removed'
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .stat-number {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-passed { color: #28a745; }
    .stat-changed { color: #ffc107; }
    .stat-new { color: #17a2b8; }
    .stat-removed { color: #dc3545; }
    .stat-failed { color: #dc3545; }

    .changes {
      padding: 30px;
    }

    .change-item {
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .change-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .change-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .change-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-changed {
      background: #fff3cd;
      color: #856404;
    }

    .badge-new {
      background: #d1ecf1;
      color: #0c5460;
    }

    .badge-removed {
      background: #f8d7da;
      color: #721c24;
    }

    .image-comparison {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .image-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .image-label {
      font-weight: 600;
      margin-bottom: 10px;
      color: #495057;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }

    .image-box img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      display: block;
    }

    .diff-percentage {
      margin-top: 10px;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .diff-percentage strong {
      color: #ffc107;
    }

    .no-changes {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .no-changes svg {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 0.9rem;
      border-top: 1px solid #e9ecef;
    }

    @media (max-width: 768px) {
      .image-comparison {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎨 Visual Regression Test Report</h1>
      <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
    </header>

    <div class="summary">
      <div class="stat-card">
        <div class="stat-number">${results.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-passed">${results.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-changed">${results.changed}</div>
        <div class="stat-label">Changed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-new">${results.new}</div>
        <div class="stat-label">New</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-removed">${results.removed}</div>
        <div class="stat-label">Removed</div>
      </div>
      ${results.failed > 0 ? `
      <div class="stat-card">
        <div class="stat-number stat-failed">${results.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      ` : ''}
    </div>

    <div class="changes">
      ${changes.length === 0 ? `
        <div class="no-changes">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>✨ No Visual Changes Detected!</h2>
          <p>All screenshots match the base branch.</p>
        </div>
      ` : changes.map((change, index) => `
        <div class="change-item" id="change-${index}">
          <div class="change-header">
            <div class="change-name">${change.name}</div>
            <span class="change-badge badge-${change.status || 'changed'}">
              ${change.status === 'new' ? '✨ New' :
                change.status === 'removed' ? '🗑️ Removed' :
                `🔄 ${change.diffPercentage}% Changed`}
            </span>
          </div>

          <div class="image-comparison">
            ${change.basePath ? `
              <div class="image-box">
                <div class="image-label">Before (Base)</div>
                <img src="${path.relative(CONFIG.outputDir, change.basePath)}" alt="Base screenshot">
              </div>
            ` : ''}

            ${change.prPath ? `
              <div class="image-box">
                <div class="image-label">After (PR)</div>
                <img src="${path.relative(CONFIG.outputDir, change.prPath)}" alt="PR screenshot">
              </div>
            ` : ''}

            ${change.diffPath ? `
              <div class="image-box">
                <div class="image-label">Difference</div>
                <img src="${path.relative(CONFIG.outputDir, change.diffPath)}" alt="Diff">
                <div class="diff-percentage">
                  <strong>${change.diffPixels}</strong> pixels changed
                  (<strong>${change.diffPercentage}%</strong>)
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <footer>
      Generated by Airflow Visual Regression Tests •
      Powered by Vitest + Playwright
    </footer>
  </div>
</body>
</html>
  `;
}

function generateJSONReport(results) {
  const changes = results.comparisons.filter(
    c => c.diffPixels > 0 || c.status === 'new' || c.status === 'removed'
  );

  return {
    summary: changes.length === 0
      ? '✨ No visual changes detected!'
      : `⚠️ ${changes.length} visual change(s) detected`,
    total: results.total,
    passed: results.passed,
    failed: results.failed,
    changed: results.changed,
    new: results.new,
    removed: results.removed,
    changes: changes.map(change => ({
      name: change.name,
      status: change.status || 'changed',
      diff: change.diffPercentage || 0,
      baseUrl: change.basePath
        ? `https://your-username.github.io/airflow/pr-${process.env.PR_NUMBER}/${path.relative(CONFIG.outputDir, change.basePath)}`
        : null,
      prUrl: change.prPath
        ? `https://your-username.github.io/airflow/pr-${process.env.PR_NUMBER}/${path.relative(CONFIG.outputDir, change.prPath)}`
        : null,
      diffUrl: change.diffPath
        ? `https://your-username.github.io/airflow/pr-${process.env.PR_NUMBER}/${path.relative(CONFIG.outputDir, change.diffPath)}`
        : null,
    })),
  };
}

function main() {
  console.log('📝 Generating visual test report...\n');

  // 讀取對比結果
  const results = JSON.parse(fs.readFileSync(CONFIG.inputFile, 'utf8'));

  // 生成 HTML 報告
  const html = generateHTML(results);
  fs.writeFileSync(CONFIG.outputFile, html);
  console.log(`✅ HTML report generated: ${CONFIG.outputFile}`);

  // 生成 JSON 報告（用於 PR 評論）
  const jsonReport = generateJSONReport(results);
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'report.json'),
    JSON.stringify(jsonReport, null, 2)
  );
  console.log(`✅ JSON report generated: ${path.join(CONFIG.outputDir, 'report.json')}`);

  console.log('\n✨ Report generation complete!');
}

try {
  main();
} catch (error) {
  console.error('❌ Error generating report:', error);
  process.exit(1);
}
