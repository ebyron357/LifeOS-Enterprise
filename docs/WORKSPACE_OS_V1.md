# LifeOS Workspace OS V1

## Purpose

Workspace OS V1 turns the LifeOS executive dashboard into an interactive, desktop-class Command Center while preserving:

- GitHub as source of truth
- Obsidian Markdown as the canonical data model
- the existing vault portal and Interactive Operations safety model

This sprint fully implements the **Command Center** workspace and a reusable Workspace OS shell. Other workspaces are prepared in navigation only.

## Architecture

```text
Vault data (server)
  → app/dashboard/page.tsx
  → DashboardLayout + PortalSidebar
  → CommandCenterWorkspace
       ├─ WorkspaceProvider (layout persistence)
       ├─ WorkspaceShell (nav, palette, reset, shortcuts)
       └─ WorkspaceGrid (react-grid-layout)
            └─ WorkspaceWidget chrome around existing modules
```

Layout preferences are browser-local only. Canonical vault Markdown is never modified for UI layout state.

## Dependencies and licenses

| Package | Version | License | Role |
|---------|---------|---------|------|
| `react-grid-layout` | 2.2.3 | MIT | Drag/resize grid (React 19 compatible) |
| `cmdk` | 1.1.1 | MIT | Command palette |
| `motion` | 12.42.2 | MIT | Smooth panel transitions |

Evaluated and deferred for V1:

- Golden Layout / FlexLayout — heavier docking systems; not required for Command Center grid V1

No third-party application was imported wholesale.

## Widget model

Command Center widgets:

1. Mission status
2. Cognitive support
3. Project command board (includes Interactive Operations + change-plan persistence)
4. Decision queue
5. Morning brief
6. Personal growth
7. GitHub health
8. Revenue radar
9. Prayer
10. AI workforce

Each widget supports:

- drag (handle control; not drag-only)
- resize (desktop/tablet grid)
- focus / clear focus
- minimize / restore
- open details where applicable
- status pill (`active`, `loading`, `success`, `warning`, `error`, `idle`)

Unavailable integrations remain clearly labeled by existing widgets (for example revenue fallback).

## Layout persistence model

Storage key: `lifeos-workspace-os-v1-layout`

Persists:

- breakpoint layouts (`lg`, `md`, `sm`, `xs`)
- minimized / hidden widget chrome
- focused widget id
- reduced-motion preference
- last selected workspace id (`lifeos-workspace-os-v1-last-workspace`)

Invalid JSON, wrong version, or malformed layouts fall back to the default layout.

**Restore default layout** is always visible in the Command Center toolbar and available from the command palette.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ K` | Open/close command palette |
| `Esc` | Close palette / capture dialog |
| `Q` (when not typing in a field) | Open Quick Capture |

Palette commands include open workspace targets, reset layout, focus next widget, toggle reduced motion, and open Quick Capture.

## Accessibility behavior

- Skip link and main landmark retained
- Visible focus indicators on shell/widget controls
- ARIA labels on widgets, toolbars, and live status region
- Keyboard alternatives for rearrange (reset, focus next, minimize/restore buttons)
- Drag handle is a labeled button; rearrangement is not drag-only
- Touch-friendly 40–44px controls
- Reduced motion via toolbar toggle, `prefers-reduced-motion`, and `data-lifeos-reduced-motion`
- At ≤900px width, widgets stack (no drag/resize requirement) to prevent overflow

## Workspaces

| Workspace | Route | V1 status |
|-----------|-------|-----------|
| Command Center | `/dashboard` | Fully implemented |
| Projects | `/projects` | Existing portal surface |
| AI Workforce | `/agents` | Existing portal surface |
| Knowledge Vault | `/resources` | Existing portal surface |
| Automation Hub | `/workspace/automation` | Prepared placeholder |
| Developer Center | `/workspace/developer` | Prepared placeholder |
| Analytics | `/workspace/analytics` | Prepared placeholder |

## Test evidence

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Coverage added for:

- default layout rendering
- invalid stored-layout fallback
- layout persistence / reduced motion
- reset layout via command palette
- minimize / restore
- focus next widget
- mobile stacked layout mode
- existing dashboard registry + command board safety tests remain green

## Known limitations

- Only Command Center is a full Workspace OS surface in V1
- Layout persistence is browser-local (not synced to Obsidian/Git)
- Drag/resize disabled in stacked mobile mode by design
- Dataview/Bases still not executed server-side
- Quick Capture remains browser-local
- Direct vault writes remain blocked except through the existing authenticated change-plan route

## Rollback instructions

1. Leave the feature branch unmerged, or
2. Revert the merge commit on `main`, or
3. Redeploy the previous Vercel production deployment

Production remains unchanged until the PR is explicitly merged.
