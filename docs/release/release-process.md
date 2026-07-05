# Release Process

## Overview

This document defines the LifeOS Enterprise release process — how changes move from specification to deployed product. All implementation repositories follow this process.

---

## Release Types

| Type | Cadence | Scope |
|------|---------|-------|
| Patch | As needed | Bug fixes, security patches, documentation |
| Minor | Bi-weekly | New features within current phase |
| Major | Per roadmap phase | New phase release with breaking potential |

---

## Version Numbering

LifeOS Enterprise uses [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

- `MAJOR`: Roadmap phase completion or breaking API change
- `MINOR`: New features, backward-compatible additions
- `PATCH`: Bug fixes, security patches, non-breaking improvements

---

## Release Pipeline

```
Spec Change (this repo)
        │
        ▼
Spec PR merged to main
        │
        ▼
Implementation PR opened (references spec commit SHA)
        │
        ▼
CI: tests pass + coverage met + security scan clean
        │
        ▼
Code review: minimum 1 approver (2 for major releases)
        │
        ▼
Implementation PR merged to main
        │
        ▼
Automated staging deployment
        │
        ▼
Smoke tests on staging
        │
        ▼
Release tag created (vMAJOR.MINOR.PATCH)
        │
        ▼
Production deployment (with approval gate for major releases)
        │
        ▼
Post-deploy health check
        │
        └── Pass: release announced
            Fail: automatic rollback triggered
```

---

## Deployment Environments

| Environment | Purpose | Branch |
|-------------|---------|--------|
| `local` | Developer sandbox | feature branch |
| `staging` | Pre-production validation | `main` (auto-deploy) |
| `production` | Live system | release tag |

---

## Rollback Policy

- **Patch/Minor:** Automated rollback if health checks fail within 10 minutes of deploy
- **Major:** Manual rollback decision required; rollback runbook must exist before deployment
- Database migrations: forward-only; rollback is a new migration

---

## Changelog

All releases include a changelog entry with:
- Version and date
- Summary of changes
- Breaking changes section (if any)
- Migration notes (if required)
- Security fixes (listed explicitly)

Changelog is maintained in `CHANGELOG.md` in each implementation repository.

---

## Release Approval

| Release Type | Approvers Required |
|-------------|-------------------|
| Patch | 1 (automated CI passes) |
| Minor | 1 human reviewer |
| Major | Operator sign-off + 2 technical reviewers |
| Security Patch (P1) | Emergency process: deploy immediately; review within 24h |

---

## Feature Flags

Features may be merged to `main` behind a feature flag before being fully released. This allows:
- Incremental rollout
- A/B testing
- Quick disable without rollback

Feature flags must be documented and have a defined expiry (maximum 2 sprints).

---

## Communication

| Audience | Channel | When |
|----------|---------|------|
| Internal team | Slack #releases | All releases |
| SaaS users (Phase 7+) | In-app notification + email | Minor and major releases |
| API consumers | Email + changelog | Any breaking change |

---

## Release Readiness Checklist

Before any production release:

- [ ] All spec changes merged and referenced in implementation PR
- [ ] CI pipeline passes (tests, coverage, linting, security scan)
- [ ] Changelog entry written
- [ ] Database migrations reviewed and tested on staging
- [ ] Rollback procedure documented (for major releases)
- [ ] Performance baselines verified on staging
- [ ] Security scan clean (OWASP ZAP, dependency audit)
- [ ] Feature flags toggled correctly for this release
- [ ] Monitoring dashboards updated for new metrics (if any)
- [ ] On-call team notified for major releases
