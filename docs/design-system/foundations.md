# Design System: Foundations

## Purpose

This document defines the visual and interaction foundations of LifeOS Enterprise. All UI implementation must reference these foundations for consistency across web, mobile, and any other visual surface.

---

## Design Principles

1. **Clarity over density** — every element on screen earns its place
2. **Progressive disclosure** — show what matters now; reveal detail on demand
3. **Speed is a feature** — interactions feel instant; loading states are never jarring
4. **Operator trust** — the interface projects reliability and control, not novelty
5. **AI is ambient** — AI assistance is seamlessly woven in, not a separate mode

---

## Color System

See [tokens.md](tokens.md) for exact values.

### Semantic Color Roles

| Role | Usage |
|------|-------|
| `color-primary` | Primary actions, key navigation highlights |
| `color-secondary` | Secondary actions, supporting UI elements |
| `color-surface` | Page backgrounds, card backgrounds |
| `color-surface-raised` | Elevated surfaces (cards, modals) |
| `color-border` | Borders, dividers |
| `color-text-primary` | Primary text |
| `color-text-secondary` | Labels, metadata, supporting text |
| `color-text-muted` | Placeholder text, disabled state |
| `color-success` | Positive states, completed items |
| `color-warning` | Attention required (overdue items, missing next actions) |
| `color-danger` | Destructive actions, error states |
| `color-info` | Informational states |
| `color-agent` | AI agent activity, suggestions |

---

## Typography

| Scale | Usage | Specs |
|-------|-------|-------|
| `display-xl` | Page titles | 36px / 700 weight / -0.5px tracking |
| `display-lg` | Section headings | 28px / 600 weight |
| `heading-md` | Card headings, panel titles | 20px / 600 weight |
| `heading-sm` | Sub-section labels | 16px / 600 weight |
| `body-lg` | Primary reading text | 16px / 400 weight / 1.6 line height |
| `body-md` | Default body text | 14px / 400 weight / 1.5 line height |
| `body-sm` | Metadata, labels, captions | 12px / 400 weight |
| `code` | Code blocks, IDs, technical strings | 13px / monospace |

**Font stack:**
- Primary: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
- Code: `JetBrains Mono, Fira Code, Consolas, monospace`

---

## Spacing System

Spacing uses an 8px base unit. All spacing values are multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight grouping, icon padding |
| `space-2` | 8px | Default element padding |
| `space-3` | 12px | Form field internal padding |
| `space-4` | 16px | Component internal padding |
| `space-6` | 24px | Section separation |
| `space-8` | 32px | Large section gaps |
| `space-12` | 48px | Page section breaks |
| `space-16` | 64px | Major layout divisions |

---

## Elevation & Shadow

| Level | Usage | Shadow |
|-------|-------|--------|
| `elevation-0` | Flat, no shadow (default surface) | none |
| `elevation-1` | Subtle card lift | `0 1px 3px rgba(0,0,0,0.08)` |
| `elevation-2` | Dropdown, popover | `0 4px 12px rgba(0,0,0,0.12)` |
| `elevation-3` | Modal, dialog | `0 8px 32px rgba(0,0,0,0.18)` |
| `elevation-4` | Floating action, command palette | `0 16px 48px rgba(0,0,0,0.24)` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, chips, small elements |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Panels, modals |
| `radius-xl` | 20px | Large cards, overlays |
| `radius-full` | 9999px | Pills, avatars |

---

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 100ms | Hover states, micro-interactions |
| `duration-normal` | 200ms | Panel open/close, dropdown |
| `duration-slow` | 350ms | Page transitions, modals |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| `easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful emphasis (sparingly) |

Motion is reduced to near-zero when the OS/browser reports `prefers-reduced-motion: reduce`.

---

## Iconography

- Icon library: Lucide Icons (MIT licensed; consistent with Inter aesthetic)
- Icon sizes: 16px (inline), 20px (default), 24px (prominent)
- Icons are always accompanied by a text label except in well-established toolbars
- Custom icons created to match Lucide style when needed

---

## Grid & Layout

- Base layout: 12-column grid
- Sidebar width: 240px (collapsible to 64px icon mode)
- Content max-width: 1280px
- Gutter: 24px
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

---

## Related Documents

- [Design Tokens](tokens.md)
- [Component Library](components.md)
