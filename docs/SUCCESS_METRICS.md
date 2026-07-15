# LifeOS — Success Metrics

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Philosophy

**Measure what matters. Nothing else.**

Every metric in LifeOS exists because it answers a question that drives a decision. Metrics without decisions are noise. LifeOS does not fabricate numbers, track vanity metrics, or measure things that cannot be acted upon.

All metrics follow three rules:
1. **Directional** — does it go up or down over time?
2. **Actionable** — if it moves the wrong way, what do you do?
3. **Honest** — can it be gamed or inflated artificially? If yes, redesign it.

---

## Metric Categories

LifeOS tracks metrics across ten dimensions. Each dimension has a primary metric (the single most important number), supporting metrics (context for the primary), and health thresholds (what triggers a review).

---

## 1. Daily Active Usage

**What it measures:** Whether LifeOS is actually being used as an operating system, not just a filing cabinet.

**Why it matters:** A system that isn't used daily isn't providing leverage. Daily usage is the foundational proof that LifeOS is embedded in the operator's workflow.

### Primary Metric
`Days with Command Center opened / Days in period`  
→ Target: ≥ 80% of working days

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Daily briefing generated | Days the Chief of Staff agent produced a briefing | Proxy for system engagement |
| Daily decisions logged | Count of decision records created per day | Signals active thinking in-system |
| Daily project updates | Count of project files modified per day | Signals execution happening in-system |
| Time in system per session | Estimated session duration | Too short = surface use; optimal = 10–30 min/day |

### Health Thresholds
- 🟢 Healthy: ≥ 80% daily usage rate
- 🟡 Watch: 60–79% — investigate friction or habit gaps
- 🔴 Critical: < 60% — system is not embedded; root cause review required

---

## 2. Weekly Reviews Completed

**What it measures:** Whether the operator is maintaining the system's integrity through regular review.

**Why it matters:** A weekly review is the minimum viable maintenance cadence. Without it, the system drifts: stale projects, forgotten decisions, dead knowledge. Completion rate is a leading indicator of long-term system health.

### Primary Metric
`Weekly reviews completed / Weeks in period`  
→ Target: 100% (one per week, no exceptions)

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Review duration | Time to complete weekly review | Too short = incomplete; optimal = 45–90 min |
| Projects reviewed per review | Count of projects touched during review | Low count = review is superficial |
| Knowledge objects created per review | Count of knowledge objects logged post-review | Signals learning capture happening |
| Decisions cleared per review | Decisions finalized during weekly session | Measures decision debt clearance |

### Health Thresholds
- 🟢 Healthy: 4 of 4 reviews completed per month
- 🟡 Watch: 3 of 4 — identify which week was missed and why
- 🔴 Critical: < 3 of 4 — system maintenance is failing; risk of drift

---

## 3. Project Execution Health

**What it measures:** Whether projects are moving, healthy, and producing outcomes.

**Why it matters:** Projects are the primary unit of execution. If projects stall, LifeOS is failing at its core job. This metric tracks the quality of execution, not just the quantity of projects.

### Primary Metric
`Projects with a next action defined / Total active projects`  
→ Target: 100% at all times

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Projects completed per month | Count of projects reaching "Completed" status | Direct outcome measure |
| Average days from creation to first completion | Time to first deliverable | Measures execution velocity |
| Projects overdue (past review date) | Count of projects past their review date | Stale projects are invisible risks |
| Blocked project rate | Active projects with no progress in 14+ days | Signals unresolved dependencies |
| Deliverable completion rate | Deliverables Done / Total Deliverables (active projects) | Measures execution within projects |
| Decision-to-action rate | Decisions logged that result in a new project/task | Measures decisiveness |

### Health Thresholds
- 🟢 Healthy: 100% next action coverage; < 10% blocked; review dates current
- 🟡 Watch: Any projects without next action; > 15% blocked
- 🔴 Critical: > 20% of active projects have no next action or overdue review

---

## 4. Knowledge Growth

**What it measures:** Whether the knowledge engine is actually growing and being used.

**Why it matters:** Knowledge is LifeOS's compound asset. If knowledge isn't growing, the system isn't learning. If it isn't being consumed by agents, it isn't creating leverage. Both dimensions matter.

