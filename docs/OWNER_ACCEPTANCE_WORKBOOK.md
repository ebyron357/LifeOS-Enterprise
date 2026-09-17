# LifeOS Owner Acceptance Workbook

**Document type:** Printable owner acceptance workbook  
**Repository:** `ebyron357/LifeOS-Enterprise`  
**Current production SHA:** `46a2514893b4e3557911403274cba695b1c89384`  
**Production URL:** `https://lifeos-enterprise.vercel.app/`  
**Governing status:** PRs #60, #61, and #62 are merged to `main`, and the current production deployment serves #62. Owner acceptance is still required.  
**Do not mark owner acceptance complete in this workbook on the owner's behalf.**

Use one row per test. Record evidence such as a screenshot, short note, deployment ID, or commit SHA. Separate agent-completed work from owner-required work.

---

## How to use

1. Confirm the deployed SHA is `46a2514893b4e3557911403274cba695b1c89384` before testing.
2. Open `https://lifeos-enterprise.vercel.app/` on the real owner desktop/mobile browsers.
3. Complete every applicable checkbox row below.
4. Mark Pass / Fail and attach evidence.
5. Do not enable production writes merely to finish the workbook; credential-gated checks are performed only when the owner intentionally enables those integrations.
6. Sign only after all required owner rows pass and any accepted deferrals are documented.

---

## Section A — Production identity and unified Command Center

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| A1 | Deployment identity | Open production and confirm deployment evidence | Production is serving SHA `46a2514893b4e3557911403274cba695b1c89384` | ☐ | | |
| A2 | Root Command Center | Open `/` | One clear LifeOS Command Center appears; the root does not redirect to the legacy dashboard | ☐ | | |
| A3 | Primary mission | Read the Today card | A current mission, critical outcomes, and one Start Here action are visible without hunting folders | ☐ | | |
| A4 | Resume work | Use Start Here / Projects to resume a project | Correct project workspace opens and the next action is visible | ☐ | | |
| A5 | Ask LifeOS | Open `/conversation` from the persistent Ask LifeOS control | Conversation opens and existing voice/write safety behavior remains available | ☐ | | |
| A6 | Capture | Open Capture and save a harmless test note | Item appears in Inbox; UI clearly states browser-local storage | ☐ | | |
| A7 | Journal | Open `/journal` | Today's journal flow is usable and does not show raw template placeholders | ☐ | | |
| A8 | Learning | Open `/learning` | Continue/add-learning flow is understandable; no misleading index-note behavior is accepted silently | ☐ | | |
| A9 | Files | Open `/files` | Search-first file experience works without requiring folder reconstruction | ☐ | | |
| A10 | Integration truth | Open `/integrations` | GitHub/LifeOS states are truthful; unconfigured tools are not labeled connected | ☐ | | |
| A11 | Advanced dashboard retained | Open `/dashboard` from More/advanced tools | Existing widget dashboard remains accessible | ☐ | | |
| A12 | Browser navigation | Use back/forward through several primary routes | History behaves normally; no forced navigation loop | ☐ | | |
| A13 | Mobile shell | Repeat core navigation at 390px | Home, Ask LifeOS, Projects, Capture, and More are easy to reach | ☐ | | |

---

## Section B — Agent-completed prerequisites to verify

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| B1 | Current main contains merged fixes | Inspect current GitHub main | #60 operational closeout, #61 security/write corrective, and #62 Command Center rebuild are all present | ☐ | | |
| B2 | Automated validation record | Review PR #61/#62 evidence | Lint, typecheck, unit, build, audit, and vault audit are recorded; browser-suite limitations are disclosed rather than hidden | ☐ | | |
| B3 | No secrets in repo | Spot-check `.env.example` and recent diffs | Placeholders only; no live tokens | ☐ | | |
| B4 | Integration availability truthful | Inspect `/integrations` and `/conversation` Context/tools | Unconfigured tools show unavailable/configured requirements, never invented success | ☐ | | |
| B5 | Stale PR cleanup | Inspect open PR list | Superseded PR #55 is closed; no competing conversation-runtime PR remains active | ☐ | | |

---

