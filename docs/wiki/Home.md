# LifeOS Enterprise Wiki

Repository-derived documentation set. Every page below is written from the actual
contents of `ebyron357/LifeOS-Enterprise` (source files, configuration, workflows,
scripts, and existing operational docs). Where a fact is not present in the
repository, the page says so explicitly rather than inventing a value.

| Page | Purpose |
|------|---------|
| [Plain-English Summary](./Plain-English-Summary.md) | What this project is and who it is for, without jargon |
| [Technical Build Document](./Technical-Build-Document.md) | Architecture, stack, dependencies, build and deploy |
| [Responsibility and Access](./Responsibility-and-Access.md) | Ownership, hosting, accounts and keys required |
| [Incident and Recovery Guide](./Incident-and-Recovery-Guide.md) | Failure modes, triage, rollback and rebuild |
| [Cost Breakdown](./Cost-Breakdown.md) | Current running cost and rebuild cost estimate |
| [Market Valuation](./Market-Valuation.md) | Comparables, price range, selling points |

## Authoritative sources inside the repo

- `docs/CANONICAL_LIVE_STATUS.md` — capability, governance and acceptance state
- `docs/DEPLOYMENT.md` — deployment procedure and environment variable matrix
- `docs/LifeOS_Specification_v1.md` — operating specification
- `docs/WEB_VAULT_PORTAL.md` — read-only vault portal architecture
- `docs/WEB_AGENT_OPERATIONS.md` — agent operating rules
- `docs/THIRD_PARTY.md` — dependency licensing and attribution
- `architecture/METADATA_SCHEMA.md` — note property contract
- `.env.example` — complete list of configurable integrations

## Status rules that apply to these pages

Per `docs/CANONICAL_LIVE_STATUS.md`, GitHub `main` is authoritative for repository
head and Vercel production is authoritative for the live deployment ID and SHA.
These wiki pages deliberately do not hard-code a "current production SHA".