### Primary Metric
`Net new knowledge objects per week`  
→ Target: ≥ 3 new objects per week (minimum sustainable growth)

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Total knowledge objects | Running count | Volume baseline |
| Average confidence score | Mean confidence across all active objects | Quality signal |
| Domain coverage | Count of domains with ≥ 5 objects | Breadth signal |
| Objects linked to projects | Knowledge objects with ≥ 1 project link | Relevance signal |
| AI consumption rate | Knowledge objects consumed by agents in last 30 days | Utilization signal |
| Objects needing review | Objects with confidence < 0.5 or last updated > 90 days | Quality debt signal |
| Knowledge-to-decision ratio | Decisions informed by a knowledge object / Total decisions | Institutional learning signal |

### Health Thresholds
- 🟢 Healthy: ≥ 3 objects/week; ≥ 60% linked to projects; ≥ 30% consumed by agents
- 🟡 Watch: 1–2 objects/week; < 50% linked; low agent consumption
- 🔴 Critical: 0 new objects in 2+ weeks; knowledge engine is stagnant

---

## 5. Automation Coverage

**What it measures:** How much of the repeatable work in LifeOS has been automated.

**Why it matters:** Every hour saved by automation is an hour of leverage. Automation coverage measures the percentage of recurring processes that have been removed from the operator's manual workload.

### Primary Metric
`Active automations with 0% error rate in last 7 days / Total active automations`  
→ Target: ≥ 90% healthy automations at all times

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Total active automations | Count of running automation rules | Scale signal |
| Automation run frequency | Average runs per automation per week | Utilization signal |
| Estimated time saved per week | Self-reported or calculated time savings | ROI signal |
| Error rate | Failed runs / Total runs (last 30 days) | Quality signal |
| Automations added per month | New automations deployed | Growth signal |
| Manual tasks eliminated | Processes that were manual, now automated | Outcome signal |

### Health Thresholds
- 🟢 Healthy: ≥ 90% healthy; error rate < 5%; ≥ 1 new automation per month
- 🟡 Watch: 80–89% healthy; error rate 5–10%
- 🔴 Critical: < 80% healthy; error rate > 10%; no new automations in 30 days

---

## 6. Agent Utilization

**What it measures:** Whether AI agents are being actively used and producing value.

**Why it matters:** Configured but idle agents provide no value. This metric ensures agents are earning their configuration investment by completing real tasks.

### Primary Metric
`Agents with ≥ 1 task completed in last 7 days / Total configured agents`  
→ Target: ≥ 80% of agents active weekly

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Tasks completed per agent per week | Count by agent | Individual utilization |
| Escalation rate per agent | Escalations / Total tasks (per agent) | Quality signal: too high = undertrained |
| Average task duration | Minutes per task (per agent) | Efficiency signal |
| Agent accuracy rate | Operator-approved outputs / Total outputs | Quality signal |
| Cross-agent handoffs | Tasks passed between agents | Orchestration signal |
| New knowledge objects created by agents | Knowledge created as agent output | Intelligence signal |

### Health Thresholds
- 🟢 Healthy: ≥ 80% agents active; escalation rate < 15%; accuracy rate ≥ 85%
- 🟡 Watch: 60–79% agents active; escalation rate 15–25%
- 🔴 Critical: < 60% agents active; any agent with > 30% escalation rate

---

## 7. Repository Health

**What it measures:** The health of the LifeOS repository itself as a software system.

**Why it matters:** LifeOS is a file-based platform. If the repository structure is inconsistent, files are missing schemas, or templates are not being used, the system degrades into the chaos it was designed to prevent.

### Primary Metric
`Files conforming to schema / Total schema-eligible files`  
→ Target: 100% schema conformance at all times

### Supporting Metrics
| Metric | Definition | Why |
|--------|-----------|-----|
| Orphaned files | Files not linked from any parent | Structural hygiene |
| Missing README files | Module directories without README | Documentation coverage |
| Template usage rate | Objects created from template / Total objects | Consistency signal |
| Stale files | Files not updated in > 90 days | Maintenance signal |
| Naming convention violations | Files not matching NAMING_CONVENTIONS.md | Standards adherence |
| Schema validation failures | Files failing JSON schema validation | Data integrity signal |

### Health Thresholds
- 🟢 Healthy: 100% schema conformance; 0 orphaned files; all READMEs present
- 🟡 Watch: > 1 schema violation; any orphaned files; any missing READMEs
- 🔴 Critical: > 5% schema violations; > 10 orphaned files

---

## 8. Business Health

**What it measures:** The operational health of each business managed in LifeOS.

**Why it matters:** LifeOS exists to help businesses succeed. Business Health is the ultimate outcome metric — everything else (agents, knowledge, projects, automation) is in service of business performance.

### Primary Metric
`Business Health Score`  
A composite score (0–100) calculated from sub-metrics below.  
→ Target: ≥ 70 for each active business