## Section C — Advanced dashboard and widgets

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| C1 | Desktop hydrate @1440 | Open `/dashboard` at 1440px | Multi-column widgets visible; no uncaught console errors | ☐ | | |
| C2 | Laptop hydrate @1024 | Open `/dashboard` at 1024px | Layout usable; widgets visible | ☐ | | |
| C3 | Drag | Drag a widget by the handle | Coordinates change and persist after refresh | ☐ | | |
| C4 | Resize | Resize a widget from the resize handle | Dimensions change and persist | ☐ | | |
| C5 | Minimize / restore | Minimize then restore | Widget collapses and restores | ☐ | | |
| C6 | Show / hide | Widget Library → Hide then Show | Widget disappears/reappears and persists | ☐ | | |
| C7 | Accessible reorder | Widget Library → Move up/down | Order changes; keyboard operable | ☐ | | |
| C8 | Repair Layout | Click Repair layout | Invalid layout recovers to defaults with visible feedback | ☐ | | |
| C9 | Mobile @390 | Open dashboard at 390px | Mobile customization/reorder controls are usable; not a dead feed | ☐ | | |
| C10 | Reduced motion | Enable reduced-motion preference | Motion respects preference; controls remain usable | ☐ | | |

---

## Section D — Verified game loop

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| D1 | Profile / avatar | Change alias/avatar | Profile updates; no XP invented | ☐ | | |
| D2 | Progress bar | Complete one attested quest | XP bar advances; level math matches XP | ☐ | | |
| D3 | Verified completion | Click Complete/attest and confirm | XP awarded once | ☐ | | |
| D4 | Duplicate protection | Confirm completion again / refresh | No duplicate XP | ☐ | | |
| D5 | Cancel attestation | Start completion then cancel | No XP awarded | ☐ | | |
| D6 | Daily check-in | Click Daily check-in | +20 XP once per day; streak updates | ☐ | | |
| D7 | Quest grounding | Inspect main/side/boss quests | Quests derive from real active/blocked/waiting project evidence | ☐ | | |
| D8 | Boss steps | Mark a boss step, then attest battle | Step mark awards 0 XP; attested boss awards once | ☐ | | |
| D9 | End of day | Click End day results | Completed quests appear; daily check-in XP is listed once | ☐ | | |
| D10 | Check-in idempotency | Daily check-in, interact with matching quest, refresh/end day | XP and totals count the check-in once | ☐ | | |
| D11 | Repair / reset | Repair then optionally reset | Corrupted state recovers; reset clears intentionally | ☐ | | |

---

## Section E — Voice system

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| E1 | Voice settings | Open `/conversation` Voice settings | Provider, locale, input language, style, speed, pitch visible | ☐ | | |
| E2 | Preview / reset | Preview voice; reset defaults | Audible preview; defaults restore | ☐ | | |
| E3 | Persist prefs | Change settings; refresh | Settings restore safely | ☐ | | |
| E4 | Provider truth | With/without `OPENAI_API_KEY` | Unconfigured OpenAI is not shown as available | ☐ | | |
| E5 | Start / stop | Start then stop conversation | Listening starts/stops; no leftover capture | ☐ | | |
| E6 | Mute stops mic | Start conversation; mute | Mic capture stops; transcripts stop submitting | ☐ | | |
| E7 | Unmute | Unmute | Listening resumes only after explicit unmute/restart behavior | ☐ | | |
| E8 | Interrupt | Interrupt while assistant speaks | Speech stops promptly; no overlapping assistant speech | ☐ | | |
| E9 | Push-to-talk | Hold push-to-talk then release | Listening follows the intended hold/release interaction | ☐ | | |
| E10 | States visible | Observe full flow | listening / thinking / speaking / muted / stopped / error states are clear | ☐ | | |
| E11 | Mobile voice | Repeat core voice checks at 390px | Controls remain usable | ☐ | | |
| E12 | Browser provider | Select Browser provider and speak | Browser speech is used; server OpenAI TTS is not called | ☐ | | |
| E13 | Paid TTS auth | If intentionally configured, omit owner TTS/write secret | Paid server TTS is rejected/falls back; public session token cannot spend the key | ☐ | | |

---

## Section F — Screen sharing safety

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| F1 | Share / stop | Share screen; stop sharing | All tracks stop; indicator not falsely active | ☐ | | |
| F2 | Browser end | End share from browser UI | App updates to ended state | ☐ | | |
| F3 | Navigate away | Share then leave `/conversation` | Tracks release on cleanup | ☐ | | |
| F4 | Deny permission | Deny share permission | Denied state; safe recovery | ☐ | | |
| F5 | Requesting state | Click Share screen and wait on picker | Requesting state is visible before grant/deny/end | ☐ | | |

---

## Section G — Authorization, approvals, and draft-PR-only writes

