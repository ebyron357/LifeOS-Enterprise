# LifeOS — Health Scoring

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

The Health Scoring framework defines how the Execution Engine measures the operational health of every dimension of LifeOS. Scores are never fabricated — every score is computed deterministically from metadata fields in canonical module sources. Scores surface in the Command Center and Review Engine to give the operator an accurate, real-time picture of system health.

---

## Scoring Principles

1. **Metadata-only** — Scores are computed from existing metadata fields. No manual inputs.
2. **Deterministic** — The same metadata always produces the same score.
3. **Traceable** — Every score value can be traced to the specific fields that produced it.
4. **Non-prescriptive** — Scores describe current state. Thresholds for "good" vs. "bad" are operator-configured.
5. **Composable** — Sub-scores combine into aggregate scores without double-counting.

---

## Score Definitions

### 1. Execution Score

**What it measures:** How well the operator is executing against active work.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Deliverables completed on time | `deliverables[].status == Done` AND `due_date` ≥ completion date | High |
| Projects with a defined `next_action` | `next_action` non-empty | Medium |
| Active projects updated in the last 7 days | `updated` within 7 days | Medium |
| Review cadence completion | Review records in `/command-center/` | High |
| Open blockers | Blocker Engine output | Negative |
| Overdue deliverables | `due_date` < today AND `status != Done` | Negative |

**Formula:**
```
execution_score =
  (deliverables_on_time / total_deliverables_due) × 40
  + (projects_with_next_action / active_projects) × 20
  + (projects_updated_recently / active_projects) × 20
  + (reviews_on_time / reviews_scheduled) × 20
  - (open_blockers × 5)
  - (overdue_deliverables × 3)
```

**Range:** 0–100 (capped)

---

### 2. Knowledge Score

**What it measures:** The breadth, depth, and quality of the operator's knowledge base.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Total active knowledge objects | `status == Active` count | Base |
| Objects with `confidence >= 0.8` | `confidence` field | High |
| Objects linked to at least one project | `projects[]` non-empty | Medium |
| Objects reviewed in the last 90 days | `updated` within 90 days | Medium |
| Objects with `status == Needs Review` | `status == Needs Review` | Negative |
| Objects with no `sources[]` | `sources` empty | Negative |

**Formula:**
```
knowledge_score =
  min(active_objects / 50, 1) × 30
  + (high_confidence_objects / active_objects) × 25
  + (linked_objects / active_objects) × 25
  + (recently_reviewed / active_objects) × 20
  - (needs_review_objects × 2)
  - (unsourced_objects × 1)
```

**Range:** 0–100 (capped)

---

### 3. Automation Score

**What it measures:** The reliability and coverage of the automation layer.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Active automations count | `status == Active` count | Base |
| Automation success rate (last 30 days) | `last_run_status == Success` / total runs | High |
| Automations with 0 consecutive failures | `consecutive_failures == 0` | High |
| Automations not run in 14+ days | `last_run` older than 14 days | Negative |
| Automations with no `target_id` | orphaned automations | Negative |

**Formula:**
```
automation_score =
  min(active_automations / 10, 1) × 20
  + (success_rate) × 50
  + (healthy_automations / active_automations) × 30
  - (stale_automations × 3)
  - (orphaned_automations × 5)
```

**Range:** 0–100 (capped)

---

### 4. Business Health Score

**What it measures:** The operational and strategic health of a specific business.

**Computed per business** (`BIZ-XXXX`).

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| KPIs on track (actual ≥ target) | `kpis[]` comparison | High |
| Active projects count | `projects[]` with `status == Active` | Medium |
| Open High-severity risks | Linked `Risk.schema.json` with `severity == High` | Negative |
| Proposed unresolved decisions | Linked decisions with `status == Proposed` | Negative |
| Agent assigned | `ai_owner` non-empty | Low |
| Business updated in last 30 days | `updated` within 30 days | Low |

**Formula:**
```
business_health =
  (kpis_on_track / total_kpis) × 40
  + (has_active_projects ? 20 : 0)
  + (agent_assigned ? 10 : 0)
  + (updated_recently ? 10 : 0)
  + min(active_projects / 5, 1) × 20
  - (open_high_risks × 8)
  - (unresolved_decisions × 5)
```

**Range:** 0–100 (capped)

---

### 5. Repository Health Score

**What it measures:** The activity and quality signal of a GitHub repository.

**Computed per repository**.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Days since last commit | `last_commit` | High |
| Open PR age | PRs with `created` > 7 days ago | Medium |
| Open issue count | `open_issues` total | Medium |
| CI pass rate (last 30 days) | CI status fields | High |
| Has README and documentation | Repository metadata | Low |

