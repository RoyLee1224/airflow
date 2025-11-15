# Tooltip Refactoring Guide

## 🎯 簡潔架構設計原則

### 核心理念
1. **單一職責** - 每個組件只做一件事
2. **組合優於繼承** - 通過組合構建複雜功能
3. **最小驚訝** - API 直觀易懂
4. **零重複** - 共用邏輯提取到基礎組件

---

## 📊 架構演進

### 階段 1: 原始架構（多處重複）
```tsx
// GridTI.tsx - 67 lines of inline tooltip logic
<Tooltip
  content={
    <>
      {translate("taskId")}: {taskId}
      <br />
      {translate("state")}: {instance.state}
      {/* More repeated logic... */}
    </>
  }
>
  <Badge />
</Tooltip>

// CalendarTooltip.tsx - 149 lines with manual positioning
const tooltipStyle = useMemo(() => {
  const rect = triggerRef.current.getBoundingClientRect();
  return { /* 50 lines of positioning logic */ };
}, [triggerRef]);

return <div style={tooltipStyle}>{/* content */}</div>;
```

**問題:**
- ❌ 重複的格式化邏輯
- ❌ 重複的定位計算
- ❌ 難以維護
- ❌ 不一致的行為

---

### 階段 2: 內容分離（已完成）
```tsx
// ✅ Extracted content component
<TaskInstanceTooltip taskInstance={instance}>
  <Badge />
</TaskInstanceTooltip>

// ✅ Reusable content components
<TaskInstanceTooltipContent taskInstance={instance} />
```

**改進:**
- ✅ 內容邏輯可重用
- ✅ 格式化邏輯標準化
- ✅ 為完全集成打下基礎

---

### 階段 3: 完全集成（建議架構）
```tsx
// ✨ CustomTooltip - All-in-one solution
<CustomTooltip
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<TaskInstanceTooltipContent taskInstance={instance} />}
>
  <Badge />
</CustomTooltip>

// ✨ Or use specialized wrapper
<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge />
</GridTaskInstanceTooltip>
```

**優勢:**
- ✅ 單一組件
- ✅ 零樣板代碼
- ✅ 自動 ref 管理
- ✅ 最佳性能

---

## 🔄 具體重構示例

### 示例 1: Grid View

#### Before (Current)
```tsx
// GridTI.tsx - 需要 3 個導入, 10 行代碼
import { HoverTooltip } from "src/components/HoverTooltip";
import { GridTaskInstanceTooltipManual } from "src/components/tooltip/GridTaskInstanceTooltipManual";
import type { RefObject } from "react";

<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef: RefObject<HTMLElement>) => (
    <GridTaskInstanceTooltipManual
      instance={instance}
      showRunId={false}
      showTaskId
      triggerRef={triggerRef}
    />
  )}
>
  <Badge />
</HoverTooltip>
```

#### After (Proposed)
```tsx
// GridTI.tsx - 需要 1 個導入, 3 行代碼
import { GridTaskInstanceTooltip } from "src/components/tooltip";

<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge />
</GridTaskInstanceTooltip>
```

**減少: 70% 代碼量**

---

### 示例 2: Calendar View

#### Before (Current)
```tsx
// CalendarCell.tsx
import { HoverTooltip } from "src/components/HoverTooltip";
import { CalendarTooltip } from "./CalendarTooltip";

const renderTooltip =
  (cellData, viewMode) => (triggerRef) => (
    <CalendarTooltip
      cellData={cellData}
      triggerRef={triggerRef}
      viewMode={viewMode}
    />
  );

return (
  <HoverTooltip delayMs={500} tooltip={renderTooltip(cellData, viewMode)}>
    {cellBox}
  </HoverTooltip>
);
```

#### After (Proposed)
```tsx
// CalendarCell.tsx
import { CalendarTooltip } from "./CalendarTooltip";

return (
  <CalendarTooltip cellData={cellData} viewMode={viewMode}>
    {cellBox}
  </CalendarTooltip>
);

// CalendarTooltip.tsx - using CustomTooltip
export const CalendarTooltip = ({ cellData, viewMode, children }) =>
  cellData ? (
    <CustomTooltip
      delayMs={500}
      config={{ ...CALENDAR_MANUAL_TOOLTIP_CONFIG, containerStyle: { minWidth: "200px" } }}
      content={<CalendarTooltipContent cellData={cellData} viewMode={viewMode} />}
    >
      {children}
    </CustomTooltip>
  ) : (
    children
  );
```

**減少: 60% 代碼量, 消除 renderTooltip 包裝**

---

### 示例 3: Task Recent Runs

#### Before (Current)
```tsx
// TaskRecentRuns.tsx
import { HoverTooltip } from "src/components/HoverTooltip";
import { TaskRecentRunsTooltipManual } from "src/components/tooltip/TaskRecentRunsTooltipManual";
import type { RefObject } from "react";

<HoverTooltip
  delayMs={500}
  key={taskInstance.dag_run_id}
  tooltip={(triggerRef: RefObject<HTMLElement>) => (
    <TaskRecentRunsTooltipManual
      taskInstance={taskInstance}
      triggerRef={triggerRef}
    />
  )}
>
  <Link>
    <Box width="4px" />
  </Link>
</HoverTooltip>
```

#### After (Proposed)
```tsx
// TaskRecentRuns.tsx
import { TaskRecentRunsTooltip } from "src/components/tooltip";

<TaskRecentRunsTooltip
  key={taskInstance.dag_run_id}
  taskInstance={taskInstance}
>
  <Link>
    <Box width="4px" />
  </Link>
</TaskRecentRunsTooltip>
```

**減少: 50% 代碼量**

