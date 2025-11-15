# Tooltip Architecture Design

## 🎯 Design Goals

1. **Simplicity** - Minimal boilerplate code
2. **Reusability** - Shared components across different views
3. **Performance** - Optimized for dense layouts (grids, calendars)
4. **Consistency** - Unified API and behavior
5. **Type Safety** - Full TypeScript support

---

## 📐 Architecture Overview

### Layer 1: Base Components (Choose One)

#### Option A: ManualTooltipV2 (Recommended for New Code)
```tsx
<ManualTooltipV2
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<YourContent />}
>
  <TriggerElement />
</ManualTooltipV2>
```

**Advantages:**
- ✅ Single component - no wrappers needed
- ✅ Integrated hover state management
- ✅ No manual ref passing
- ✅ Clean, intuitive API

**Use when:**
- Creating new tooltip implementations
- Want the simplest possible code
- Need manual positioning for performance

#### Option B: HoverTooltip + ManualTooltip (Legacy)
```tsx
<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef) => (
    <ManualTooltip config={...} triggerRef={triggerRef}>
      <Content />
    </ManualTooltip>
  )}
>
  <TriggerElement />
</HoverTooltip>
```

**Status:** Legacy pattern, kept for backward compatibility

**Use when:**
- Maintaining existing code
- Need custom tooltip rendering logic

### Layer 2: Content Components (Shared)

These components are **pure** - they only handle data formatting, no positioning logic.

```tsx
// Task Instance Content
<TaskInstanceTooltipContent
  taskInstance={instance}
  showTaskId
  showRunId={false}
/>

// Calendar Content
<CalendarTooltipContent
  cellData={data}
  viewMode="total"
/>

// Custom Field
<TooltipField label="Duration" value="10s" />
```

**Advantages:**
- ✅ Reusable across different tooltip types
- ✅ Testable in isolation
- ✅ Single source of truth for formatting

### Layer 3: Specialized Wrappers (Optional)

Pre-configured tooltips for specific use cases:

```tsx
// Grid Task Instance - just pass taskInstance
<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>

// Task Recent Runs - just pass taskInstance
<TaskRecentRunsTooltip taskInstance={instance}>
  <Box width="4px" />
</TaskRecentRunsTooltip>
```

**Advantages:**
- ✅ Even simpler - pre-configured with right settings
- ✅ Consistent across the app
- ✅ Easy to update globally

---

## 🔄 Migration Path

### Step 1: Identify Pattern

**Pattern A - HoverTooltip + ManualTooltip (Current)**
```tsx
<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef) => (
    <SomeManualTooltip triggerRef={triggerRef} data={data} />
  )}
>
  <Trigger />
</HoverTooltip>
```

**Pattern B - TaskInstanceTooltip (Chakra)**
```tsx
<TaskInstanceTooltip {...GRID_TOOLTIP_CONFIG} taskInstance={instance}>
  <Trigger />
</TaskInstanceTooltip>
```

### Step 2: Choose Replacement

#### For Pattern A → ManualTooltipV2
```tsx
// Before
<HoverTooltip delayMs={500} tooltip={(ref) => <Manual triggerRef={ref} />}>
  <Trigger />
</HoverTooltip>

// After
<ManualTooltipV2 delayMs={500} config={CONFIG} content={<Content />}>
  <Trigger />
</ManualTooltipV2>
```

#### For Pattern B → Specialized Wrapper
```tsx
// Before
<TaskInstanceTooltip {...GRID_TOOLTIP_CONFIG} taskInstance={instance}>
  <Trigger />
</TaskInstanceTooltip>

// After
<GridTaskInstanceTooltip taskInstance={instance}>
  <Trigger />
</GridTaskInstanceTooltip>
```

### Step 3: Update Imports

```tsx
// Remove
import { HoverTooltip } from "src/components/HoverTooltip";
import { SomeManualTooltip } from "...";

// Add
import { GridTaskInstanceTooltip } from "src/components/tooltip";
```

---

## 🏗️ Component Structure

