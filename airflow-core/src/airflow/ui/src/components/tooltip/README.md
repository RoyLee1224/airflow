# Tooltip Components

This directory contains reusable tooltip components and configurations for the Airflow UI.

## Overview

We provide two tooltip approaches:

1. **Chakra UI Tooltips** - Automatic positioning with accessibility features
2. **Manual Tooltips** - Custom positioning for better performance in dense layouts

## Components

### 1. ManualTooltip (Recommended for Dense Layouts)

A high-performance tooltip with manual positioning, ideal for grids and calendars.

**Basic Usage:**

```tsx
import { HoverTooltip } from "src/components/HoverTooltip";
import { ManualTooltip, GRID_MANUAL_TOOLTIP_CONFIG } from "src/components/tooltip";

<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef) => (
    <ManualTooltip config={GRID_MANUAL_TOOLTIP_CONFIG} triggerRef={triggerRef}>
      <div>Your tooltip content here</div>
    </ManualTooltip>
  )}
>
  <button>Hover me</button>
</HoverTooltip>
```

**Custom Configuration:**

```tsx
import { ManualTooltip } from "src/components/tooltip";

const customConfig = {
  placement: "bottom",
  offset: 12,
  showArrow: true,
  zIndex: 2000,
  containerStyle: { maxWidth: "300px" },
};

<ManualTooltip config={customConfig} triggerRef={triggerRef}>
  <div>Content</div>
</ManualTooltip>
```

### 2. TaskInstanceTooltip (Chakra-based)

For standard task instance tooltips with automatic positioning.

```tsx
import TaskInstanceTooltip from "src/components/TaskInstanceTooltip";
import { GRID_TOOLTIP_CONFIG } from "src/components/tooltip";

<TaskInstanceTooltip
  {...GRID_TOOLTIP_CONFIG}
  taskInstance={instance}
  showTaskId
  showRunId={false}
>
  <Badge>Task</Badge>
</TaskInstanceTooltip>
```

### 3. GridTaskInstanceTooltipManual

Pre-configured manual tooltip for grid task instances.

```tsx
import { HoverTooltip } from "src/components/HoverTooltip";
import { GridTaskInstanceTooltipManual } from "src/components/tooltip";

<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef) => (
    <GridTaskInstanceTooltipManual
      instance={taskInstance}
      triggerRef={triggerRef}
      showTaskId
      showRunId={false}
    />
  )}
>
  <Badge>Task</Badge>
</HoverTooltip>
```

## Configurations

### Chakra Tooltip Configs

- `TOOLTIP_DEFAULTS` - Base configuration (300ms delay)
- `GRID_TOOLTIP_CONFIG` - Optimized for dense grids (500ms delay, immediate close)

### Manual Tooltip Configs

- `MANUAL_TOOLTIP_DEFAULTS` - Base manual config (top placement, 8px offset)
- `GRID_MANUAL_TOOLTIP_CONFIG` - Grid-optimized (top placement)
- `CALENDAR_MANUAL_TOOLTIP_CONFIG` - Calendar-optimized (bottom placement)

## Placement Options

Supported placements:
- `"top"` - Centered above
- `"top-start"` - Above, aligned to left
- `"top-end"` - Above, aligned to right
- `"bottom"` - Centered below
- `"bottom-start"` - Below, aligned to left
- `"bottom-end"` - Below, aligned to right
- `"left"` - To the left, vertically centered
- `"right"` - To the right, vertically centered

## When to Use What

| Scenario | Recommended Approach | Config |
|----------|---------------------|--------|
| Dense Grid (14px cells) | ManualTooltip | GRID_MANUAL_TOOLTIP_CONFIG |
| Calendar Cells | ManualTooltip | CALENDAR_MANUAL_TOOLTIP_CONFIG |
| Bar Charts (small bars) | TaskInstanceTooltip | GRID_TOOLTIP_CONFIG |
| Large Cards/Nodes | TaskInstanceTooltip | TOOLTIP_DEFAULTS |
| Custom Content | ManualTooltip | Custom config |

## Performance Considerations

**Use ManualTooltip when:**
- ✅ Elements are very small (<20px)
- ✅ Elements are densely packed
- ✅ User may quickly move mouse across many elements
- ✅ You need exact positioning control

**Use TaskInstanceTooltip when:**
- ✅ Elements are larger (>50px)
- ✅ Elements have good spacing
- ✅ You need accessibility features out of box
- ✅ Automatic boundary detection is desired

## Creating Custom Tooltips

```tsx
import { ManualTooltip } from "src/components/tooltip";
import type { ManualTooltipConfig } from "src/components/tooltip";

const MyCustomTooltip = ({ data, triggerRef }) => {
  const config: ManualTooltipConfig = {
    placement: "right",
    offset: 10,
    showArrow: false,
    containerStyle: {
      maxWidth: "400px",
      whiteSpace: "normal",
    },
  };

  return (
    <ManualTooltip config={config} triggerRef={triggerRef}>
      <div>
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
    </ManualTooltip>
  );
};
```

## Migration Guide

### From CalendarTooltip to ManualTooltip

**Before:**
```tsx
// Custom positioning logic in CalendarTooltip
<CalendarTooltip cellData={data} triggerRef={ref} />
```

**After:**
```tsx
<ManualTooltip config={CALENDAR_MANUAL_TOOLTIP_CONFIG} triggerRef={ref}>
  <CalendarTooltipContent cellData={data} />
</ManualTooltip>
```

### From Inline Tooltip to TaskInstanceTooltip

**Before:**
```tsx
<Tooltip content={<>Task: {id}<br/>State: {state}</>}>
  <Badge>Task</Badge>
</Tooltip>
```

**After:**
```tsx
<TaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</TaskInstanceTooltip>
```
