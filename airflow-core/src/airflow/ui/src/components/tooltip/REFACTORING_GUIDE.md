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

### 階段 2: 內容分離（當前主分支）
```tsx
// ✅ Extracted content component
<TaskInstanceTooltip taskInstance={instance}>
  <Badge />
</TaskInstanceTooltip>

// ✅ Reusable positioning logic
<ManualTooltip config={CONFIG} triggerRef={ref}>
  <TaskInstanceTooltipContent taskInstance={instance} />
</ManualTooltip>
```

**改進:**
- ✅ 內容邏輯可重用
- ✅ 定位邏輯標準化
- ⚠️ 但仍需要 HoverTooltip 包裝

---

### 階段 3: 完全集成（建議架構）
```tsx
// ✨ ManualTooltipV2 - All-in-one solution
<ManualTooltipV2
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<TaskInstanceTooltipContent taskInstance={instance} />}
>
  <Badge />
</ManualTooltipV2>

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

// CalendarTooltip.tsx - using ManualTooltipV2
export const CalendarTooltip = ({ cellData, viewMode, children }) =>
  cellData ? (
    <ManualTooltipV2
      delayMs={500}
      config={{ ...CALENDAR_MANUAL_TOOLTIP_CONFIG, containerStyle: { minWidth: "200px" } }}
      content={<CalendarTooltipContent cellData={cellData} viewMode={viewMode} />}
    >
      {children}
    </ManualTooltipV2>
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

### 2. ✅ 定位邏輯 → ManualTooltip/ManualTooltipV2
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

// After: Built into ManualTooltipV2
<ManualTooltipV2 config={{ placement: "top" }}>
```

### 3. ✅ Hover 狀態管理 → ManualTooltipV2
```tsx
// Before: Manual state + timeout management
const [isOpen, setIsOpen] = useState(false);
const timeoutRef = useRef();
const handleMouseEnter = () => { /* ... */ };
const handleMouseLeave = () => { /* ... */ };

// After: Built into ManualTooltipV2
<ManualTooltipV2 delayMs={500}>
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

### 5. ✅ Ref 管理 → ManualTooltipV2 (自動)
```tsx
// Before: Manual ref creation and passing
const triggerRef = useRef(null);
<div ref={triggerRef} />
<Tooltip triggerRef={triggerRef} />

// After: Automatic
<ManualTooltipV2>
  <div />  {/* ref automatically attached */}
</ManualTooltipV2>
```

---

## 🚀 實施計畫

### 立即可做 (不破壞現有代碼)
1. ✅ 添加 ManualTooltipV2.tsx
2. ✅ 添加 GridTaskInstanceTooltip.tsx
3. ✅ 添加 TaskRecentRunsTooltip.tsx
4. ⏳ 更新文檔說明新舊兩種方式

### 漸進式遷移 (可選)
1. 新功能使用 ManualTooltipV2
2. 修改現有代碼時順便升級
3. 保留舊代碼向後兼容

### 未來清理 (當所有代碼遷移後)
1. 標記 HoverTooltip 為 @deprecated
2. 移除舊的 ManualTooltip (keep V2)
3. 統一所有 tooltip 為新架構

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
**答案: 不需要了** ✅

- ManualTooltipV2 整合了所有功能
- 更簡潔、更直觀
- 向後兼容(保留 HoverTooltip 供舊代碼使用)

### 最佳實踐架構
```
應用層: 使用專用包裝組件
   ↓
包裝層: 預配置的組合
   ↓
基礎層: ManualTooltipV2 (整合 hover + 定位)
   ↓
內容層: 純格式化組件
```

### 下一步
1. 審查 ManualTooltipV2 實現
2. 創建剩餘的專用包裝組件
3. 更新 README 展示兩種方式
4. 逐步遷移現有代碼
