# PRD-007: SaaS Platform

**Status:** Draft
**Phase:** 7
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The SaaS Platform phase makes LifeOS Enterprise available to external operators without self-hosting. This phase adds multi-tenancy, billing, onboarding, and a marketplace for community-built MCP integrations.

---

## Goals

1. Multiple independent operators can use the platform on shared infrastructure with full data isolation
2. Self-serve onboarding completes in under 10 minutes
3. Billing is integrated with transparent pricing
4. Operators can publish and discover MCP integrations via a marketplace
5. Platform reliability meets SLA requirements for a commercial product

---

## User Stories

### Epic 1: Multi-Tenancy
- As a new operator, I can sign up and be productive within 10 minutes
- As an operator, I have complete confidence my data is isolated from other operators
- As a platform admin, I can provision, suspend, and audit any tenant

### Epic 2: Billing
- As an operator, I can choose a subscription plan that fits my usage
- As an operator, I receive usage-based billing with clear line items
- As an operator, I can manage my billing, invoices, and payment method in-app
- As an operator, I receive a 14-day free trial with no credit card required

### Epic 3: Onboarding
- As a new operator, the platform guides me through creating my first business unit, project, and task
- As a new operator, I can import data from common tools (Notion, Trello, ClickUp) during onboarding
- As a new operator, the first AI agent is configured for me automatically

### Epic 4: Marketplace
- As an operator, I can browse and install community MCP integrations
- As a developer, I can submit an MCP integration to the marketplace
- As an operator, installed marketplace integrations are sandboxed and permission-scoped
- As a platform admin, marketplace submissions are reviewed before publication

---

## Pricing Tiers (Draft)

| Tier | Business Units | Agents | Automations | Price |
|------|---------------|--------|-------------|-------|
| Solo | 3 | 3 | 20 | $49/mo |
| Operator | 10 | 10 | 100 | $149/mo |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

---

## Acceptance Criteria

### AC-001: Multi-Tenancy
- [ ] Tenant data isolation verified by security penetration test before launch
- [ ] Cross-tenant data leakage is tested with automated test suite (all tests pass)
- [ ] Tenant provisioning completes in < 30 seconds
- [ ] Tenant suspension is immediate and reversible within 90 days

### AC-002: Billing
- [ ] Billing powered by Stripe (subscription + metered usage)
- [ ] Failed payment triggers grace period of 7 days before suspension
- [ ] Data export available within 30 days of cancellation
- [ ] Billing dashboard shows current period usage vs. plan limits

### AC-003: Onboarding
- [ ] Onboarding completion rate target: > 70% of sign-ups complete first project creation
- [ ] Data importers supported: Notion, Trello, ClickUp CSV export
- [ ] Onboarding sequence A/B testable without code changes

### AC-004: Marketplace
- [ ] Marketplace MCP integrations run in isolated execution environment
- [ ] Each integration declares required scopes; operator approves before install
- [ ] Integration review SLA: 5 business days from submission to approval/rejection
- [ ] Marketplace search returns results by category, popularity, and recency

---

## SLA Requirements

| Metric | Target |
|--------|--------|
| Platform availability | 99.9% monthly uptime |
| API P95 response time | < 200ms |
| Incident response (P1) | < 1 hour |
| Data backup frequency | Every 6 hours |
| RTO | < 4 hours |
| RPO | < 1 hour |
