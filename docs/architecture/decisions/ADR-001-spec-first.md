# ADR-001: Specification-First Development

**Status:** Accepted
**Date:** 2026-07-05
**Deciders:** LifeOS Enterprise founding team

---

## Context

LifeOS Enterprise spans multiple implementation repositories (web app, mobile app, API, agents, integrations). Without a single source of truth, implementation decisions drift, APIs become inconsistent, and the product vision fragments across teams.

## Decision

This repository (`LifeOS-Enterprise`) is the **canonical specification repository**. It contains no application code. All implementation repositories must reference it as their source of truth.

Changes to the product — new features, changed schemas, revised standards — are proposed and ratified here before implementation begins.

## Consequences

**Positive:**
- Single source of truth for product intent
- API and data schemas are defined before implementation, reducing rework
- New engineers can understand the full system by reading one repository
- AI agents can be given the full specification as context

**Negative:**
- Requires discipline to keep spec and implementation in sync
- Additional process step (spec change → implementation) adds lead time for small changes

## Mitigations

- Lightweight change process for minor spec updates (single-reviewer PR)
- Specification versioning aligns with product releases
- Implementation repositories reference spec by commit SHA or release tag
