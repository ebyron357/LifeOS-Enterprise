# Technical Build Document

All facts below are taken from the repository: `package.json`, `tsconfig.json`,
`vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`,
`.github/workflows/`, `app/`, `lib/`, `components/`, `scripts/`, and `.env.example`.

## 1. System shape

```
Obsidian (local editing)  ──┐
                            ├──►  Git repository (ebyron357/LifeOS-Enterprise)  ──►  Vercel build  ──►  https://lifeos-enterprise.vercel.app/
Next.js app (read-only) ────┘                    ▲
                                                 │
                            draft pull request ──┘  (only governed write path)
```

The Markdown vault and the application code live in the same repository. The
Next.js server reads Markdown from the filesystem at request/build time; there
is no database.

## 2. Tech stack

| Layer | Choice | Evidence |
|-------|--------|----------|
| Framework | Next.js `16.3.5` (App Router, React Server Components) | `package.json`, `app/` |
| UI runtime | React / React DOM `19.2.4` | `package.json` |
| Language | TypeScript `5.9.3` | `tsconfig.json` |
| Runtime target | Node.js 20+ locally, Node 22 in CI | `docs/DEPLOYMENT.md`, `.github/workflows/dashboard-ci.yml` |
| Package manager | npm with committed `package-lock.json` (`npm ci`) | `package-lock.json` |
| Hosting | Vercel project `lifeos-enterprise` | `docs/DEPLOYMENT.md`, `.env.example` (`VERCEL_PROJECT_NAME`) |
| Persistence | Markdown files in Git; optional Upstash Redis REST for approvals | `lib/vault/`, `.env.example` |
| Lint | ESLint `9.39.2` + `eslint-config-next` (`--max-warnings=0`) | `eslint.config.mjs`, `package.json` |
| Unit tests | Vitest `4.1.11` + Testing Library + jsdom | `vitest.config.ts`, `tests/` |
| Browser tests | Playwright `1.62.1` (chromium, webkit) | `playwright.config.ts` |
| Vault validation | PowerShell scripts run on `windows-latest` | `scripts/audit-vault.ps1`, `.github/workflows/vault-health.yml` |

There is no `next.config.*` file; the project runs on Next.js defaults.

## 3. Key runtime dependencies and why they exist

| Package | Role in this codebase |
|---------|----------------------|
| `react-markdown`, `remark-gfm`, `rehype-sanitize` | Rendering vault notes as HTML with GFM support and sanitisation |
| `react-grid-layout` | Workspace OS draggable/resizable widget grid |
| `cmdk` | Command palette |
| `motion` | Motion primitives, gated by reduced-motion and overload modes |
| `@dnd-kit/core`, `/sortable`, `/utilities` | Accessible project Command Board drag and drop |
| `@xyflow/react` | Command Map graph exploration of vault relationships |
| `xstate`, `@xstate/react` | Voice interaction state machine |
| `tsx` (dev) | Running the portfolio sync scripts in `scripts/portfolio/` |

Licensing and attribution are recorded in `docs/THIRD_PARTY.md`; all runtime
dependencies are MIT. `livekit-client` and `@rive-app/react-canvas` are
documented as reserved and are deliberately **not** shipped in v1.0.

## 4. Source layout

```
app/                Next.js App Router routes and API handlers
  api/lifeos/       agent (session/turn/approval), change-plan, game/session,
                    resource-intake (+ /github), voice (session/speak/tools)
  dashboard/        advanced widget workspace
  conversation/ today/ projects/ inbox/ journal/ learning/ files/ ...
  note/[...slug]/   read-only note reader
  attachments/[...path]/
components/         agent, command-map, daily-brief, dashboard, feedback, motion,
                    os, portfolio, search, shell, vault, voice, widgets, workspace
lib/                agent, automation, command-map, daily-brief, feedback, game,
                    github, google, lifeos, motion, os, portfolio,
                    resource-intelligence, screen, vault, voice, workspace
scripts/            audit-vault.ps1, repair-local-vault.ps1, setup-obsidian.ps1,
                    validate-vault-links.ps1, portfolio/*.ts
tests/              66 files, including tests/e2e Playwright specs
docs/               operational documentation (this wiki lives in docs/wiki/)
```

Approximately 263 TypeScript/TSX source files and 169 Markdown files are tracked.

## 5. Vault indexing pipeline

`lib/vault/` is the read path:

- `build-index.ts` walks the repository for Markdown, parses notes with a bounded
  concurrency of 16 (`NOTE_PARSE_CONCURRENCY`), and builds the index.
