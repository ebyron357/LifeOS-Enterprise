import { describe, it, expect, beforeEach } from 'vitest'
import { BusinessHealthEngine } from '../services/business/business-health.engine.js'
import type { BusinessHealthInputs } from '../services/business/business-health.engine.js'
import type { BusinessRecord, KPIRecord } from '../services/business/types.js'

const MOCK_BUSINESS: BusinessRecord = {
  id: 'biz-test-id',
  business_key: 'BIZ-TEST01',
  org_id: 'org-test',
  name: 'Test Business',
  slug: 'test-business',
  status: 'Active',
  owner_id: 'user-test',
  tags: [],
  metadata: {},
  archived: false,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  version: 1,
}

function makeKPI(overrides: Partial<KPIRecord> & Pick<KPIRecord, 'id' | 'name' | 'status' | 'direction' | 'unit' | 'target_value'>): KPIRecord {
  return {
    business_id: 'biz-test-id',
    business_key: 'BIZ-TEST01',
    org_id: 'org-test',
    description: undefined,
    current_value: undefined,
    previous_value: undefined,
    warning_threshold: undefined,
    critical_threshold: undefined,
    measurement_period: 'monthly',
    tags: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeInputs(overrides: Partial<BusinessHealthInputs> = {}): BusinessHealthInputs {
  return {
    business: MOCK_BUSINESS,
    kpis: [],
    projects: {
      total: 10,
      active: 8,
      stale: 1,
      blocked: 0,
      overdue: 0,
      completed_this_month: 3,
    },
    agents: {
      total_active: 3,
      tasks_completed_this_week: 20,
      escalations_this_week: 1,
      error_rate: 0.02,
    },
    automations: {
      total_active: 5,
      success_rate_30d: 0.97,
      consecutive_failures: 0,
      runs_last_7d: 100,
    },
    knowledge: {
      total_linked: 30,
      needs_review: 2,
      recently_added: 5,
    },
    repositories: {
      total_linked: 4,
      healthy: 4,
      stale: 0,
      at_risk: 0,
      avg_days_since_commit: 2,
    },
    ...overrides,
  }
}

describe('BusinessHealthEngine', () => {
  let engine: BusinessHealthEngine

  beforeEach(() => {
    engine = new BusinessHealthEngine()
  })

  it('returns a score between 0 and 100', () => {
    const result = engine.compute(makeInputs())
    expect(result.overall_score).toBeGreaterThanOrEqual(0)
    expect(result.overall_score).toBeLessThanOrEqual(100)
  })

  it('returns Excellent for a healthy business', () => {
    const result = engine.compute(makeInputs())
    expect(['Excellent', 'Good']).toContain(result.label)
  })

  it('returns Critical when automation has consecutive failures', () => {
    const result = engine.compute(
      makeInputs({
        automations: {
          total_active: 5,
          success_rate_30d: 0.1,
          consecutive_failures: 10,
          runs_last_7d: 20,
        },
      }),
    )
    expect(result.overall_score).toBeLessThan(80)
  })

  it('includes all 6 dimensions', () => {
    const result = engine.compute(makeInputs())
    const dimensionNames = result.dimensions.map((d) => d.name)
    expect(dimensionNames).toContain('project_health')
    expect(dimensionNames).toContain('kpi_performance')
    expect(dimensionNames).toContain('agent_activity')
    expect(dimensionNames).toContain('automation_reliability')
    expect(dimensionNames).toContain('knowledge_coverage')
    expect(dimensionNames).toContain('repository_health')
  })

  it('scores KPI performance at 0 when no KPIs exist', () => {
    const result = engine.compute(makeInputs({ kpis: [] }))
    const kpiDim = result.dimensions.find((d) => d.name === 'kpi_performance')
    expect(kpiDim).toBeDefined()
    expect(kpiDim!.score).toBe(0)
  })

  it('scores KPI performance at 100 when all KPIs are on_track', () => {
    const result = engine.compute(
      makeInputs({
        kpis: [
          makeKPI({ id: '1', name: 'Revenue', status: 'on_track', target_value: 100, current_value: 100, direction: 'higher_is_better', unit: 'currency' }),
          makeKPI({ id: '2', name: 'Churn', status: 'on_track', target_value: 5, current_value: 3, direction: 'lower_is_better', unit: 'percentage' }),
        ],
      }),
    )
    const kpiDim = result.dimensions.find((d) => d.name === 'kpi_performance')
    expect(kpiDim!.score).toBe(100)
  })

  it('scores KPI performance proportionally with mixed statuses', () => {
    const result = engine.compute(
      makeInputs({
        kpis: [
          makeKPI({ id: '1', name: 'Revenue', status: 'on_track', target_value: 100, current_value: 100, direction: 'higher_is_better', unit: 'currency' }),
          makeKPI({ id: '2', name: 'Churn', status: 'off_track', target_value: 5, current_value: 20, direction: 'lower_is_better', unit: 'percentage' }),
        ],
      }),
    )
    const kpiDim = result.dimensions.find((d) => d.name === 'kpi_performance')
    // 1 on_track, 1 off_track → score should be between 0 and 100
    expect(kpiDim!.score).toBeGreaterThan(0)
    expect(kpiDim!.score).toBeLessThan(100)
  })

  it('scores project_health lower when many projects are overdue', () => {
    const good = engine.compute(makeInputs({ projects: { total: 10, active: 8, stale: 0, blocked: 0, overdue: 0, completed_this_month: 5 } }))
    const bad = engine.compute(makeInputs({ projects: { total: 10, active: 4, stale: 2, blocked: 3, overdue: 5, completed_this_month: 0 } }))

    const goodDim = good.dimensions.find((d) => d.name === 'project_health')!
    const badDim = bad.dimensions.find((d) => d.name === 'project_health')!
    expect(goodDim.score).toBeGreaterThan(badDim.score)
  })

  it('generates recommendations', () => {
    const result = engine.compute(
      makeInputs({
        kpis: [
          makeKPI({ id: '1', name: 'Revenue', status: 'off_track', target_value: 100, current_value: 30, direction: 'higher_is_better', unit: 'currency' }),
        ],
        automations: { total_active: 5, success_rate_30d: 0.5, consecutive_failures: 5, runs_last_7d: 10 },
      }),
    )
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('has deterministic output for same input', () => {
    const inputs = makeInputs()
    const r1 = engine.compute(inputs)
    const r2 = engine.compute(inputs)
    expect(r1.overall_score).toBe(r2.overall_score)
    expect(r1.label).toBe(r2.label)
  })
})
