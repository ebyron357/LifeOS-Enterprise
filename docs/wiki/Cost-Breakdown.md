# Cost Breakdown

## Important caveat

The repository contains **no billing data, invoices, plan selections or usage
metrics**. There is no `vercel.json`, no billing export, and no pricing file.
Everything below is derived from the service list that the code actually
requires (`.env.example`, `docs/DEPLOYMENT.md`, `docs/CANONICAL_LIVE_STATUS.md`,
`.github/workflows/`) combined with each vendor's public plan structure. The
actual invoiced amount must be confirmed in the Vercel, Upstash and OpenAI
dashboards.

## 1. What is actually running today

Per `docs/CANONICAL_LIVE_STATUS.md`, in current production:

- Vault reads — **available**
- GitHub health read — **connected**
- Quick Capture — available, browser-local
- Canonical writes, durable approvals, ClickUp, Slack, n8n, Vercel actions,
  Hermes, Google/Revenue Radar — **unavailable / fail-closed**
- Paid server TTS — owner-configured only

That means the deployed system in its documented state consumes **Vercel hosting
and GitHub Actions minutes, and nothing else**. Every metered third-party
service is dormant because its credentials are unset.

## 2. Current monthly running cost

| Item | Required now? | Plan reality | Estimated monthly |
|------|---------------|--------------|-------------------|
| Vercel hosting (`lifeos-enterprise`) | Yes | Single-owner, low-traffic Next.js app; fits Hobby, Pro if commercial use | **$0** on Hobby, **$20/user** on Pro |
| GitHub repository | Yes | Free for public/personal repos | **$0** |
| GitHub Actions | Yes | Free tier covers public repos; private repos consume included minutes. Dashboard CI additionally installs Playwright chromium+webkit on every run, and Vault Health uses `windows-latest`, which bills at a higher multiplier on private repos | **$0** public; **$0–$20** private depending on merge frequency |
| Obsidian (personal use) | Yes | Free for personal use; Commercial licence applies to business use | **$0**, or ~$50/user/year commercial |
| Upstash Redis REST | Only if writes/approvals enabled | Pay-per-request serverless tier | **$0** unused; low single digits at this volume |
| OpenAI (server TTS / LLM rewrite) | Optional, owner-gated | Usage-based; 2000-char cap per request | **$0** unless enabled |
| OpenRouter | Optional | Usage-based | **$0** unless enabled |
| Google Cloud service account + Sheet | Optional (Revenue Radar) | Sheets API free at this scale | **$0** |
| ClickUp / Slack / n8n | Optional | Typically existing subscriptions, not caused by this project | **$0** incremental |
| LiveKit | Deferred, not shipped | — | **$0** |
| Supabase | Reserved, unused | — | **$0** |
| Domain | No custom domain configured in the repo (`*.vercel.app` in use) | — | **$0**, or ~$1–2/mo if added |

**Realistic current total: $0–$20 per month.** The floor is genuinely zero on
free tiers; the ceiling is a Vercel Pro seat plus private-repo Actions minutes.

**If every optional capability were switched on** (durable approvals, paid TTS,
LLM rewrite, tool adapters), the incremental cost is usage-driven rather than
fixed — realistically **$25–$120/month** for one heavy single-user operator,
dominated by LLM and TTS tokens.

### Cost levers that matter

- CI is the largest hidden variable: the full Dashboard CI job installs two
  Playwright browsers and runs the e2e suite on every push and pull request.
- The 2000-character TTS cap and the browser-first TTS provider bound voice spend
  structurally.
- No database means no idle database bill — the vault is files in Git.

## 3. Cost to rebuild from scratch

Scope of the existing artefact: ~263 TypeScript/TSX source files, 66 test files
(54 test files / 298 tests recorded passing at the PR #64 baseline), 169 Markdown
documents, ~50 app routes including 10 API handlers, four PowerShell operational
scripts, two CI workflows, and a substantial governance/security layer
(draft-PR-only writes, allowlisted fields, SHA conflict detection, nonce/replay
protection, fail-closed approvals, origin checks, rate limiting, canonical
privacy exclusions).

### Effort estimate by component

| Component | Scope | Senior-dev days |
|---|---|---|
| Vault parsing/indexing (`lib/vault`) — frontmatter, wikilinks, backlinks, sections, exclusions, slugs | 9 modules + 8 test files | 8–12 |
| App shell, navigation, ~40 routes, note reader, search, attachments | `app/`, `components/shell`, `components/vault` | 15–25 |
| Workspace OS (grid, widget registry, persistence, command palette) | `components/workspace`, `components/widgets` | 10–15 |
| Interactive Command Board + Command Map | dnd-kit + React Flow surfaces | 8–12 |
| Governed write path (change plan, allowlists, SHA conflicts, draft PR) | `app/api/lifeos/change-plan` + `lib/github` | 8–12 |
| Agent runtime, policy, approvals, durable store, tool registry/executor | `lib/agent/*` | 15–22 |
| Voice subsystem (XState machine, session, speak, tools, security) | `lib/voice`, voice routes | 10–15 |
| Game loop, daily brief, portfolio sync, resource intelligence | `lib/game`, `lib/daily-brief`, `lib/portfolio`, `lib/resource-intelligence` | 12–18 |
| Test suite (unit + Playwright across three viewports) | 66 files | 12–18 |
| Vault content design, templates, Bases, metadata schema, audit scripts | vault + `scripts/` | 10–15 |
| Documentation set (25+ operational docs) | `docs/` | 6–10 |
| **Total** | | **114–174 days** |

### Cost translation

| Build route | Day rate | Rebuild cost |
|---|---|---|
| Solo senior full-stack contractor (UK/EU) | £450–£650 | **£51,000 – £113,000** |
| US agency / small team | $900–$1,400 | **$103,000 – $244,000** |
| Offshore team | $300–$450 | **$34,000 – $78,000** |
| AI-assisted solo build reproducing the same feature set | — | **~40–60% of the above**, at the cost of the governance/test depth that took the longest here |

**Headline: a faithful rebuild is realistically a £50k–£110k / $100k–$240k
engagement.** The expensive parts are not the screens; they are the security and
governance invariants (fail-closed approvals, replay protection, SHA conflict
handling, privacy exclusions) and the 298-test regression suite that proves them.

### What a rebuild would *not* recreate

- The accumulated vault content, templates, Bases and metadata conventions.
- The operational documentation and validated release history.
- The specific truthful-state model that refuses to display unconfigured
  integrations as connected — easy to describe, repeatedly re-learned in practice.
