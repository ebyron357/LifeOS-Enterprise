# Project Repository Registry

Last updated: 2026-07-08

Purpose: reduce duplicate GitHub confusion by defining **one active repo per project** and moving everything else into archive/reference status.

## Rule

One project = one active GitHub repo = one production folder = one START_HERE file.

Do not open archive/reference repos unless the active repo is missing a specific asset.

---

## Packaging Projects

| Project | Active repo | Status | Why this repo is active | Archive / reference repos |
|---|---|---|---|---|
| ALTERNATIVE 12 oz beverage labels | `ebyron357/12oz` | ACTIVE | Contains the 12 oz sleek can production system, SKU files, brand assets, codes, exports, release scripts, and release dashboard. | `ebyron357/ALT-Label-System`, `ebyron357/alternative-packaging-system`, `ebyron357/alternative-passionFruit-production`, `ebyron357/alternative-lychee-sweet-tea` |
| ALT syrup labels | `ebyron357/alt-syrup-labels` | ACTIVE / RECOVERY | Contains the syrup asset inventory and known status. Current issue: final release files are not confirmed in hand. | `ebyron357/ALT-Syrup-Label-System` |
| Bravo Paws labels | `ebyron357/ebyron357-BravoPaws-Official` | ACTIVE | Contains current Bravo requirements, project status, asset inventory, and Illustrator automation scripts. | `ebyron357/Bravo-Labels-`, `ebyron357/Bravofinal` |

---

## Other Active Project Repos

| Project | Active repo | Notes |
|---|---|---|
| Jasmine Parker / Allure Realty website | `ebyron357/charlotte-real-estate-system` | Active real estate platform repo. |
| TradeIQ | `ebyron357/tradeiq-command-center` | Active TradeIQ command center repo. |
| Staxx / Shopify client work | `ebyron357/project-reconstruction` | Active client store reconstruction repo unless replaced by confirmed Shopify-native repo. |
| Life OS | `ebyron357/LifeOS-Enterprise` | System-level registry and operations repo. |

---

## Do Not Use As Active Unless Specifically Needed

These repos create focus noise and should be treated as archive/reference until inspected for missing assets:

- `ebyron357/ALT-Label-System`
- `ebyron357/alternative-packaging-system`
- `ebyron357/alternative-passionFruit-production`
- `ebyron357/alternative-lychee-sweet-tea`
- `ebyron357/ALT-Syrup-Label-System`
- `ebyron357/Bravo-Labels-`
- `ebyron357/Bravofinal`
- `ebyron357/12oz` remains active only for ALTERNATIVE beverage labels, not syrup labels.

---

## Current Focus Order

1. Wrap Bravo Paws labels in `ebyron357/ebyron357-BravoPaws-Official`.
2. Recover or rebuild ALT syrup final files from `ebyron357/alt-syrup-labels`.
3. Finish ALTERNATIVE 12 oz beverage print readiness in `ebyron357/12oz`.
4. Archive or rename duplicate repos only after confirming no unique assets are missing.

---

## Success Check

You are done cleaning focus when:

- Every project has one active repo listed here.
- Duplicate repos are not opened during daily work.
- Each active repo has a `START_HERE.md` file.
- Final production files are stored only in the active repo or clearly linked from it.
