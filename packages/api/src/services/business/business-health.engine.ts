/**
 * Business Health Engine
 *
 * Computes a 0–100 health score for a business based on weighted dimensions:
 * - Project health (30%): active vs. stale/blocked projects
 * - KPI performance (25%): on-track vs. at-risk/off-track KPIs
 * - Agent activity (15%): active agents performing tasks
 * - Automation reliability (15%): automations running without failures
 * - Knowledge coverage (10%): knowledge objects linked to business
 * - Repository health (5%): linked GitHub repositories health
 *
 * All weights are configurable via @lifeos/config.
 */
import { businessEngineConfig } from '@lifeos/config'
import type { BusinessHealthScore, BusinessRecord, HealthScoreDimension, KPIRecord } from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectSignals {
  total: number
  active: number
  stale: number // no update in >14 days
  blocked: number
  overdue: number
  completed_this_month: number
}

export interface AgentSignals {
  total_active: number
  tasks_completed_this_week: number
  escalations_this_week: number
  error_rate: number // 0-1
}

export interface AutomationSignals {
  total_active: number
  success_rate_30d: number // 0-1
  consecutive_failures: number
  runs_last_7d: number
}

export interface KnowledgeSignals {
  total_linked: number
  needs_review: number
  recently_added: number // last 30 days
}

export interface RepositorySignals {
  total_linked: number
  healthy: number
  stale: number
  at_risk: number
  avg_days_since_commit: number
}

export interface BusinessHealthInputs {
  business: BusinessRecord
  projects: ProjectSignals
  agents: AgentSignals
  automations: AutomationSignals
  knowledge: KnowledgeSignals
  repositories: RepositorySignals
  kpis: KPIRecord[]
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class BusinessHealthEngine {
  private readonly weights = businessEngineConfig.healthScoreWeights
  private readonly thresholds = businessEngineConfig.healthScoreThresholds

  compute(inputs: BusinessHealthInputs): BusinessHealthScore {
    const dimensions: HealthScoreDimension[] = [
      this.scoreProjectHealth(inputs.projects),
      this.scoreKPIPerformance(inputs.kpis),
      this.scoreAgentActivity(inputs.agents),
      this.scoreAutomationReliability(inputs.automations),
      this.scoreKnowledgeCoverage(inputs.knowledge),
      this.scoreRepositoryHealth(inputs.repositories),
    ]

    const overall_score = Math.round(
      dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
    )

    const recommendations = this.buildRecommendations(dimensions, overall_score)

    return {
      entity_type: 'business',
      entity_id: inputs.business.business_key,
      overall_score,
      label: this.scoreLabel(overall_score),
      dimensions,
      recommendations,
      requires_attention: overall_score < this.thresholds.fair || this.hasAttentionFlag(dimensions),
      computed_at: new Date().toISOString(),
    }
  }

  private scoreProjectHealth(p: ProjectSignals): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (p.total === 0) {
      return {
        name: 'project_health',
        score: 50,
        weight: this.weights.project_health,
        contributing_factors: ['No projects linked to this business'],
        flags: [],
      }
    }

    let score = 100

    // Penalise stale projects heavily
    const stalePct = p.stale / p.total
    if (stalePct > 0.5) {
      score -= 40
      flags.push(`${p.stale} of ${p.total} projects are stale`)
    } else if (stalePct > 0.25) {
      score -= 20
      flags.push(`${p.stale} projects have not been updated recently`)
    }

    // Penalise blocked projects
    const blockedPct = p.blocked / p.total
    if (blockedPct > 0.3) {
      score -= 25
      flags.push(`${p.blocked} projects are blocked`)
    } else if (blockedPct > 0.1) {
      score -= 10
    }

    // Penalise overdue
    if (p.overdue > 0) {
      score -= Math.min(20, p.overdue * 5)
      flags.push(`${p.overdue} projects are past their review date`)
    }

    // Reward completions
    if (p.completed_this_month > 0) {
      score = Math.min(100, score + 10)
      contributing_factors.push(`${p.completed_this_month} projects completed this month`)
    }

    if (p.active > 0) {
      contributing_factors.push(`${p.active} active projects`)
    }

    return {
      name: 'project_health',
      score: Math.max(0, score),
      weight: this.weights.project_health,
      contributing_factors,
      flags,
    }
  }

  private scoreKPIPerformance(kpis: KPIRecord[]): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (kpis.length === 0) {
      return {
        name: 'kpi_performance',
        score: 0,
        weight: this.weights.kpi_performance,
        contributing_factors: ['No KPIs defined for this business'],
        flags: ['No KPIs configured — business health cannot be measured accurately'],
      }
    }

    const set = kpis.filter((k) => k.status !== 'not_set')
    if (set.length === 0) {
      return {
        name: 'kpi_performance',
        score: 30,
        weight: this.weights.kpi_performance,
        contributing_factors: ['KPIs defined but no current values set'],
        flags: ['KPI values not updated'],
      }
    }

    const onTrack = set.filter((k) => k.status === 'on_track').length
    const atRisk = set.filter((k) => k.status === 'at_risk').length
    const offTrack = set.filter((k) => k.status === 'off_track').length

    const score = Math.round(
      ((onTrack * 100 + atRisk * 50 + offTrack * 0) / set.length),
    )

    contributing_factors.push(`${onTrack}/${set.length} KPIs on track`)

    if (atRisk > 0) flags.push(`${atRisk} KPIs at risk`)
    if (offTrack > 0) flags.push(`${offTrack} KPIs off track`)