---

## 🏗️ 組件分層設計

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Application Components (最簡潔)                │
│  GridTI.tsx, CalendarCell.tsx, TaskRecentRuns.tsx      │
│                                                          │
│  <GridTaskInstanceTooltip taskInstance={x}>            │
│    <Badge />                                            │
│  </GridTaskInstanceTooltip>                            │
└─────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Specialized Wrappers (預配置)                  │
│  GridTaskInstanceTooltip.tsx                            │
│  TaskRecentRunsTooltip.tsx                              │
│  CalendarTooltip.tsx (updated)                          │
│                                                          │
│  - Pre-configured with right config                     │
│  - Handles common patterns                              │
│  - Abstracts complexity                                 │
└─────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Base Components (通用)                         │
│  ManualTooltipV2.tsx                                     │
│                                                          │
│  - Integrated hover management                          │
│  - Manual positioning                                   │
│  - Configurable                                         │
└─────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Layer 0: Content & Config (純數據)                      │
│  TaskInstanceTooltipContent.tsx                          │
│  TooltipField.tsx                                       │
│  manualTooltipConfig.ts                                 │
│                                                          │
│  - Pure components (no state)                           │
│  - Formatting logic only                                │
│  - Shared configurations                                │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ 可共用部分提取清單

### 1. ✅ 內容格式化 → Content Components
```tsx
// Before: Repeated in every tooltip
<div>
  {translate("taskId")}: {taskId}
  {translate("state")}: {state}
</div>

// After: Single component
<TaskInstanceTooltipContent taskInstance={instance} />
```

### 2. ✅ 定位邏輯 → ManualTooltip/CustomTooltip
```tsx
// Before: Repeated positioning calculations
const tooltipStyle = useMemo(() => {
  const rect = triggerRef.current.getBoundingClientRect();
  return {
    left: `${rect.left + ...}px`,
    top: `${rect.top + ...}px`,
    // ...
  };
}, [triggerRef]);

// After: Built into CustomTooltip
<CustomTooltip config={{ placement: "top" }}>
```

### 3. ✅ Hover 狀態管理 → CustomTooltip
```tsx
// Before: Manual state + timeout management
const [isOpen, setIsOpen] = useState(false);
const timeoutRef = useRef();
const handleMouseEnter = () => { /* ... */ };
const handleMouseLeave = () => { /* ... */ };

// After: Built into CustomTooltip
<CustomTooltip delayMs={500}>
```

### 4. ✅ 配置預設 → manualTooltipConfig.ts
```tsx
// Before: Repeated config in every file
{
  placement: "top",
  offset: 8,
  showArrow: true,
  zIndex: 1500
}

// After: Import preset
import { GRID_MANUAL_TOOLTIP_CONFIG } from "...";
```

### 5. ✅ Ref 管理 → CustomTooltip (自動)
```tsx
// Before: Manual ref creation and passing
const triggerRef = useRef(null);
<div ref={triggerRef} />
<Tooltip triggerRef={triggerRef} />

// After: Automatic
<CustomTooltip>
  <div />  {/* ref automatically attached */}
</CustomTooltip>
```

---

## 🚀 實施計畫

### ✅ 已完成
1. ✅ 添加 CustomTooltip.tsx (整合 hover + 定位)
2. ✅ 添加 GridTaskInstanceTooltip.tsx (Grid 專用包裝)
3. ✅ 添加 TaskRecentRunsTooltip.tsx (Bar chart 專用包裝)
4. ✅ 更新完整文檔 (README, ARCHITECTURE, REFACTORING_GUIDE)
5. ✅ 遷移 Grid、TaskRecentRuns、Calendar 到新架構
6. ✅ 移除所有 legacy 組件 (ManualTooltip, *Manual wrappers)
7. ✅ 清理 index.ts，只保留新架構組件

### 🎯 當前架構
- **零冗餘**: 沒有 legacy code，只保留 CustomTooltip 架構
- **統一 API**: 所有 tooltip 使用一致的模式
- **高性能**: 針對密集布局優化
- **易維護**: 清晰的分層和職責劃分

### 💡 新代碼指南
1. 使用專用包裝器 (GridTaskInstanceTooltip, TaskRecentRunsTooltip)
2. 若無專用包裝器，直接使用 CustomTooltip
3. 重複模式超過 3 處，創建新的專用包裝器
4. 保持內容組件純粹 (無定位邏輯)

---

## 📈 預期效益

| 指標 | 改善 |
|------|------|
| 代碼行數 | -50% ~ -70% |
| 導入數量 | -66% (3個 → 1個) |
| 樣板代碼 | -80% |
| 維護性 | ⭐⭐⭐⭐⭐ |
| 學習曲線 | 更簡單 |
| 性能 | 相同或更好 |
| 類型安全 | 完全 |

---

## 🎓 總結

### HoverTooltip 還需要嗎？
**答案: 完全不需要** ✅

- CustomTooltip 整合了所有功能
- 更簡潔、更直觀
- 零冗餘，已移除所有 legacy code

### 最佳實踐架構
```
應用層: 使用專用包裝組件
   ↓
包裝層: 預配置的組合
   ↓
基礎層: CustomTooltip (整合 hover + 定位)
   ↓
內容層: 純格式化組件
```

### 完成進度
1. ✅ CustomTooltip 實現完成
2. ✅ 創建專用包裝組件 (GridTaskInstanceTooltip, TaskRecentRunsTooltip)
3. ✅ 更新 README 展示新架構
4. ✅ 已遷移 Grid、TaskRecentRuns、Calendar 到新架構
5. ✅ 更新所有文檔 (README, ARCHITECTURE, REFACTORING_GUIDE)
