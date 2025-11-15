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
 * Browser Mode 測試設置文件範例
 *
 * 這個文件展示如何為 Browser Mode 測試設置特殊的配置。
 * Browser Mode 運行在真實瀏覽器中，因此某些 Mock 和設置可能不同於 Node 環境。
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { beforeEach, afterEach, vi } from "vitest";

// Browser Mode 中不需要 MSW，因為我們可以使用真實的 HTTP 請求
// 或者使用瀏覽器原生的 Service Worker

// 如果需要在 Browser Mode 中使用 MSW
// import { setupWorker } from "msw/browser";
// import { handlers } from "src/mocks/handlers";

// const worker = setupWorker(...handlers);

// beforeAll(async () => {
//   await worker.start({ onUnhandledRequest: "bypass" });
// });

// afterAll(() => {
//   worker.stop();
// });

// Browser Mode 中可以使用真實的 Chart.js
// 不需要 Mock，除非有特殊需求

// 每個測試前重置
beforeEach(() => {
  // 重置 localStorage
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }

  // 重置 cookies (如果需要)
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });
  }

  // 設置固定的視窗大小 (確保一致性)
  // 注意：這在 Vitest Browser Mode 中可能需要在配置文件中設置
});

// 每個測試後清理
afterEach(() => {
  cleanup();

  // 清理任何添加的 DOM 元素
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
  }

  // 恢復所有 Mock
  vi.restoreAllMocks();
});

// 視覺測試專用的輔助函數
export const waitForAnimations = async (timeout = 300) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

// 等待圖片載入
export const waitForImages = async () => {
  if (typeof document !== "undefined") {
    const images = Array.from(document.images);
    await Promise.all(
      images
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            })
        )
    );
  }
};

// 等待字體載入
export const waitForFonts = async () => {
  if (typeof document !== "undefined" && "fonts" in document) {
    await (document as any).fonts.ready;
  }
};

// 禁用動畫 (視覺測試時有用)
export const disableAnimations = () => {
  if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.textContent = `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// 啟用高對比度模式 (無障礙測試)
export const enableHighContrast = () => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-high-contrast", "true");
  }
};

// 模擬暗色模式
export const setDarkMode = () => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
};

// 模擬亮色模式
export const setLightMode = () => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", "light");
  }
};

// 模擬移動設備
export const setMobileViewport = async () => {
  // 這需要在 Vitest Browser 配置中設置
  // 或使用 page.setViewportSize()
  console.warn("setMobileViewport should be called using page.setViewportSize()");
};

// 截圖輔助函數
export const takeScreenshot = async (name: string) => {
  // 這需要使用 @vitest/browser/context
  console.warn("Use page.screenshot() from @vitest/browser/context instead");
};

// Console 錯誤監聽 (捕獲 React 錯誤)
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // 過濾掉某些預期的警告
    const message = args[0]?.toString() || "";

    if (
      message.includes("Warning: ReactDOM.render") ||
      message.includes("Not implemented: HTMLFormElement.prototype.submit")
    ) {
      return;
    }

    originalError.call(console, ...args);
  };
}

// 全域測試輔助工具
declare global {
  interface Window {
    testHelpers: {
      waitForAnimations: typeof waitForAnimations;
      waitForImages: typeof waitForImages;
      waitForFonts: typeof waitForFonts;
      disableAnimations: typeof disableAnimations;
      enableHighContrast: typeof enableHighContrast;
      setDarkMode: typeof setDarkMode;
      setLightMode: typeof setLightMode;
    };
  }
}

if (typeof window !== "undefined") {
  window.testHelpers = {
    waitForAnimations,
    waitForImages,
    waitForFonts,
    disableAnimations,
    enableHighContrast,
    setDarkMode,
    setLightMode,
  };
}

/**
 * Browser Mode 測試設置的注意事項：
 *
 * 1. Browser Mode 運行在真實瀏覽器中，可以使用所有瀏覽器 API
 * 2. 不需要 happy-dom 或 jsdom
 * 3. 可以測試真實的 CSS 渲染和布局
 * 4. 可以測試真實的使用者互動
 * 5. 測試速度較慢，但更接近真實環境
 * 6. 適合視覺回歸測試和複雜的互動測試
 * 7. MSW 在 Browser Mode 中使用 Service Worker，設置略有不同
 * 8. 確保測試的穩定性（固定視窗大小、禁用動畫等）
 */
