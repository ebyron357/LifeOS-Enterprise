# Market Valuation

## Caveat

The repository contains no revenue data, no user metrics, no analytics, and no
customer records. Revenue Radar exists in the code but ships in a *safe empty
state* with no data source configured. This valuation therefore rests on
**asset value and rebuild cost**, not on a revenue multiple. Any figure below is
an informed range, not an appraisal.

## 1. What is being valued

A production-deployed, MIT-dependency-only, single-tenant operating system
consisting of:

- ~263 TypeScript/TSX source files on Next.js 16 / React 19
- 66 test files (54 files / 298 tests recorded passing at the PR #64 baseline)
- A Markdown-native vault with no database dependency
- A governed write path that is structurally incapable of writing to `main`
- A server-authoritative approval system with expiry, nonce/replay protection and
  fail-closed storage semantics
- A voice subsystem with browser-first TTS and owner-gated paid TTS
- Two CI pipelines (application validation + vault structural audit)
- 25+ operational documents including deployment, rollback, security posture and
  an owner acceptance workbook

## 2. Comparable products and projects

| Comparable | What it is | Relationship to this project |
|---|---|---|
| **Obsidian Publish** | Official paid hosting for an Obsidian vault as a website | Closest direct analogue to the read-only portal, but Publish has no command center, no governed writes, no agent/approval layer |
| **Obsidian + Dataview community dashboards** | Free community pattern | The vault layer here replicates and exceeds this; the web layer has no free equivalent |
| **Notion / ClickUp** | Hosted SaaS workspaces | The functional competitors for daily operations, but both are vendor-locked databases; this project's differentiator is that the data is plain files you own |
| **LifeOS-OSS** | Public open-source life-OS repository | Cited in `docs/THIRD_PARTY.md` as architectural reference only; open source, no commercial price point |
| **COG Second Brain** (MIT © 2025) | Public second-brain architecture | Same — patterns only, no code copied |
| **Quartz / Digital Garden publishers** | Static site generators for Markdown vaults | Overlap only on the read path; none carry an approval/agent governance layer |
| **Internal productivity-tool asset sales** (Acquire.com, MicroAcquire-style listings) | Pre-revenue code assets | The most relevant pricing reference class for this listing |

The honest competitive read: the read-only-vault-portal space is crowded and
mostly free. The defensible, uncrowded part of this asset is the **governance
layer** — draft-PR-only canonical writes, server-authoritative approvals, and a
truthful integration-state model.

## 3. Suggested asking price range

| Scenario | Basis | Range |
|---|---|---|
| **Code asset sale, as-is, no revenue, no users** | Fraction of rebuild cost, typical 15–30% for pre-revenue code | **$18,000 – $45,000** |
| **Asset sale including full documentation, CI, vault content and the governance layer** | The docs and tests are a meaningful share of rebuild cost | **$35,000 – $70,000** |
| **Licensed/white-label to a team wanting a self-hosted, file-owned workspace** | Per-deployment licence | **$8,000 – $20,000 per deployment** |
| **Acqui-hire / strategic (buyer wants the governance pattern for their own agent product)** | Pattern value exceeds code value | **$60,000 – $150,000** |

**Recommended headline ask: $40,000 – $65,000** for a full asset transfer
including repository, documentation, CI, and handover. Justify it against the
rebuild range in [Cost Breakdown](./Cost-Breakdown.md) ($100k–$240k at US agency
rates), not against speculative future revenue.

Discount pressure a serious buyer will apply, correctly:

- No revenue, no users, no retention data.
- `docs/CANONICAL_LIVE_STATUS.md` states owner acceptance is **not complete**.
- Single-tenant: `OWNER` and `REPO` are hard-coded in the change-plan route, so
  multi-tenancy is real work, not configuration.
- Several advertised capabilities are deliberately unavailable (LiveKit,
  Resource Intelligence end-to-end, most tool adapters).
- Bus factor of one; all institutional knowledge sits with `ebyron357`.

## 4. Key selling points

**For a buyer who wants to operate it**

1. **Zero-to-low running cost.** No database, no idle infrastructure. The
   documented production state runs on free/low tiers.
2. **Data sovereignty.** The content is Markdown in Git. There is no export
   problem and no lock-in — a hard differentiator against Notion and ClickUp.
3. **Actually deployed.** Live at `https://lifeos-enterprise.vercel.app/`,
   released as `1.0.0`, with a recorded green validation baseline.
4. **Operationally documented.** Deployment guide, rollback procedure, security
   posture, environment matrix, incident scripts and an acceptance workbook —
   unusual maturity for a project of this size.

**For an investor or strategic acquirer**

5. **The governance layer is the real IP.** Fail-closed approvals, replay/nonce
   protection, exact-stored-argument execution, canonical SHA conflict detection,
   allowlisted write fields, and draft-PR-only persistence. This is the hard part
   of shipping AI agents that touch production data, and it is already built and
   tested.
6. **The truthful-state model.** Unconfigured integrations report *unavailable*
   rather than fabricating connectivity. This is a trust posture most agent
   products lack and cannot retrofit cheaply.
7. **Security hygiene enforced in CI.** `npm audit --audit-level=high` gates
   every build; 0 vulnerabilities at the last recorded baseline; no client-side
   provider keys; canonical privacy exclusions centralised in one reviewable file
   (`lib/vault/exclusions.ts`).
8. **Clean licensing.** All runtime dependencies MIT, attribution documented, and
   an explicit statement that no private content was copied from the reference
   projects — meaning diligence is short.
9. **Modern, supportable stack.** Next.js 16, React 19, TypeScript strict-mode
   tooling, ESLint at zero warnings, Vitest plus Playwright across three
   viewports. Low onboarding cost for a new engineer.

## 5. What would move the valuation up

- Complete `docs/OWNER_ACCEPTANCE_WORKBOOK.md` and publish the evidence.
- Remove the hard-coded owner/repo constants and demonstrate a second tenant.
- Ship the Resource Intelligence intake pipeline end to end.
- Turn on durable approvals and demonstrate one real governed external write
  (ClickUp or Slack) with audit evidence.
- Add any real usage: even ten non-owner users with retention data shifts the
  conversation from asset sale to product multiple.
