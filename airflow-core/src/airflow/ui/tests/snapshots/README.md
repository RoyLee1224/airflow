<!--
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->

# UI Snapshot Tests for Documentation Screenshots

This directory contains Playwright-based snapshot tests that automatically generate screenshots for the Airflow documentation.

## Purpose

Manually updating documentation screenshots is time-consuming and error-prone. These tests:

1. **Automate screenshot generation** - Screenshots are generated automatically when UI changes
2. **Ensure consistency** - All screenshots use the same mock data and viewport settings
3. **Improve test coverage** - Each screenshot test also validates that the page renders correctly
4. **Support both themes** - Automatically generates both light and dark theme screenshots

## Structure

```
tests/snapshots/
├── README.md                 # This file
├── SCREENSHOT_MAPPING.md    # Maps screenshots to test files
├── helpers/
│   └── screenshot.ts        # Screenshot utilities
├── dagsList.spec.ts         # DAGs list page screenshots
├── dagDetails.spec.ts       # DAG details page screenshots
└── ... (more test files)
```

## Running the Tests

### Prerequisites

The UI dev server requires a running Airflow backend to provide API data. Use Breeze to start the backend:

```bash
# Start Breeze with dev mode (from airflow root directory)
breeze start-airflow --dev-mode
```

This will start the Airflow backend API server on port 28080 (by default).

Then install Playwright dependencies:

```bash
# Install dependencies (including Playwright browsers)
cd airflow-core/src/airflow/ui
pnpm install
pnpm exec playwright install
```

### Generate All Screenshots

```bash
# Generate screenshots for both light and dark themes
pnpm screenshots

# Or use Playwright directly
pnpm exec playwright test tests/snapshots
```

The test runner will:
1. Automatically start the Vite dev server on port 5173
2. The dev server proxies API requests to your Breeze backend (port 28080)
3. Run Playwright tests to capture screenshots
4. Save screenshots to `docs/img/ui-light/` and `docs/img/ui-dark/`

### Generate Screenshots for Specific Theme

```bash
# Light theme only
pnpm exec playwright test tests/snapshots --project=light-theme-desktop

# Dark theme only
pnpm exec playwright test tests/snapshots --project=dark-theme-desktop
```

### Debug Mode

```bash
# Run in headed mode to see the browser
pnpm exec playwright test tests/snapshots --headed

# Debug a specific test
pnpm exec playwright test tests/snapshots/dagsList.spec.ts --debug
```

## Output

Screenshots are automatically saved to:
- `docs/img/ui-light/` - Light theme screenshots
- `docs/img/ui-dark/` - Dark theme screenshots

These directories are relative to the project root (`airflow-core/`).

## Adding New Screenshots

### 1. Prepare test data in Breeze

Ensure your Breeze environment has the necessary test data (DAGs, connections, variables, etc.) that you want to capture in screenshots.

### 2. Create a new test file

```typescript
// tests/snapshots/myFeature.spec.ts
import { test, expect } from "@playwright/test";
import { takeDocScreenshot, waitForAppReady } from "./helpers/screenshot";

test.describe("My Feature Screenshots", () => {
  test("captures my feature", async ({ page }, testInfo) => {
    await page.goto("/my-feature");
    await waitForAppReady(page);

    const screenshotPath = await takeDocScreenshot(
      page,
      {
        name: "my_feature",
        fullPage: false,
        viewport: { width: 1280, height: 900 },
      },
      testInfo.project.name,
    );

    expect(screenshotPath).toBeTruthy();
  });
});
```

### 3. Run and verify

```bash
pnpm screenshots
# Check the generated images in docs/img/ui-light/ and docs/img/ui-dark/
```

## Screenshot Options

The `takeDocScreenshot` helper accepts these options:

```typescript
{
  name: string;                 // Screenshot filename (without .png)
  selector?: string;            // Optional: screenshot specific element
  waitForNetworkIdle?: boolean; // Wait for network (default: true)
  additionalWaitTime?: number;  // Extra wait time in ms (default: 500)
  fullPage?: boolean;           // Full page screenshot (default: true)
  viewport?: {                  // Custom viewport size
    width: number;
    height: number;
  };
}
```

## Best Practices

1. **Use realistic test data** - Ensure Breeze has realistic DAGs and data for screenshots
2. **Wait for rendering** - Use `waitForAppReady()` and add extra wait time for animations
3. **Consistent viewports** - Use standard sizes (1280x800, 1280x900)
4. **Test coverage** - Each screenshot test also validates page rendering
5. **Both themes** - Tests run for both light and dark themes automatically

## Troubleshooting

### Screenshots are blank or incomplete

- Increase `additionalWaitTime` in screenshot options
- Ensure Breeze backend is running and accessible on port 28080
- Check that selectors are correct
- Verify the UI can load data from the backend

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check that the dev server and Breeze backend are both running
- Verify the backend API is responding (check Network tab in browser)
- Ensure no port conflicts (5173 for UI, 28080 for backend)

### Different appearance in CI vs local

- Ensure consistent viewport sizes
- Use `colorScheme` setting in Playwright config
- Wait for fonts and images to load

## CI Integration

To run screenshot generation in CI:

```yaml
- name: Generate documentation screenshots
  run: |
    cd airflow-core/src/airflow/ui
    pnpm install
    pnpm exec playwright install --with-deps
    pnpm screenshots
```

## Related Issues

- [#56486](https://github.com/apache/airflow/issues/56486) - Use UI snapshot testing to generate docs screenshots
