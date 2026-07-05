# Component Library

## Overview

This document defines the standard UI components for LifeOS Enterprise. Each component entry specifies its purpose, variants, states, and usage guidelines. Implementation must match these specifications.

---

## Buttons

### Primary Button
- **Usage:** The main call-to-action on any view. One per page section.
- **Background:** `color-primary`; **Text:** `color-text-inverse`
- **Hover:** `color-primary-hover`
- **Variants:** `default`, `sm`, `lg`, `icon-only`
- **States:** default, hover, active, disabled, loading (spinner replaces label)

### Secondary Button
- **Usage:** Supporting actions alongside a primary
- **Background:** `color-surface`; **Border:** `color-border-strong`; **Text:** `color-text-primary`

### Destructive Button
- **Usage:** Irreversible actions (delete, revoke)
- **Background:** `color-danger`; **Text:** `color-text-inverse`
- **Confirmation:** Destructive actions require a confirmation dialog before execution

### Ghost Button
- **Usage:** Low-emphasis actions, toolbar items
- **Background:** transparent on default; `color-surface-subtle` on hover

---

## Form Elements

### Text Input
- **Height:** 36px (sm), 40px (default), 44px (lg)
- **Border:** 1px `color-border`; **Focus:** 2px ring `color-primary`
- **Error state:** Border `color-danger`; error message below input in `color-danger`, `font-size-sm`
- **Disabled state:** Background `color-surface-subtle`; cursor `not-allowed`

### Textarea
- Same as Text Input; min-height 80px; auto-resize up to max-height 320px

### Select / Dropdown
- Matches Text Input dimensions
- Chevron icon on right
- Options list uses `elevation-2` shadow
- Supports: searchable options, grouped options, multi-select

### Checkbox
- 16px × 16px
- Checked: filled `color-primary`; check icon `color-text-inverse`
- Indeterminate state supported for parent selection

### Toggle (Switch)
- **On:** `color-primary` track; **Off:** `color-border-strong` track
- 20px height; 36px width; 16px thumb

---

## Data Display

### Card
- Background: `color-surface-raised`
- Shadow: `shadow-sm` by default; `shadow-md` on hover for interactive cards
- Padding: `space-4`
- Border radius: `radius-lg`

### Badge
- **Variants:** neutral, success, warning, danger, info, agent
- Uses semantic muted background + semantic text color
- Border radius: `radius-full`
- Font: `font-size-xs`, `font-weight-medium`

### Status Indicator
Task/project status colors:

| Status | Color Token |
|--------|------------|
| Open / Active | `color-info` |
| In Progress | `color-primary` |
| On Hold | `color-warning` |
| Complete | `color-success` |
| Cancelled | `color-text-muted` |
| Overdue | `color-danger` |
| No Next Action | `color-warning` |

### Priority Indicator
| Priority | Color |
|----------|-------|
| Urgent | `color-danger` |
| High | `color-warning` |
| Medium | `color-info` |
| Low | `color-text-muted` |

---

## Navigation

### Sidebar
- Width: 240px (expanded), 64px (collapsed icon mode)
- Background: `color-surface-subtle`
- Active item: `color-primary-muted` background; `color-primary` text and icon
- Business unit switcher at top

### Command Palette
- Triggered by `Cmd/Ctrl + K`
- Full-width search input at top
- Grouped results: recent, projects, tasks, contacts, commands
- Z-index: `z-command`
- Close on: `Escape`, click outside, result selected

---

## Feedback Components

### Toast / Notification
- Position: top-right (desktop), top-center (mobile)
- Auto-dismiss: 5 seconds (info/success), 0 (error — manual dismiss)
- Max 3 stacked toasts; oldest dismissed first when exceeded
- Z-index: `z-toast`

### Empty State
- Icon (48px) + heading + supporting text + optional CTA
- Centered in available space
- Never show an empty table — always show an empty state component

### Loading Skeleton
- Matches shape of content being loaded
- Animated shimmer effect
- Never show a spinner for content that loads in < 200ms (use optimistic rendering instead)

### Confirmation Dialog
- Triggered by destructive actions
- Title, body text explaining consequence, cancel button, confirm button (destructive variant)
- Cannot be closed by pressing Escape on irreversible actions

---

## Agent-Specific Components

### Agent Suggestion Banner
- Used when an agent has a recommendation surfaced in context
- Background: `color-agent-muted`; left border: `color-agent`
- Contains: agent name, suggestion text, Accept / Dismiss actions
- Accept queues the action for execution (with approval gate if configured)

### Agent Action Log Entry
- Timestamp, agent name, action type, summary
- Expandable to show full input/output
- "Undo" button if action is reversible and within 30-minute window

---

## Accessibility Requirements

- All interactive elements are keyboard navigable
- All icons have `aria-label` or are accompanied by visible text
- Color is never the only means of conveying information (always paired with icon or text)
- Focus ring is always visible (never suppressed)
- Minimum contrast ratio: 4.5:1 for body text; 3:1 for large text (WCAG AA)
- All form inputs have associated labels
- Error messages are announced via `aria-live`
