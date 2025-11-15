#!/usr/bin/env node

/**
 * 截圖對比腳本
 *
 * 這個腳本會對比 base 分支和 PR 分支的截圖，
 * 並生成視覺差異報告。
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// 配置
const CONFIG = {
  baseDir: 'base-branch/airflow-core/src/airflow/ui',
  prDir: 'airflow-core/src/airflow/ui',
  outputDir: 'visual-report',
  threshold: 0.1, // 允許 10% 的差異
};

// 創建輸出目錄
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 查找所有截圖文件
function findScreenshots(dir) {
  const screenshots = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && file === '__image_snapshots__') {
        const images = fs.readdirSync(filePath)
          .filter(f => f.endsWith('.png'))
          .map(f => path.join(filePath, f));
        screenshots.push(...images);
      } else if (stat.isDirectory()) {
        walk(filePath);
      }
    }
  }

  walk(dir);
  return screenshots;
}

// 對比兩張圖片
function compareImages(basePath, prPath, outputPath) {
  try {
    const baseImg = PNG.sync.read(fs.readFileSync(basePath));
    const prImg = PNG.sync.read(fs.readFileSync(prPath));

    const { width, height } = baseImg;

    // 確保兩張圖片尺寸相同
    if (prImg.width !== width || prImg.height !== height) {
      console.warn(`⚠️  Size mismatch: ${basePath}`);
      return {
        match: false,
        diffPixels: -1,
        diffPercentage: 100,
        reason: 'Size mismatch',
      };
    }

    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      baseImg.data,
      prImg.data,
      diff.data,
      width,
      height,
      {
        threshold: CONFIG.threshold,
        includeAA: false,
      }
    );

    const diffPercentage = (diffPixels / (width * height)) * 100;

    // 保存差異圖片
    if (diffPixels > 0) {
      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, PNG.sync.write(diff));
    }

    return {
      match: diffPixels === 0,
      diffPixels,
      diffPercentage: diffPercentage.toFixed(2),
      width,
      height,
    };
  } catch (error) {
    console.error(`❌ Error comparing ${basePath}:`, error.message);
    return {
      match: false,
      diffPixels: -1,
      diffPercentage: -1,
      error: error.message,
    };
  }
}

// 主函數
function main() {
  console.log('🎨 Starting visual regression comparison...\n');

  ensureDir(CONFIG.outputDir);
  ensureDir(path.join(CONFIG.outputDir, 'diffs'));

  // 查找截圖
  const baseScreenshots = findScreenshots(CONFIG.baseDir);
  const prScreenshots = findScreenshots(CONFIG.prDir);

  console.log(`📸 Found ${baseScreenshots.length} base screenshots`);
  console.log(`📸 Found ${prScreenshots.length} PR screenshots\n`);

  // 建立截圖映射
  const baseMap = new Map();
  baseScreenshots.forEach(screenshot => {
    const relativePath = path.relative(CONFIG.baseDir, screenshot);
    baseMap.set(relativePath, screenshot);
  });

  const prMap = new Map();
  prScreenshots.forEach(screenshot => {
    const relativePath = path.relative(CONFIG.prDir, screenshot);
    prMap.set(relativePath, screenshot);
  });

  // 對比結果
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    changed: 0,
    new: 0,
    removed: 0,
    comparisons: [],
  };

  // 對比共同的截圖
  for (const [relativePath, basePath] of baseMap.entries()) {
    results.total++;

    if (prMap.has(relativePath)) {
      const prPath = prMap.get(relativePath);
      const outputPath = path.join(
        CONFIG.outputDir,
        'diffs',
        relativePath.replace('.png', '-diff.png')
      );

      console.log(`🔍 Comparing: ${relativePath}`);
      const comparison = compareImages(basePath, prPath, outputPath);

      const result = {
        name: relativePath,
        basePath,
        prPath,
        diffPath: comparison.diffPixels > 0 ? outputPath : null,
        ...comparison,
      };

      if (comparison.match) {
        console.log(`  ✅ Match (no changes)\n`);
        results.passed++;
      } else if (comparison.error) {
        console.log(`  ❌ Error: ${comparison.error}\n`);
        results.failed++;
      } else {
        console.log(`  🔄 Changed (${comparison.diffPercentage}% difference)\n`);
        results.changed++;
      }

      results.comparisons.push(result);
      prMap.delete(relativePath);
    } else {
      console.log(`🗑️  Removed: ${relativePath}\n`);
      results.removed++;
      results.comparisons.push({
        name: relativePath,
        basePath,
        prPath: null,
        status: 'removed',
      });
    }
  }

  // 新增的截圖
  for (const [relativePath, prPath] of prMap.entries()) {
    console.log(`✨ New: ${relativePath}\n`);
    results.new++;
    results.comparisons.push({
      name: relativePath,
      basePath: null,
      prPath,
      status: 'new',
    });
  }

  // 生成報告摘要
  console.log('\n📊 Summary:');
  console.log(`   Total: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   🔄 Changed: ${results.changed}`);
  console.log(`   ✨ New: ${results.new}`);
  console.log(`   🗑️  Removed: ${results.removed}`);
  console.log(`   ❌ Failed: ${results.failed}`);

  // 保存結果
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'comparison-results.json'),
    JSON.stringify(results, null, 2)
  );

  // 設置 GitHub Actions 輸出
  if (process.env.GITHUB_OUTPUT) {
    const hasChanges = results.changed > 0 || results.new > 0 || results.removed > 0;
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_changes=${hasChanges}\n`
    );
  }

  // 如果有變更，退出碼為 1（觸發評論）
  if (results.changed > 0 || results.new > 0 || results.removed > 0) {
    console.log('\n⚠️  Visual changes detected!');
    process.exit(0); // 不要失敗 workflow，只是標記
  }

  console.log('\n✨ No visual changes detected!');
  process.exit(0);
}

// 執行
try {
  main();
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}