### Score Components
| Component | Weight | Metric |
|-----------|--------|--------|
| KPI trajectory | 25% | Are primary KPIs trending in the right direction? |
| Project execution | 20% | Are projects completing on time with defined next actions? |
| Risk management | 15% | Are open risks being actively mitigated? |
| Decision velocity | 15% | Are decisions being made and logged promptly? |
| AI utilization | 15% | Are agents actively working on this business? |
| Documentation completeness | 10% | Are all business sub-modules documented and current? |

*Note: No numeric scores are fabricated. This framework defines what to measure; actual values emerge from real data.*

### Health Thresholds
- 🟢 Healthy: Score ≥ 70
- 🟡 Watch: Score 50–69 — identify weakest components and address
- 🔴 Critical: Score < 50 — business needs immediate operator attention

---

## 9. Execution Score

**What it measures:** How effectively the operator is converting priority into outcome — the most important measure of whether LifeOS is working.

**Why it matters:** Execution Score is the headline metric for the entire platform. It answers: "Is this person more effective because of LifeOS than they would be without it?"

### Primary Metric
`Execution Score`  
A composite 0–100 score calculated weekly.  
→ Target: Improving trend over rolling 4-week period

### Score Components
| Component | Weight | Signal |
|-----------|--------|--------|
| Top 3 weekly priorities completed | 30% | Are the most important things getting done? |
| Zero projects without next action | 20% | Is nothing stuck? |
| Weekly review completed | 15% | Is the system being maintained? |
| Decisions cleared same week as created | 15% | Is the operator decisive? |
| Agents completing tasks without escalation | 10% | Is the AI layer effective? |
| New knowledge objects captured | 10% | Is the operator investing in institutional learning? |

### Interpretation
The Execution Score is not a grade. It is a trend. An operator who goes from 45 to 65 over 8 weeks is doing exactly what LifeOS is designed to produce. An operator stuck at 80 may be gaming the metric, or they may have reached their optimization ceiling.

### Health Thresholds
- 🟢 Healthy: Score ≥ 70; improving trend
- 🟡 Watch: Score 50–69; flat trend
- 🔴 Critical: Score < 50; or declining trend over 3+ weeks

---

## 10. System Health

**What it measures:** The overall health of the LifeOS platform itself — its coverage, integrity, and operational fitness.

**Why it matters:** The system that measures everything else must itself be measured. System Health ensures that LifeOS is not quietly degrading while the operator is focused elsewhere.

### Primary Metric
`System Health Score`  
Composite 0–100 across all nine dimensions above.  
→ Target: ≥ 75 overall; no single dimension in 🔴 Critical

### Score Composition
| Dimension | Weight |
|-----------|--------|
| Repository Health | 15% |
| Documentation Coverage | 15% |
| Automation Coverage | 15% |
| Agent Utilization | 15% |
| Knowledge Growth | 15% |
| Project Execution | 10% |
| Business Health (avg) | 10% |
| Weekly Review Rate | 5% |

### Health Thresholds
- 🟢 Healthy: ≥ 75; no dimension in 🔴
- 🟡 Watch: 60–74; or one dimension in 🔴
- 🔴 Critical: < 60; or two or more dimensions in 🔴

---

## Metrics Anti-Patterns

The following should never be used as success metrics in LifeOS:

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Total files created | Can be gamed by creating empty files |
| Total words written | Volume without quality |
| Total agents configured | Configured ≠ active ≠ useful |
| Number of MCP connectors installed | Installed ≠ working ≠ adding value |
| Number of automations created | Automations that never run waste maintenance bandwidth |
| Total knowledge objects (without confidence/usage) | Quantity without quality or utilization |

---

## Metric Review Cadence

| Metric | Review Frequency | By Whom |
|--------|-----------------|---------|
| Daily Active Usage | Weekly (in weekly review) | Operator |
| Weekly Reviews Completed | Monthly (in monthly review) | Operator |
| Project Execution Health | Weekly (in weekly review) | Operator + PM Agent |
| Knowledge Growth | Weekly (in weekly review) | Operator + Knowledge Engineer Agent |
| Automation Coverage | Biweekly | Automation Architect Agent |
| Agent Utilization | Weekly | Operator |
| Repository Health | Monthly | Operator |
| Business Health | Monthly (per business) | Operator + Chief of Staff Agent |
| Execution Score | Weekly | Chief of Staff Agent auto-generates |
| System Health | Monthly | Chief of Staff Agent auto-generates |

---

*This document defines what to measure. Actual measured values are produced by the Health System in `/health/`. Do not fabricate numbers in this document.*
