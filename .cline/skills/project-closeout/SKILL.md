---
name: project-closeout
description: "Close a software project or release with canonical-lane reconciliation, continuous QC, production verification, evidence, learning capture, and owner boundaries. Triggers: close out project, release readiness, final verification, merge ready, production complete."
---

# Project Closeout

**Status:** Draft — must pass repeatability QC before being treated as an approved organizational skill.

Use this skill when a software project, release, or major implementation is approaching completion and needs evidence-based closeout rather than an agent assertion.

## Purpose

Take one canonical implementation lane from current verified state through tests, independent verification, production proof, learning capture, and a defensible final status.

## Prerequisites

Identify:

- canonical repository and branch/PR;
- governing requirements/design/playbook;
- current verified state;
- competing branches/PRs or duplicate implementation lanes;
- required external services/credentials;
- accountable owner;
- independent examiner/auditor where applicable;
- definition of done.

If two implementation lanes are competing, reconcile them before release certification.

## Procedure

Apply only the checks relevant to the project, but never skip a required gate silently.

1. Identify the canonical repository, branch, and release candidate.
2. Reconcile competing branches/PRs; preserve unique valid work before closing or superseding another lane.
3. Install/restore dependencies from a clean state where practical.
4. Run typecheck/static checks.
5. Run lint/format policy checks.
6. Run unit tests.
7. Run integration tests.
8. Build the production candidate.
9. Run browser smoke on critical user journeys.
10. Run responsive/mobile QA.
11. Run accessibility QA.
12. Run typography/design consistency checks where applicable.
13. Crawl routes/links.
14. Validate forms/APIs and failure paths.
15. Run security/dependency checks.
16. Run performance checks where required.
17. Run SEO/structured-data checks for public web products where required.
18. Test external providers when credentials and authorization exist.
19. Run independent audit/release assurance; the builder does not self-certify.
20. Assemble the evidence pack.
21. Resolve material findings.
22. Re-audit the fresh candidate after fixes.
23. Stop for owner approval when governance requires it.
24. Merge only when required checks/evidence/approvals permit.
25. Deploy only when authorized.
26. Verify the exact production SHA/version/deployment identity.
27. Run production smoke against real critical journeys.
28. Record the business result and remaining known limitations.
29. Record QC, important decisions, and failures/lessons.
30. Evaluate whether the work should create or update an AI Skill, Human Lesson, Teaching Guide, SOP, Automation, Failure Library record, Decision Library record, Capability Map entry, or playbook.
31. Record ROI/value created.
32. Update the living playbook/journey log as one canonical replacement when operating rules changed.
33. Close only when the required outcome exists and evidence proves it.

## Evidence Package

Include applicable:

- canonical repository/branch/PR
- candidate and merge commit SHAs
- CI/check run links/results
- test summaries
- browser evidence
- accessibility/security/performance evidence
- deployment ID and deployed SHA/version
- API/database/webhook evidence
- owner approval where required
- independent audit result
- unresolved known limitations
- rollback/recovery notes

## Stop Conditions

Stop and label the correct boundary when:

- canonical source or branch is unresolved;
- a material required check fails;
- an unresolved material review/audit finding remains;
- production credentials/MFA/owner approval are required and unavailable;
- legal/licensing/compliance uncertainty is material;
- evidence does not prove the claimed result;
- deployment identity cannot be verified;
- a destructive action would exceed authorization.

Use `OWNER ACTION` for genuine owner-only boundaries instead of calling the engineering incomplete.

## Required Final Report

```text
STATUS: VERIFIED COMPLETE | READY FOR OWNER | FAILED QC | OWNER-BLOCKED | CODE-BLOCKED
CANONICAL REPO / BRANCH / PR:
CANDIDATE SHA:
MERGED SHA:
DEPLOYMENT / PRODUCTION SHA:
CHECKS:
BROWSER / E2E:
SECURITY / ACCESSIBILITY / PERFORMANCE:
INDEPENDENT AUDIT:
OWNER ACTIONS:
KNOWN LIMITATIONS:
EVIDENCE:
LESSONS / SKILL / SOP / AUTOMATION CANDIDATES:
ROI / VALUE:
NEXT ACTION:
```

## Decision Rules

- A passing build is not a production certificate.
- An open PR is not implemented capability.
- A READY deployment is not the same as a verified user journey.
- Do not resolve review findings until the fix is present and checked.
- Do not delete legacy/duplicate lanes until unique assets and required history are verified.
- Production verification must identify the exact deployed candidate.

## Verification

The skill passes on a project only when another reviewer can trace the claimed final state to concrete evidence and can distinguish completed engineering from owner-only or external blockers.

## Skill QC Gate

Keep this skill **Draft** until:

1. another agent uses it on a real project closeout;
2. the project either reaches a correctly evidenced final state or stops at the correct explicit boundary;
3. an independent reviewer confirms the closeout did not overstate completion and preserved reusable lessons/evidence.
