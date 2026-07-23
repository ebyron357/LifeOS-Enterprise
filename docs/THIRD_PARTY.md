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

Full license texts are distributed with each package under `node_modules/<package>/LICENSE` (or equivalent) after `npm ci`.

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
