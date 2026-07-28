# Third-party attribution

LifeOS Enterprise includes original application code plus open-source dependencies. Portal architecture was informed by public discussions in [LifeOS-OSS](https://github.com/kcwoodfield/LifeOS-OSS) and [COG Second Brain](https://github.com/huytieu/COG-second-brain). No private or personal content from those repositories was copied into this vault.

## Application dependencies (MIT)

| Package | License | Notes |
|---------|---------|-------|
| `next` | MIT | Framework |
| `react` / `react-dom` | MIT | UI runtime |
| `react-markdown` | MIT | Markdown rendering |
| `remark-gfm` | MIT | GFM tables, task lists, strikethrough |
| `rehype-sanitize` | MIT | HTML sanitization for rendered notes |
| `react-grid-layout` | MIT | Workspace OS drag/resize grid |
| `cmdk` | MIT | Workspace OS command palette |
| `motion` | MIT | Workspace OS + Interactive Visual V1 motion primitives |
| `@dnd-kit/core` | MIT | Accessible project-board drag and drop |
| `@dnd-kit/sortable` | MIT | Sortable helpers for dnd-kit |
| `@dnd-kit/utilities` | MIT | Transform helpers for dnd-kit |
| `@xyflow/react` | MIT | Interactive command map (exploration only) |
| `xstate` | MIT | Voice interaction state machine |
| `@xstate/react` | MIT | React bindings for voice machine |

Full license texts are distributed with each package under `node_modules/<package>/LICENSE` (or equivalent) after `npm ci`.

## Reserved / not shipped in v1.0 runtime

| Package | Notes |
|---------|-------|
| `livekit-client` | Documented for a future realtime transport; not a v1.0 dependency |
| `@rive-app/react-canvas` | Optional presence animation deferred; CSS presence ships in v1.0 |

## Reference projects

| Project | License | Use in LifeOS Enterprise |
|---------|---------|--------------------------|
| COG Second Brain (Huy Tieu) | MIT © 2025 | Public architecture patterns only; no source files copied |
| LifeOS-OSS | Public repository | Public architecture discussions only; no private notes copied |

## Vault content policy

- Canonical source of truth: `ebyron357/LifeOS-Enterprise`
- Web portal is read-only
- Notes with `private: true`, `publish: false`, or `web_visibility: private` are excluded from indexing and all portal output
- Paths under `.git/`, `.obsidian/`, `app/`, `lib/`, `components/`, credential files, and `private/` directories are never indexed