These checks are required only when the owner intentionally enables the relevant write configuration. Leaving writes disabled is a valid safe operating state.

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| G1 | Approval gate | Request a configured Slack/ClickUp/n8n/Vercel or canonical write action | Pending approval required; no silent execution | ☐ | | |
| G2 | Reject | Reject approval | Nothing executes | ☐ | | |
| G3 | Forged approval | Attempt client-only approval without valid server record | Server rejects unknown/replayed/expired/mismatched approval | ☐ | | |
| G4 | Change-plan draft PR | Stage canonical change with write config enabled | Creates/updates a **draft** PR only; never writes directly to `main` | ☐ | | |
| G5 | Wrong project/path | Attempt mismatched project/path write | Rejected server-side | ☐ | | |
| G6 | Failed write honesty | Force a failing write with controlled bad credentials | UI/API reports failure; no success claim | ☐ | | |
| G7 | Owner write secret | Attempt approval without then with write secret | Anonymous/voice-session tokens rejected; owner secret required | ☐ | | |
| G8 | Displayed args execute | Inspect approval arguments then approve | Executed payload matches immutable stored arguments | ☐ | | |
| G9 | Durable store fail-closed | Remove/omit Upstash Redis REST | Write/approval actions report unavailable; no production memory fallback | ☐ | | |

---

## Section H — Configuration and environment

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| H1 | Environment placeholders | Review `.env.example` / Vercel settings | Repo has placeholders only; production secrets stay server-side | ☐ | | |
| H2 | Write fail-closed | Leave write secrets empty | Writes disabled; application remains usable | ☐ | | |
| H3 | Voice fallback | Leave OpenAI empty | Browser fallback remains available where supported | ☐ | | |
| H4 | Production origin | If enabling writes, set `LIFEOS_ALLOWED_ORIGIN` | Cross-origin write attempts denied | ☐ | | |
| H5 | Approval Redis | If enabling writes, set Upstash REST URL/token | Approvals survive cold starts; missing store fails closed | ☐ | | |
| H6 | TTS secret | If enabling paid TTS, set dedicated/reused owner secret | Public session tokens cannot spend `OPENAI_API_KEY` | ☐ | | |
| H7 | Integration credentials | Configure only intentionally approved tools | Integration health changes only after real prerequisites/probes | ☐ | | |
| H8 | Hermes honesty | Leave Hermes unset unless a real runtime exists | Hermes remains unavailable; no fake delegated-run count | ☐ | | |

### Owner credential checklist — only when intentionally enabling features

- [ ] GitHub fine-grained token → `LIFEOS_GITHUB_TOKEN`
- [ ] Write authorization secret → `LIFEOS_WRITE_SECRET`
- [ ] Enable writes → `LIFEOS_WRITE_ENABLED=true`
- [ ] Allowed origin → `LIFEOS_ALLOWED_ORIGIN`
- [ ] Durable approvals → `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] Voice-session HMAC → `LIFEOS_VOICE_SESSION_SECRET`
- [ ] Optional paid TTS → `OPENAI_API_KEY`
- [ ] Paid-TTS authorization → `LIFEOS_TTS_SECRET` or intentionally reuse `LIFEOS_WRITE_SECRET`
- [ ] Optional ClickUp credentials
- [ ] Optional Slack credentials
- [ ] Optional n8n webhook
- [ ] Optional Vercel execution token/project ID
- [ ] Optional Hermes endpoint/token only when a real runtime exists

---

## Section I — Resource Intelligence boundary

The current `/inbox` Capture surface is **not yet** the full Universal Resource Intelligence system. Do not mark resource intake complete merely because browser-local capture works.

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| I1 | Browser-local disclosure | Capture a harmless note | UI explicitly says the item is stored in this browser only | ☐ | | |
| I2 | No false processor claim | Submit no external resource processor action | LifeOS does not pretend it classified/analyzed/stored a GitHub/YouTube/PDF resource when no processor exists | ☐ | | |
| I3 | Future acceptance gate | After Resource Intelligence is implemented, submit one controlled external repo | The end-to-end intake/classify/disposition/asset/store/verify flow must pass before this lane is marked mature | ☐ | | Future platform phase |

---

## Section J — Owner sign-off

| Field | Value |
|---|---|
| Production URL | `https://lifeos-enterprise.vercel.app/` |
| Verified deployment ID | `dpl_8YYkaeHeAQYsj2RzSVssYEYjgFmE` |
| Verified commit SHA | `46a2514893b4e3557911403274cba695b1c89384` |
| Owner name | |
| Date | |
| Overall result | ☐ READY TO ACCEPT · ☐ BLOCKED · ☐ NOT READY |
| Accepted deferrals | |
| Blockers | |

**Rule:** Green CI and a successful deployment are necessary evidence, not owner acceptance. Live microphone/screen interactions and any intentionally enabled write/paid-TTS integrations require owner verification on the actual production candidate.