- `exclusions.ts` is the canonical privacy filter. It excludes `.git/`,
  `.github/`, `.obsidian/`, `.vercel/`, `.next/`, `node_modules/`,
  `.local-backups/`, `.cline/`, `.codex/`, `.clinerules/`, `integrations/`,
  `coverage/`, `out/`, `app/`, `components/`, `lib/`, `tests/`, `scripts/`;
  exact files such as `.env*`, `.gitignore`, `package-lock.json`; and credential
  file extensions (`.pem`, `.key`, `.p12`, `.pfx`, `.crt`). Notes marked
  `private: true`, `publish: false`, or `web_visibility: private` are excluded.
- `parse-frontmatter.ts`, `parse-note.ts` extract properties, headings, tasks,
  wikilinks, embeds and excerpts.
- `resolve-link.ts` builds the basename index and backlinks.
- `section-map.ts` maps notes into sections and flags legacy folder paths.

Any change to privacy behaviour must go through `lib/vault/exclusions.ts`.

## 6. Write path and governance

`app/api/lifeos/change-plan/route.ts` is the only canonical write route. It:

- Pins `OWNER = "ebyron357"`, `REPO = "LifeOS-Enterprise"`, `BASE = "main"`.
- Reports `mode: "draft-pr-only"` and `directMainWrites: false` on `GET`.
- Requires `LIFEOS_WRITE_ENABLED=true` **plus** `LIFEOS_WRITE_SECRET` **plus**
  `LIFEOS_GITHUB_TOKEN` before it considers itself configured.
- Restricts writes to an allowlist of fields (`status`, `priority`,
  `next_action`), statuses (`active`, `waiting`, `blocked`, `complete`) and
  priorities (`P0`–`P3`), with a 64 KB body cap and rate limiting.
- Uses canonical SHA conflict detection (HTTP 409) so stale edits cannot clobber.

Agent approvals live in `lib/agent/approvals.ts` and `lib/agent/approval-store.ts`
with expiry, nonce/replay protection and session/project/repository/path/revision
binding. Execution uses the stored arguments, not the human-readable summary.
Production requires Upstash Redis REST; a missing store **fails closed**.

## 7. Voice subsystem

`app/api/lifeos/voice/speak/route.ts` runs on the Node runtime and enforces
origin validation, rate limiting (30 per window per trusted client identity), a
2000-character cap, and `authorizePaidTts` before any OpenAI spend. A
`provider: "browser"` request returns immediately without calling a paid API.
Voice is off unless `LIFEOS_VOICE_ENABLED=true`. LiveKit room-token minting is
explicitly deferred.

## 8. Build, test and CI

Local commands (`package.json`):

```
npm run dev        next dev
npm run build      next build
npm start          next start
npm run lint       eslint . --max-warnings=0
npm run typecheck  tsc --noEmit
npm test           vitest run
npm run test:e2e   playwright test
npm run portfolio:sync
npm run portfolio:mapping-proposal
```

**Dashboard CI** (`.github/workflows/dashboard-ci.yml`, ubuntu-latest, Node 22,
`contents: read`): checkout → setup-node with npm cache → `npm ci` →
`npm audit --audit-level=high` → lint → typecheck → test → build →
`npx playwright install --with-deps chromium webkit` → `npm run test:e2e`.

**Vault Health** (`.github/workflows/vault-health.yml`, windows-latest): runs
`scripts/audit-vault.ps1`, which verifies required folders, required Bases files,
required templates, required operational documents, metadata completeness, and
internal link integrity.

Recorded baseline validation (PR #64, `docs/CANONICAL_LIVE_STATUS.md`): 54 test
files / 298 tests passing, lint, typecheck and build passing, vault audit
passing, `npm audit --audit-level=high` reporting 0 vulnerabilities.

## 9. Deployment

- Vercel project linked to `ebyron357/LifeOS-Enterprise`; production deploys from
  `main` automatically, or by promoting a preview.
- Post-deploy verification: `/` loads the unified Command Center, `/dashboard`
  loads the advanced workspace, and the change-plan panel shows writes disabled
  unless intentionally configured.
- Documentation-only merges can trigger a production deploy without changing
  application code, so application-code baseline and live deployment identity are
  always reported separately.
- Full procedure, environment matrix and production checklist:
  `docs/DEPLOYMENT.md`.

## 10. Known technical limitations (from the repo)

- LiveKit realtime transport deferred; browser speech only.
- Haitian Creole and French voice locales are not owner-verified.
- In-memory rate limiting is process-local and not shared across serverless
  instances.
- Obsidian Bases and Dataview are not executed by the web server; those
  dashboards only render inside Obsidian.
- Resource Intelligence / Universal Resource Intake is a partial platform build
  item, not an end-to-end pipeline.
