# Businesses

## Overview

LifeOS Enterprise serves three initial business units. Each business unit has its own context, domain model extensions, and operational requirements — all built on the shared core platform.

---

## Business Units

| Business | Domain | Module |
|----------|--------|--------|
| [TradeIQ](TradeIQ/overview.md) | Trading intelligence and strategy management | Phase 5 |
| [Alternative](Alternative/overview.md) | Alternative investment deal management | Phase 5 |
| [ClientVerse](ClientVerse/overview.md) | Client project delivery | Phase 5 |

---

## Shared Principles Across Business Units

- Each business unit's data is fully isolated from the others
- Contacts may be shared across business units via explicit cross-linking (with audit log)
- All business units use the same core entity schemas, extended with domain-specific fields
- Business unit-specific features are defined in [PRD-005](../docs/product/prd/PRD-005-business-modules.md)
