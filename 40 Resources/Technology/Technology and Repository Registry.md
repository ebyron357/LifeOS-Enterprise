# Technology and Repository Registry

**Status:** Canonical operational registry  
**Owner:** EAB Byron  
**Last reviewed:** 2026-07-19  
**Governing standard:** [[Approved Design Tool Stack|Approved Technology, Platform, Repository, and Goal Stack]]

## Purpose

This registry converts approved technology guidance into an operational queue. Every active platform, repository, or tool must be tied to a goal, project, owner, next action, and measurable result.

## Status Definitions

- **Approved — Active:** Cleared for current use.
- **Approved — Next:** Cleared but not yet the highest-priority implementation.
- **Controlled Pilot:** Test on one bounded project before broader adoption.
- **Research Watchlist:** Monitor only; do not place in core operations.
- **Blocked:** Approved work cannot proceed until the named dependency is resolved.
- **Rejected:** Do not use unless the governing standard is formally replaced.

## Priority Queue

| Priority | Platform or repository | Goal | Project | Status | Owner | Next action | Completion evidence |
|---|---|---|---|---|---|---|---|
| P0 | GitHub | Reliable agent workforce; complete projects | All active repositories | Approved — Active | EAB Byron + coding agents | Standardize project status, evidence, and branch/PR use | Traceable commits, PRs, checks, and exact project status |
| P0 | Vercel | Complete projects; business growth | ClientVerse, D’Affordable Homes, Jasmine Parker, Take A Sweet, LifeOS | Approved — Active | Codex + EAB Byron | Verify repository-to-project mapping and production status | Successful builds and verified live deployments |
| P0 | `vercel/ai` | Business growth; AI mastery; Haitian Creole technology | Clara, ClientVerse assistant, LifeOS assistant, Haitian Creole agent | Approved — Next | Codex | Select one production pilot and create implementation issue | Working streamed assistant with provider configuration and tests |
| P0 | `vercel/sdk` | Reduce project confusion; organize LifeOS | LifeOS dashboard and Vercel projects | Approved — Next | Codex | Build project/deployment status integration plan | Dashboard shows correct project, repo, environment, and live deployment state |
| P0 | Axe or Accessibility Insights | Complete websites; quality control | Every active website | Approved — Active | Coding agent | Add accessibility review to acceptance criteria | Automated report plus manual keyboard and mobile review |
| P0 | `metafloor/bwip-js` | Product commercialization | THE ALTERNATIVE, ALT syrups, Bravo Paws, STAXX | Approved — Next | Packaging/code agent | Build one verified SVG barcode generation test | Correct barcode type, encoded value, SVG output, scan verification |
| P0 | `heuer/segno` | Product commercialization and physical-to-digital workflows | Packaging, real estate, bakery, ClientVerse | Approved — Next | Packaging/automation agent | Generate and scan-test one production-style QR asset | Correct destination, error correction, SVG/PDF export, scan report |
| P1 | SuperDesign | Faster design decisions | D’Affordable Homes, ClientVerse, Take A Sweet | Approved — Next | Design agent | Compare three directions for one active page before coding | Approved direction and reduced redesign after implementation |
| P1 | Onlook | Improve coded visual quality | Supported Next.js/Tailwind projects | Controlled Pilot | Codex + EAB Byron | Test on a non-production branch | Useful visual changes committed with clean code and rollback path |
| P1 | Figma Simple Design System | Standardize design-to-code | D’Affordable Homes or ClientVerse | Approved — Next | Design + coding agents | Select pilot and map tokens/components | Figma variables and production components remain aligned |
| P1 | Adobe React Aria | Accessible interaction quality | ClientVerse, D’Affordable Homes, real-estate portals | Approved — Next | Coding agent | Identify complex controls needing accessible primitives | Keyboard, focus, screen-reader, and visual acceptance tests pass |
| P1 | `vercel/chatbot` | Lead capture and customer support | Clara, ClientVerse, real estate, bakery | Approved — Next | Codex | Evaluate as reference against current project architecture | Reuse decision documented; no unnecessary template duplication |
| P1 | `vercel/chat` | Multichannel agents | ClientVerse, LifeOS, Haitian Creole agent | Approved — Next | Agent architecture owner | Choose first channel pair for pilot | Same assistant logic works across two verified channels |
| P1 | `vercel-labs/knowledge-agent-template` | Organize knowledge and standards | LifeOS, AI Operating Standards, Packaging OS | Controlled Pilot | Codex | Test retrieval over one bounded governed source | Accurate grounded responses with source links and failure handling |
| P1 | `enescingoz/awesome-n8n-templates` | Reduce mental load; automate business | Gmail, calendar, bills, leads, Slack, Shopify | Approved — Research Library | Automation agent | Shortlist workflows by current goals and security risk | Approved shortlist with credentials and data-flow review |
| P1 | `AmplifyAutomation/n8n-templates` | Faster lead response | D’Affordable Homes, ClientVerse, Jasmine Parker | Controlled Pilot | Automation agent | Review speed-to-lead and appointment workflows | One sandbox workflow passes end-to-end test without exposing production data |
| P1 | `bcbnz/pylabels` | Prototype and operational labels | Take A Sweet, packaging tests, mailing, LifeOS | Approved — Next | Packaging/operations agent | Produce one dimensionally accurate PDF sheet | Printed measurement, alignment, content, and readability verified |
| P1 | ReceiptLine | Thermal operational labels | Take A Sweet, STAXX, fulfillment | Controlled Pilot | Operations agent | Confirm printer and output requirements | Test label or ticket prints correctly on target device |
| P2 | Manus | Research, audits, delegated execution | Cross-project | Approved — Active | EAB Byron | Use only with a saved output destination and verification requirement | Research or execution artifact saved with sources and next decision |
| P2 | `abcnuts/manus-skills` | Improve delegated execution | Manus workflows | Controlled Pilot | EAB Byron | Inspect individual skills before importing any | Approved skills list with security and duplication review |
| P2 | `microsoft/skills` | Standardize coding agents | AI Operating Standards and repositories | Controlled Pilot | Standards owner | Compare selected skills with canonical standards | Useful rules merged without conflicting or duplicate governance |
| P2 | Replit and `nextjs/deploy-replit` | Rapid prototypes and learning | Small demos and agent prototypes | Approved — Active | EAB Byron + agents | Use only when prototype speed is the primary need | Working demo transferred to GitHub when retained |
| P2 | Google Agent Starter Pack | Production agent learning | Haitian Creole agent and cloud-agent education | Controlled Pilot | Learning/agent owner | Run one reference agent and document architecture | Deployed test, evaluation evidence, and plain-language architecture notes |
| P2 | OpenVoiceOS | Voice-first LifeOS | Voice assistant research | Controlled Pilot | Voice project owner | Test hardware, latency, speech quality, and integration effort | Recorded results and clear continue/stop decision |
| P3 | OpenFang | Autonomous agent OS research | Local/cloud agent OS | Research Watchlist | Research owner | Monitor maturity and breaking changes | Review note only; no core dependency |
| P3 | OpenPencil | AI-native design research | Design workflow | Controlled Pilot | Design owner | Compare against Figma and Adobe on one small artifact | Editability, output, reliability, and duplication scored |
| P3 | Open Design | AI design workspace research | LifeOS design-agent workflows | Controlled Pilot | Design owner | Test only after higher-priority design pilots | Continue/stop decision with evidence |
| P3 | Avocado Studio | Preview-based site editing | Supported Next.js project | Controlled Pilot | Coding owner | Test security, rollback, and code quality in branch | No production bypass; clean diff and successful checks |
| P3 | Figma Code Connect | Design-code linkage | Mature design-system project | Blocked | Design owner | Confirm Figma plan and stable component library | Eligibility and pilot project documented |

## Current Implementation Sequence

1. Verify GitHub and Vercel project truth across active websites.
2. Add accessibility review to all website completion standards.
3. Select the first Vercel AI SDK production pilot.
4. Build verified barcode and QR generation tests for product projects.
5. Establish one Figma design-system pilot.
6. Test one design refinement tool on a branch.
7. Shortlist automation workflows by measurable goal.
8. Begin voice and autonomous-agent pilots only after higher-priority systems are stable.

## Review Rules

During each weekly review:

1. Confirm every P0 and P1 item still supports a current goal.
2. Record evidence, blockers, and exact next actions.
3. Move inactive tools out of the active queue.
4. Do not promote a pilot without test results.
5. Do not retain tools whose function is already covered more effectively.
6. Update the governing document before changing approval status.
