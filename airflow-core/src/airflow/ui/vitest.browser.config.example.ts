/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Vitest Browser Mode 配置範例
 *
 * 這個配置文件展示如何設置 Vitest 4.x 的 Browser Mode 進行真實瀏覽器測試。
 *
 * 使用方式：
 * 1. 複製此文件並重命名為 vitest.browser.config.ts
 * 2. 根據需要調整配置選項
 * 3. 執行: pnpm vitest run --config vitest.browser.config.ts
 */

import react from "@vitejs/plugin-react-swc";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { defineConfig } from "vitest/config";

// https://vitest.dev/config/
export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 1600, manifest: true },
  plugins: [
    react(),
    {
      name: "transform-url-src",
      transformIndexHtml: (html) =>
        html.replace(`src="./assets/`, `src="./static/assets/`).replace(`href="/`, `href="./`),
    },
    cssInjectedByJsPlugin(),
  ],
  resolve: { alias: { openapi: "/openapi-gen", src: "/src" } },
  server: {
    cors: true,
  },
  test: {
    // Browser Mode 配置
    browser: {
      enabled: true,

      // 瀏覽器選擇
      // 選項: 'chromium', 'firefox', 'webkit'
      name: "chromium",

      // Provider 選擇
      // 選項: 'playwright' (推薦) 或 'webdriverio'
      provider: "playwright",

      // Headless 模式 (CI 環境建議使用 true)
      headless: true,

      // 測試失敗時自動截圖
      screenshotFailures: true,

      // 視窗大小設置
      viewport: {
        width: 1280,
        height: 720,
      },

      // Playwright 特定選項
      providerOptions: {
        launch: {
          // 瀏覽器啟動選項
          args: [
            "--disable-web-security", // 如果需要測試 CORS
            "--disable-features=IsolateOrigins,site-per-process",
          ],
          // 啟用 devtools (開發時有用)
          devtools: false,
        },
        context: {
          // 模擬設備
          // deviceScaleFactor: 2,
          // isMobile: false,
          // hasTouch: false,

          // 權限設置
          permissions: ["clipboard-read", "clipboard-write"],

          // 地理位置
          // geolocation: { latitude: 37.7749, longitude: -122.4194 },

          // 時區設置
          timezoneId: "UTC",

          // 語言設置
          locale: "en-US",
        },
      },
    },

    // 測試文件匹配模式
    // 只執行 .browser.test.ts(x) 和 .visual.test.ts(x) 文件
    include: [
      "src/**/*.browser.test.{ts,tsx}",
      "src/**/*.visual.test.{ts,tsx}",
      "examples/**/*.browser.test.{ts,tsx}",
      "examples/**/*.visual.test.{ts,tsx}",
    ],

    // 排除標準測試文件
    exclude: [
      "node_modules",
      "dist",
      ".git",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
    ],

    // 測試超時設置 (Browser 測試通常需要更長時間)
    testTimeout: 30000,

    // Hook 超時設置
    hookTimeout: 30000,

    // 覆蓋率配置
    coverage: {
      enabled: false, // Browser Mode 的覆蓋率收集較複雜，通常分開處理
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "node_modules",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.browser.test.{ts,tsx}",
        "src/**/*.visual.test.{ts,tsx}",
      ],
    },

    // 全域設置
    globals: true,

    // CSS 支援
    css: true,

    // Mock 設置
    mockReset: true,
    restoreMocks: true,

    // 設置文件 (可能需要不同的設置)
    setupFiles: "./testsSetup.browser.ts",

    // 報告器設置
    reporters: ["default", "html"],

    // 輸出目錄
    outputFile: {
      html: "./test-results/browser-tests/index.html",
    },
  },
});
