# Tooltip Architecture Design

## 🎯 Design Goals

1. **Simplicity** - Minimal boilerplate code
2. **Reusability** - Shared components across different views
3. **Performance** - Optimized for dense layouts (grids, calendars)
4. **Consistency** - Unified API and behavior
5. **Type Safety** - Full TypeScript support

---

## 📐 Architecture Overview

### Layer 1: Base Component

#### CustomTooltip (All-in-One Solution)
```tsx
<CustomTooltip
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<YourContent />}
>
  <TriggerElement />
</CustomTooltip>
```

**Advantages:**
- ✅ Single component - no wrappers needed
- ✅ Integrated hover state management
- ✅ No manual ref passing
- ✅ Clean, intuitive API
- ✅ High performance for dense layouts

**Use for:**
- All new tooltip implementations
- Custom tooltips with specific requirements
- Performance-critical dense layouts (grids, calendars)

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

## 🎯 Usage Patterns

### Pattern 1: Use Specialized Wrappers (Recommended)

For common use cases, use pre-configured wrappers:

```tsx
import { GridTaskInstanceTooltip } from "src/components/tooltip";

<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>
```

### Pattern 2: Use CustomTooltip Directly

For custom tooltips, use the base component:

```tsx
import { CustomTooltip, GRID_MANUAL_TOOLTIP_CONFIG } from "src/components/tooltip";

<CustomTooltip
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<YourContent data={data} />}
>
  <Trigger />
</CustomTooltip>
```

### Pattern 3: Create New Specialized Wrapper

For repeated patterns, create a new wrapper:

```tsx
export const YourTooltip = ({ data, children }) => (
  <CustomTooltip
    config={GRID_MANUAL_TOOLTIP_CONFIG}
    content={<YourContent data={data} />}
    delayMs={500}
  >
    {children}
  </CustomTooltip>
);
```

---

## 🏗️ Component Structure

```
tooltip/
├── Core Component
│   ├── CustomTooltip.tsx          # ✨ Integrated hover + positioning
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
├── Configuration
│   └── config.ts           # Chakra tooltip configs
│
└── Documentation
    ├── README.md           # User guide
    └── ARCHITECTURE.md     # This file
```

---

## 🎨 Design Patterns

### Pattern 1: Direct Usage (Simplest)
```tsx
<CustomTooltip
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<div>Simple tooltip</div>}
>
  <button>Hover me</button>
</CustomTooltip>
```

**When to use:** Simple, one-off tooltips

### Pattern 2: With Content Component (Reusable)
```tsx
<CustomTooltip
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
</CustomTooltip>
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

## 📊 Component Comparison

| Aspect | CustomTooltip | Specialized Wrapper |
|--------|---------------|---------------------|
| Lines of code | 3-5 | 1-3 |
| Ref management | Automatic | Automatic |
| Type safety | Full | Full |
| Reusability | High | Highest |
| Boilerplate | Low | Minimal |
| Flexibility | High | Medium |
| Configuration | Custom | Pre-configured |

---

## 🚀 Recommendations

### For All Code
1. **Common patterns** → Use specialized wrappers (GridTaskInstanceTooltip, TaskRecentRunsTooltip)
2. **Custom tooltips** → Use `CustomTooltip` directly with custom content
3. **Repeated patterns** → Create new specialized wrappers
4. **Dense layouts** → Always use CustomTooltip-based solutions for performance

### For Large Elements (>50px)
- Continue using Chakra `TaskInstanceTooltip`
- Automatic positioning is fine for large elements
- Better accessibility out of box

---

## 🔮 Architecture Status

### ✅ Completed
- CustomTooltip created with integrated hover + positioning
- Specialized wrappers created (GridTaskInstanceTooltip, TaskRecentRunsTooltip)
- Migrated high-traffic areas (Grid, TaskRecentRuns, Calendar)
- Updated documentation
- Removed all legacy components (ManualTooltip, *Manual wrappers)
- Clean, zero-redundancy architecture

### 🎯 Current State
- All tooltips use CustomTooltip as base
- No legacy patterns remaining in codebase
- Consistent API across all tooltip implementations
- Optimized performance for dense layouts

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
