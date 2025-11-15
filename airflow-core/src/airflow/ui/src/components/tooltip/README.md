# Tooltip Components

This directory contains reusable tooltip components and configurations for the Airflow UI.

## Overview

We provide a clean, layered tooltip architecture:

1. **Base Component** - `CustomTooltip` - Integrated hover + positioning
2. **Content Components** - Pure data formatting (reusable across tooltips)
3. **Specialized Wrappers** - Pre-configured for specific use cases

## Quick Start

### Recommended: Use Specialized Wrappers

For common use cases, use pre-configured wrappers:

```tsx
import { GridTaskInstanceTooltip } from "src/components/tooltip";

<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>
```

**Available Wrappers:**
- `GridTaskInstanceTooltip` - For grid view task instances (14px cells)
- `TaskRecentRunsTooltip` - For bar chart tooltips (4px bars)

### Advanced: Use CustomTooltip Directly

For custom tooltips, use `CustomTooltip`:

```tsx
import { CustomTooltip, GRID_MANUAL_TOOLTIP_CONFIG } from "src/components/tooltip";

<CustomTooltip
  delayMs={500}
  config={GRID_MANUAL_TOOLTIP_CONFIG}
  content={<div>Your tooltip content</div>}
>
  <button>Hover me</button>
</CustomTooltip>
```

## Components

### 1. CustomTooltip (Base Component)

All-in-one tooltip with integrated hover management and manual positioning.

**Features:**
- ✅ No wrapper components needed
- ✅ Automatic ref management
- ✅ Configurable delay and positioning
- ✅ High performance for dense layouts

**Props:**
```tsx
type Props = {
  children: ReactElement;           // Trigger element
  content: ReactNode;                // Tooltip content
  config?: ManualTooltipConfig;      // Positioning & styling
  delayMs?: number;                  // Hover delay (default: 500ms)
};
```

**Example:**
```tsx
<CustomTooltip
  delayMs={500}
  config={{
    placement: "top",
    offset: 8,
    showArrow: true,
    containerStyle: { minWidth: "200px" },
  }}
  content={<TaskInstanceTooltipContent taskInstance={instance} />}
>
  <Badge>Task</Badge>
</CustomTooltip>
```

### 2. Specialized Wrappers

Pre-configured tooltips for common patterns.

#### GridTaskInstanceTooltip

For grid view task instances (14px cells).

```tsx
import { GridTaskInstanceTooltip } from "src/components/tooltip";

<GridTaskInstanceTooltip
  taskInstance={instance}
  showTaskId              // Show task ID in tooltip
  showRunId={false}       // Hide run ID
  customFields={<div>Custom content</div>}  // Optional extra fields
>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>
```

#### TaskRecentRunsTooltip

For bar chart tooltips (4px bars).

```tsx
import { TaskRecentRunsTooltip } from "src/components/tooltip";

<TaskRecentRunsTooltip taskInstance={instance}>
  <Box width="4px" height="14px" />
</TaskRecentRunsTooltip>
```

### 3. Content Components

Pure components for formatting tooltip content (no positioning logic).

#### TaskInstanceTooltipContent

```tsx
import { TaskInstanceTooltipContent } from "src/components/tooltip";

<TaskInstanceTooltipContent
  taskInstance={instance}
  showTaskId
  showRunId={false}
  customFields={<TooltipField label="Duration" value="10s" />}
/>
```

#### TooltipField

Simple label-value field for tooltips.

```tsx
import { TooltipField } from "src/components/tooltip";

<TooltipField label="State" value="success" />
```

## Configurations

### Pre-configured Settings

- `MANUAL_TOOLTIP_DEFAULTS` - Base defaults (top, 8px offset, arrow)
- `GRID_MANUAL_TOOLTIP_CONFIG` - Grid-optimized (top placement)
- `CALENDAR_MANUAL_TOOLTIP_CONFIG` - Calendar-optimized (bottom placement)

### Custom Configuration

```tsx
import type { ManualTooltipConfig } from "src/components/tooltip";

const customConfig: ManualTooltipConfig = {
  placement: "bottom-start",
  offset: 12,
  showArrow: false,
  zIndex: 2000,
  containerStyle: {
    maxWidth: "400px",
    whiteSpace: "normal",
    backgroundColor: "blue.500",
  },
  arrowStyle: {
    borderTopColor: "blue.500",
  },
};
```

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

| Scenario | Recommended Component | Why |
|----------|----------------------|-----|
| Grid task instances | `GridTaskInstanceTooltip` | Pre-configured, simplest API |
| Bar charts | `TaskRecentRunsTooltip` | Optimized for 4px bars |
| Calendar cells | `CalendarTooltip` | Custom calendar content |
| Custom content | `CustomTooltip` | Full control with minimal code |
| One-off tooltip | `CustomTooltip` | Just pass content directly |

## Performance Considerations

**CustomTooltip is ideal when:**
- ✅ Elements are very small (<20px)
- ✅ Elements are densely packed
- ✅ User may quickly move mouse across many elements
- ✅ You need exact positioning control
- ✅ Performance is critical

**Benefits over Chakra tooltips:**
- Manual positioning prevents layout recalculation
- Optimized for rapid hover events
- Configurable delays prevent tooltip stacking
- Portal rendering keeps DOM clean

## Migration Guide

### From HoverTooltip + Manual Pattern

**Before:**
```tsx
import { HoverTooltip } from "src/components/HoverTooltip";
import { GridTaskInstanceTooltipManual } from "src/components/tooltip";

<HoverTooltip
  delayMs={500}
  tooltip={(triggerRef) => (
    <GridTaskInstanceTooltipManual
      instance={instance}
      triggerRef={triggerRef}
      showTaskId
    />
  )}
>
  <Badge>Task</Badge>
</HoverTooltip>
```

**After:**
```tsx
import { GridTaskInstanceTooltip } from "src/components/tooltip";

<GridTaskInstanceTooltip taskInstance={instance} showTaskId>
  <Badge>Task</Badge>
</GridTaskInstanceTooltip>
```

**Result:** 70% less code, no wrapper, no ref passing

### Creating New Specialized Wrappers

Pattern to follow:

```tsx
import type { ReactElement } from "react";
import { CustomTooltip } from "./CustomTooltip";
import { GRID_MANUAL_TOOLTIP_CONFIG } from "./manualTooltipConfig";
import { YourContent } from "./YourContent";

type Props = {
  readonly children: ReactElement;
  readonly data: YourDataType;
  readonly delayMs?: number;
};

export const YourTooltip = ({
  children,
  data,
  delayMs = 500,
}: Props): ReactElement => (
  <CustomTooltip
    config={GRID_MANUAL_TOOLTIP_CONFIG}
    content={<YourContent data={data} />}
    delayMs={delayMs}
  >
    {children}
  </CustomTooltip>
);
```

## Architecture

```
Application Code
       ↓
Specialized Wrappers (GridTaskInstanceTooltip, etc.)
       ↓
CustomTooltip (hover + positioning)
       ↓
Content Components (pure formatting)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design documentation.

## Best Practices

**For all tooltip implementations:**
- ✅ Use `CustomTooltip` as the base component
- ✅ Use specialized wrappers (GridTaskInstanceTooltip, TaskRecentRunsTooltip) when available
- ✅ Create new specialized wrappers for repeated patterns
- ✅ Keep content components pure (no positioning logic)
