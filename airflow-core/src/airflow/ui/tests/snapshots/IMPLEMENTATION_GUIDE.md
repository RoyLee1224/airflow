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
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->

# Implementation Guide: UI Snapshot Testing for Documentation Screenshots

**Related Issue**: [#56486](https://github.com/apache/airflow/issues/56486)

## Overview

This implementation provides automated UI snapshot testing to generate documentation screenshots, addressing two key goals:

1. **Eliminate manual screenshot updates** - Screenshots are now generated automatically
2. **Increase test coverage** - Every screenshot test also validates that the page renders correctly

## What Was Implemented

### 1. Playwright Test Infrastructure ✅

**Files Created:**
- `playwright.config.ts` - Playwright configuration with light/dark theme support
- `tests/snapshots/` - New directory for snapshot tests

**Features:**
- Dual theme support (automatic light/dark screenshots)
- Configurable viewports (1280x720 default)
- Network idle waiting for stable screenshots
- Development server auto-start

### 2. Test Utilities and Helpers ✅

**Files:**
- `tests/snapshots/helpers/screenshot.ts` - Screenshot capture utilities
- `tests/snapshots/helpers/mockRoutes.ts` - API mocking setup

**Key Functions:**
- `takeDocScreenshot()` - Smart screenshot capture with automatic theme detection
- `setupMockRoutes()` - Comprehensive API mocking
- `waitForAppReady()` - Ensures page is fully loaded

### 3. Realistic Mock Data ✅

**File:** `tests/snapshots/fixtures/mockData.ts`

**Includes:**
- 5 example DAGs with various states (success, running, failed, paused)
- Realistic owners, tags, and schedules
- DAG runs with proper timestamps
- Configuration data matching production format

### 4. Initial Test Coverage ✅

**Files:**
- `tests/snapshots/dagsList.spec.ts` - DAGs list and home page
- `tests/snapshots/dagDetails.spec.ts` - DAG detail views

**Screenshots Generated:**
- Home page (light & dark)
- DAG list (light & dark)
- DAG overview dashboard
- Grid view
- Graph view
- Code view
- Details tab
- Events tab

**Total: 9 unique screenshots × 2 themes = 18 screenshot files**

### 5. Documentation ✅

**Files:**
- `tests/snapshots/README.md` - Complete usage guide
- `tests/snapshots/SCREENSHOT_MAPPING.md` - Screenshot inventory and roadmap
- `tests/snapshots/IMPLEMENTATION_GUIDE.md` - This file

### 6. NPM Scripts ✅

Added to `package.json`:
```json
"screenshots": "playwright test tests/snapshots",
"screenshots:light": "playwright test tests/snapshots --project=light-theme-desktop",
"screenshots:dark": "playwright test tests/snapshots --project=dark-theme-desktop",
"screenshots:debug": "playwright test tests/snapshots --headed --debug"
```

## Quick Start

### Installation

```bash
cd airflow-core/src/airflow/ui
pnpm install
pnpm exec playwright install
```

### Generate Screenshots

```bash
# Generate all screenshots (light + dark)
pnpm screenshots

# Light theme only
pnpm screenshots:light

# Debug mode (see browser)
pnpm screenshots:debug
```

### Output Location

Screenshots are saved to:
- `airflow-core/docs/img/ui-light/` - Light theme
- `airflow-core/docs/img/ui-dark/` - Dark theme

## Architecture Decisions

### Why Playwright Instead of Vitest?

| Aspect | Playwright | Vitest (happy-dom) |
|--------|-----------|-------------------|
| Browser rendering | ✅ Real Chrome | ❌ Simulated DOM |
| Screenshot quality | ✅ High quality | ❌ Not supported |
| Animation handling | ✅ Excellent | ⚠️ Limited |
| Font rendering | ✅ Accurate | ❌ Missing |
| Theme support | ✅ Built-in | ⚠️ Manual |

**Decision**: Use Playwright for screenshot tests, keep Vitest for unit tests.

### Why Mock API Routes?

- **Consistency**: Same data every time
- **Speed**: No backend required
- **Reliability**: No network flakiness
- **Realistic**: Mock data matches production patterns

### Theme Handling

Projects automatically generate both themes:
```typescript
projects: [
  { name: "light-theme-desktop", colorScheme: "light" },
  { name: "dark-theme-desktop", colorScheme: "dark" }
]
```

The `takeDocScreenshot` helper detects theme from project name.

## Current Status

### ✅ Completed (Phase 1)

- [x] Playwright setup and configuration
- [x] Screenshot utilities and helpers
- [x] Mock data infrastructure
- [x] Initial tests (DAGs list + details)
- [x] Documentation and guides
- [x] NPM scripts
- [x] 9 screenshots implemented (~10% of total)

### 🔄 In Progress (Phase 2)

Next priority screenshots to implement:

1. **DAG Runs** (`dagRuns.spec.ts`)
   - `dag_run_details.png`
   - `dag_run_task_instances.png`
   - `dag_run_graph.png`

2. **Task Instances** (`taskInstance.spec.ts`)
   - `dag_task_instance_logs.png`
   - `task_instance_history.png`
   - `task_doc.png`

3. **Variables & Connections** (`variables.spec.ts`, `connections.spec.ts`)
   - `variable_hidden.png`
   - `connection_create.png`
   - `connection_edit.png`

### 📋 Roadmap (Phase 3+)

See `SCREENSHOT_MAPPING.md` for complete list (~90+ screenshots total).

## How to Extend

### Adding a New Test File

```bash
# 1. Create new test file
touch tests/snapshots/myFeature.spec.ts

# 2. Copy template structure
```

```typescript
import { test, expect } from "@playwright/test";
import { setupMockRoutes } from "./helpers/mockRoutes";
import { takeDocScreenshot, waitForAppReady } from "./helpers/screenshot";

test.describe("My Feature Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test("captures my_feature", async ({ page }, testInfo) => {
    await page.goto("/my-feature");
    await waitForAppReady(page);

    await takeDocScreenshot(page, {
      name: "my_feature",
      fullPage: false,
      viewport: { width: 1280, height: 900 },
    }, testInfo.project.name);
  });
});
```

### Adding Mock Data

```typescript
// tests/snapshots/fixtures/mockData.ts
export const mockMyFeature = {
  // ... realistic data
};

// tests/snapshots/helpers/mockRoutes.ts
await page.route("**/ui/my-endpoint", async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify(mockMyFeature),
  });
});
```

### Update Documentation

```markdown
<!-- tests/snapshots/SCREENSHOT_MAPPING.md -->
| `my_feature.png` | `myFeature.spec.ts` | "captures my_feature" | `docs/ui.rst` |
```

## Testing the Tests

```bash
# Run specific test
pnpm exec playwright test tests/snapshots/dagsList.spec.ts

# Show browser during test
pnpm exec playwright test tests/snapshots/dagsList.spec.ts --headed

# Debug step-by-step
pnpm exec playwright test tests/snapshots/dagsList.spec.ts --debug

# Update snapshots (if using Playwright snapshots)
pnpm exec playwright test tests/snapshots --update-snapshots
```

## CI Integration Example

```yaml
name: Generate Documentation Screenshots

on:
  pull_request:
    paths:
      - 'airflow-core/src/airflow/ui/**'
      - 'airflow-core/docs/**'

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        working-directory: airflow-core/src/airflow/ui
        run: |
          pnpm install
          pnpm exec playwright install --with-deps

      - name: Generate screenshots
        working-directory: airflow-core/src/airflow/ui
        run: pnpm screenshots

      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        with:
          name: documentation-screenshots
          path: airflow-core/docs/img/
```

## Benefits Achieved

### 🎯 Primary Goals

1. ✅ **Automated screenshot updates** - Run `pnpm screenshots` instead of manual capture
2. ✅ **Increased test coverage** - Every screenshot test validates page rendering
3. ✅ **Consistent quality** - Same viewport, same data, same process every time

### 🚀 Additional Benefits

4. ✅ **Dual theme support** - Automatic light/dark screenshot generation
5. ✅ **Version control** - Screenshot tests track UI changes over time
6. ✅ **Faster documentation** - No more "update screenshots" bottleneck
7. ✅ **Realistic examples** - Mock data represents real production usage

## Next Steps

### For Contributors

1. **Add more tests** - See `SCREENSHOT_MAPPING.md` for priorities
2. **Improve mock data** - Make it even more realistic
3. **Add edge cases** - Error states, loading states, empty states
4. **Optimize performance** - Parallel test execution, caching

### For Maintainers

1. **Set up CI workflow** - Automatically generate screenshots on PR
2. **Define update policy** - When to regenerate all screenshots
3. **Review process** - How to review screenshot changes in PRs

## Troubleshooting

### Common Issues

**Q: Screenshots are blank**
```bash
# Increase wait time
await page.waitForTimeout(2000);
```

**Q: Tests timing out**
```bash
# Check dev server is running
# Increase timeout in playwright.config.ts
```

**Q: Different results locally vs CI**
```bash
# Ensure --with-deps flag for Playwright install
pnpm exec playwright install --with-deps
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Issue #56486](https://github.com/apache/airflow/issues/56486)

## Credits

This implementation addresses Apache Airflow issue #56486, providing a sustainable solution for maintaining documentation screenshots while improving test coverage.