```
tooltip/
├── Core Components
│   ├── ManualTooltip.tsx          # Legacy: requires HoverTooltip wrapper
│   ├── ManualTooltipV2.tsx        # New: integrated hover management
│   └── manualTooltipConfig.ts     # Shared configs & types
│
├── Content Components (Pure)
│   ├── TaskInstanceTooltipContent.tsx
│   ├── TooltipField.tsx
│   └── [Other content components]
│
├── Specialized Wrappers
│   ├── GridTaskInstanceTooltip.tsx         # Grid view (14px cells)
│   ├── TaskRecentRunsTooltip.tsx          # Bar chart (4px bars)
│   └── [Other specialized tooltips]
│
└── Documentation
    ├── README.md           # User guide
    └── ARCHITECTURE.md     # This file
```

---

## 🎨 Design Patterns

### Pattern 1: Direct Usage (Simplest)
```tsx
<ManualTooltipV2
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<div>Simple tooltip</div>}
>
  <button>Hover me</button>
</ManualTooltipV2>
```

**When to use:** Simple, one-off tooltips

### Pattern 2: With Content Component (Reusable)
```tsx
<ManualTooltipV2
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={
    <TaskInstanceTooltipContent
      taskInstance={instance}
      showTaskId
    />
  }
>
  <Badge>Task</Badge>
</ManualTooltipV2>
```

**When to use:** Consistent formatting across multiple locations

### Pattern 3: Specialized Wrapper (Best Practice)
```tsx
<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>
```

**When to use:** Same tooltip used in multiple places

---

## 📊 Comparison

| Aspect | HoverTooltip + ManualTooltip | ManualTooltipV2 | Specialized Wrapper |
|--------|------------------------------|-----------------|---------------------|
| Lines of code | 7-10 | 3-5 | 1-3 |
| Ref management | Manual | Automatic | Automatic |
| Type safety | Partial | Full | Full |
| Reusability | Medium | High | Highest |
| Boilerplate | High | Low | Minimal |
| Flexibility | High | High | Medium |

---

## 🚀 Recommendations

### For New Code
1. **Simple tooltips** → Use `ManualTooltipV2` directly
2. **Task instances** → Use `GridTaskInstanceTooltip` / `TaskRecentRunsTooltip`
3. **Custom content** → Create content component + use `ManualTooltipV2`

### For Existing Code
1. **Low priority** → Keep as is (works fine)
2. **Medium priority** → Replace HoverTooltip pattern with ManualTooltipV2
3. **High priority** → Create specialized wrapper if used in 3+ places

### For Large Elements (>50px)
- Continue using Chakra `TaskInstanceTooltip`
- Automatic positioning is fine for large elements
- Better accessibility out of box

---

## 🔮 Future Considerations

### Phase 1: Gradual Migration (Current)
- ✅ ManualTooltipV2 created
- ✅ Specialized wrappers created
- ⏳ Migrate high-traffic areas
- ⏳ Update documentation

### Phase 2: Deprecation (Future)
- Mark `HoverTooltip` as deprecated
- Add console warnings for old pattern
- Provide codemod for automatic migration

### Phase 3: Cleanup (Future)
- Remove `HoverTooltip` component
- Remove legacy `ManualTooltip` (keep V2)
- Consolidate all manual tooltips

---

## 💡 Best Practices

1. **Separation of Concerns**
   - Content components: Pure formatting logic
   - Positioning components: Layout and timing
   - Wrapper components: Pre-configured combinations

2. **Configuration Over Code**
   - Use preset configs when possible
   - Override only what you need
   - Keep custom configs in `manualTooltipConfig.ts`

3. **Type Safety**
   - Always specify types for tooltip content
   - Use `ManualTooltipConfig` type
   - Leverage TypeScript's inference

4. **Performance**
   - Use manual positioning for elements <20px
   - Set appropriate delays (500ms for dense layouts)
   - Memoize content when possible

5. **Consistency**
   - Use specialized wrappers for common patterns
   - Follow naming conventions
   - Document custom implementations