    return {
      name: 'kpi_performance',
      score: Math.max(0, score),
      weight: this.weights.kpi_performance,
      contributing_factors,
      flags,
    }
  }

  private scoreAgentActivity(a: AgentSignals): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (a.total_active === 0) {
      return {
        name: 'agent_activity',
        score: 50,
        weight: this.weights.agent_activity,
        contributing_factors: ['No AI agents assigned to this business'],
        flags: [],
      }
    }

    let score = 80

    if (a.error_rate > 0.2) {
      score -= 30
      flags.push(`Agent error rate is ${Math.round(a.error_rate * 100)}%`)
    } else if (a.error_rate > 0.05) {
      score -= 10
    }

    if (a.escalations_this_week > 0) {
      score -= Math.min(20, a.escalations_this_week * 5)
      flags.push(`${a.escalations_this_week} agent escalations this week`)
    }

    if (a.tasks_completed_this_week > 0) {
      score = Math.min(100, score + 10)
      contributing_factors.push(`${a.tasks_completed_this_week} agent tasks completed this week`)
    }

    contributing_factors.push(`${a.total_active} active agents assigned`)

    return {
      name: 'agent_activity',
      score: Math.max(0, score),
      weight: this.weights.agent_activity,
      contributing_factors,
      flags,
    }
  }

  private scoreAutomationReliability(a: AutomationSignals): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (a.total_active === 0) {
      return {
        name: 'automation_reliability',
        score: 50,
        weight: this.weights.automation_reliability,
        contributing_factors: ['No automations configured for this business'],
        flags: [],
      }
    }

    const score = Math.round(a.success_rate_30d * 100)

    if (a.consecutive_failures > 0) {
      flags.push(`${a.consecutive_failures} consecutive automation failures`)
    }
    if (a.success_rate_30d < 0.8) {
      flags.push(`Automation success rate is ${Math.round(a.success_rate_30d * 100)}% over 30 days`)
    }
    if (a.runs_last_7d > 0) {
      contributing_factors.push(`${a.runs_last_7d} automation runs in the last 7 days`)
    }

    contributing_factors.push(`${a.total_active} active automations`)

    return {
      name: 'automation_reliability',
      score: Math.max(0, score),
      weight: this.weights.automation_reliability,
      contributing_factors,
      flags,
    }
  }

  private scoreKnowledgeCoverage(k: KnowledgeSignals): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (k.total_linked === 0) {
      return {
        name: 'knowledge_coverage',
        score: 20,
        weight: this.weights.knowledge_coverage,
        contributing_factors: ['No knowledge objects linked to this business'],
        flags: ['Knowledge base is empty — institutional memory is at risk'],
      }
    }

    let score = 70

    const reviewPct = k.needs_review / k.total_linked
    if (reviewPct > 0.5) {
      score -= 20
      flags.push(`${k.needs_review} knowledge objects need review`)
    } else if (reviewPct > 0.2) {
      score -= 10
    }

    if (k.recently_added > 0) {
      score = Math.min(100, score + 10)
      contributing_factors.push(`${k.recently_added} knowledge objects added in the last 30 days`)
    }

    contributing_factors.push(`${k.total_linked} knowledge objects linked`)

    return {
      name: 'knowledge_coverage',
      score: Math.max(0, score),
      weight: this.weights.knowledge_coverage,
      contributing_factors,
      flags,
    }
  }

  private scoreRepositoryHealth(r: RepositorySignals): HealthScoreDimension {
    const flags: string[] = []
    const contributing_factors: string[] = []

    if (r.total_linked === 0) {
      return {
        name: 'repository_health',
        score: 50,
        weight: this.weights.repository_health,
        contributing_factors: ['No repositories linked to this business'],
        flags: [],
      }
    }

    const healthyPct = r.healthy / r.total_linked
    const score = Math.round(healthyPct * 100)

    if (r.stale > 0) flags.push(`${r.stale} repositories are stale`)
    if (r.at_risk > 0) flags.push(`${r.at_risk} repositories are at risk`)
    if (r.avg_days_since_commit > 30) {
      flags.push(`Average ${Math.round(r.avg_days_since_commit)} days since last commit`)
    }

    contributing_factors.push(`${r.healthy}/${r.total_linked} repositories healthy`)

    return {
      name: 'repository_health',
      score: Math.max(0, score),
      weight: this.weights.repository_health,
      contributing_factors,
      flags,
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private scoreLabel(score: number): BusinessHealthScore['label'] {
    if (score >= this.thresholds.excellent) return 'Excellent'
    if (score >= this.thresholds.good) return 'Good'
    if (score >= this.thresholds.fair) return 'Fair'
    if (score >= this.thresholds.poor) return 'Poor'
    return 'Critical'
  }

  private hasAttentionFlag(dimensions: HealthScoreDimension[]): boolean {
    return dimensions.some((d) => d.flags.length > 0 && d.score < 50)
  }

  private buildRecommendations(dimensions: HealthScoreDimension[], overall_score: number): string[] {
    const recs: string[] = []

    for (const dim of dimensions) {
      if (dim.score < 40) {
        if (dim.name === 'kpi_performance') {
          recs.push('Define and update KPIs to accurately measure business performance')
        } else if (dim.name === 'project_health') {
          recs.push('Review and unblock stale or overdue projects')
        } else if (dim.name === 'automation_reliability') {
          recs.push('Investigate and fix failing automations to restore reliability')
        } else if (dim.name === 'knowledge_coverage') {
          recs.push('Add knowledge objects to document institutional processes and context')
        } else if (dim.name === 'agent_activity') {
          recs.push('Review AI agent configurations and reduce error rates')
        } else if (dim.name === 'repository_health') {
          recs.push('Review stale or at-risk repositories and resume development activity')
        }
      }
    }

    if (overall_score < 50 && recs.length === 0) {
      recs.push('Review overall business health and address low-scoring areas')
    }

    return recs
  }
}