**Formula:**
```
repository_health =
  freshness_score(days_since_commit)   // 100 if < 7d, 75 if < 30d, 50 if < 90d, 0 if > 90d
  + (ci_pass_rate × 40)
  - min(stale_prs × 5, 20)
  - min(open_issues / 10 × 10, 20)
  + (has_documentation ? 10 : 0)
```

**Range:** 0–100 (capped)

---

### 6. Documentation Health Score

**What it measures:** How well the system is documented.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Modules with complete READMEs | README completeness check | High |
| Schemas with descriptions on all fields | Schema metadata | Medium |
| Knowledge objects with sources | `sources[]` non-empty | Medium |
| SOPs for critical processes | `/sops/` coverage | Medium |
| Stale documentation | `updated` > 90 days old | Negative |

**Formula:**
```
documentation_health =
  (complete_readmes / total_modules) × 30
  + (documented_schemas / total_schemas) × 20
  + (sourced_knowledge / total_knowledge) × 20
  + (sop_coverage_score) × 20
  + (current_docs / total_docs) × 10
```

**Range:** 0–100 (capped)

---

### 7. Project Health Score

**What it measures:** The health of a specific project.

**Computed per project** (`PRJ-XXXX`).

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Has `next_action` defined | `next_action` non-empty | High |
| No overdue deliverables | All `due_date` ≥ today | High |
| Updated in last 7 days | `updated` within 7 days | Medium |
| No open High risks | Linked risks | Negative |
| No unresolved decisions | `decisions[]` with `Proposed` | Negative |
| Has assigned agent | `ai_owner` non-empty | Low |
| Review date not overdue | `review_date` ≥ today | Medium |

**Formula:**
```
project_health =
  (has_next_action ? 25 : 0)
  + (no_overdue_deliverables ? 25 : 0)
  + (updated_recently ? 20 : 0)
  + (review_not_overdue ? 15 : 0)
  + (has_agent ? 10 : 0)
  + (has_deliverables ? 5 : 0)
  - (open_high_risks × 10)
  - (unresolved_decisions × 8)
```

**Range:** 0–100 (capped)

---

### 8. AI Usage Score

**What it measures:** How actively AI agents are being leveraged across the system.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Agents with tasks in the last 7 days | Agent activity logs | High |
| Knowledge objects with `ai_usage[]` entries | `ai_usage` non-empty | Medium |
| Projects with assigned `ai_owner` | `ai_owner` field | Medium |
| Agent escalations resolved | Resolved escalation records | Medium |
| Multi-agent workflows completed | Workflow records | High |

**Formula:**
```
ai_usage_score =
  (active_agents / total_agents) × 30
  + (knowledge_with_ai_usage / total_knowledge) × 20
  + (projects_with_ai_owner / active_projects) × 30
  + min(multi_agent_workflows_this_month × 5, 20)
```

**Range:** 0–100 (capped)

---

### 9. Decision Velocity Score

**What it measures:** How quickly the operator moves decisions from `Proposed` to `Final`.

**Inputs:**

| Signal | Source Field | Weight |
|--------|-------------|--------|
| Average days to resolve decisions (last 90 days) | `date` - creation date | High |
| Decisions resolved this month | `status == Final` this month | High |
| Decisions open > 14 days | `status == Proposed` AND age > 14 days | Negative |

**Formula:**
```
decision_velocity_score =
  resolution_speed_score(avg_days_to_resolve)   // 100 if < 3d, 75 if < 7d, 50 if < 14d, 25 if < 30d
  + min(decisions_resolved_this_month × 5, 30)
  - (stale_open_decisions × 10)
```

**Range:** 0–100 (capped)

---

## Aggregate Scores

The following aggregate scores roll up from the component scores above:

| Aggregate Score | Components | Formula |
|----------------|------------|---------|
| **System Health** | All 9 scores | Weighted average |
| **Operator Performance** | Execution + Decision Velocity + Review Cadence | Equal weight |
| **Business Portfolio Health** | All Business Health Scores | Average across all businesses |
| **Technology Health** | Repository Health + Automation Score | Equal weight |
| **Knowledge Capital** | Knowledge Score + Documentation Health | Equal weight |

---

## Health Score Display

Scores are displayed in the Command Center with thresholds:

| Score Range | Label | Visual |
|-------------|-------|--------|
| 85–100 | Excellent | 🟢 |
| 70–84 | Good | 🟡 |
| 50–69 | Needs Attention | 🟠 |
| 0–49 | At Risk | 🔴 |

Default thresholds. Operators can configure their own thresholds per score.

---

## Future Extensions

- **Trend tracking** — Score history stored daily; trend lines shown in dashboards
- **Threshold alerts** — Push notification when any score drops below configured threshold
- **Benchmark comparison** — Compare your scores to the LifeOS operator community baseline (opt-in)
- **API endpoint** — `GET /api/health` returns all current scores with source breakdowns
- **Operator-configured weights** — Allow operators to adjust formula weights to match their priorities
