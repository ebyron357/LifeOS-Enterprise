/**
 * KPIService — Unit Tests
 */
import { describe, it, expect } from 'vitest'
import { KPIService } from '../services/business/kpi.service.js'
import type { KPIRecord } from '../services/business/types.js'

function makeKPI(overrides: Partial<KPIRecord> = {}): KPIRecord {
  return {
    id: 'kpi-001',
    business_id: 'biz-001',
    business_key: 'BIZ-TEST01',
    org_id: 'org-001',
    name: 'Monthly Revenue',
    unit: 'currency',
    direction: 'higher_is_better',
    measurement_period: 'monthly',
    target_value: 100_000,
    current_value: undefined,
    previous_value: undefined,
    warning_threshold: undefined,
    critical_threshold: undefined,
    status: 'not_set',
    tags: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    created_by: 'user-001',
    ...overrides,
  }
}

describe('KPIService', () => {
  const service = new KPIService()

  // ── formatValue ──────────────────────────────────────────────────────────

  describe('formatValue', () => {
    it('formats currency values', () => {
      const kpi = makeKPI({ unit: 'currency' })
      expect(service.formatValue(kpi, 1500)).toContain('1')
    })

    it('formats percentage values', () => {
      const kpi = makeKPI({ unit: 'percentage' })
      expect(service.formatValue(kpi, 75)).toContain('%')
    })

    it('formats count values', () => {
      const kpi = makeKPI({ unit: 'count' })
      const formatted = service.formatValue(kpi, 1234)
      expect(formatted).toContain('1')
    })

    it('formats time_hours with hours suffix', () => {
      const kpi = makeKPI({ unit: 'time_hours' })
      expect(service.formatValue(kpi, 8)).toContain('h')
    })

    it('formats time_days with days suffix', () => {
      const kpi = makeKPI({ unit: 'time_days' })
      expect(service.formatValue(kpi, 14)).toContain('d')
    })

    it('returns null-safe string for undefined', () => {
      const kpi = makeKPI()
      expect(service.formatValue(kpi, undefined)).toBe('N/A')
    })
  })

  // ── computeTrend ─────────────────────────────────────────────────────────

  describe('computeTrend', () => {
    it('returns null when no previous value', () => {
      const kpi = makeKPI({ current_value: 100 })
      expect(service.computeTrend(kpi)).toBeNull()
    })

    it('returns null when no current value', () => {
      const kpi = makeKPI({ previous_value: 100 })
      expect(service.computeTrend(kpi)).toBeNull()
    })

    it('returns up for higher_is_better improvement', () => {
      const kpi = makeKPI({ direction: 'higher_is_better', previous_value: 80, current_value: 100 })
      const trend = service.computeTrend(kpi)
      expect(trend?.direction).toBe('up')
      expect(trend?.is_positive).toBe(true)
    })

    it('returns down for higher_is_better regression', () => {
      const kpi = makeKPI({ direction: 'higher_is_better', previous_value: 100, current_value: 80 })
      const trend = service.computeTrend(kpi)
      expect(trend?.direction).toBe('down')
      expect(trend?.is_positive).toBe(false)
    })

    it('returns up for lower_is_better when value increased (bad)', () => {
      const kpi = makeKPI({ direction: 'lower_is_better', previous_value: 10, current_value: 20 })
      const trend = service.computeTrend(kpi)
      expect(trend?.direction).toBe('up')
      expect(trend?.is_positive).toBe(false)
    })

    it('returns down for lower_is_better when value decreased (good)', () => {
      const kpi = makeKPI({ direction: 'lower_is_better', previous_value: 20, current_value: 10 })
      const trend = service.computeTrend(kpi)
      expect(trend?.direction).toBe('down')
      expect(trend?.is_positive).toBe(true)
    })

    it('returns stable when values are equal', () => {
      const kpi = makeKPI({ direction: 'higher_is_better', previous_value: 100, current_value: 100 })
      const trend = service.computeTrend(kpi)
      expect(trend?.direction).toBe('stable')
    })

    it('computes percentage change correctly', () => {
      const kpi = makeKPI({ direction: 'higher_is_better', previous_value: 100, current_value: 125 })
      const trend = service.computeTrend(kpi)
      expect(trend?.percent_change).toBeCloseTo(25)
    })
  })

  // ── computeProgress ──────────────────────────────────────────────────────

  describe('computeProgress', () => {
    it('returns null when target or current is missing', () => {
      expect(service.computeProgress(makeKPI())).toBeNull()
      expect(service.computeProgress(makeKPI({ target_value: 100 }))).toBeNull()
    })

    it('computes 100% progress at target for higher_is_better', () => {
      const kpi = makeKPI({ target_value: 100, current_value: 100 })
      expect(service.computeProgress(kpi)).toBeCloseTo(100)
    })

    it('computes 50% progress at half target', () => {
      const kpi = makeKPI({ target_value: 100, current_value: 50 })
      expect(service.computeProgress(kpi)).toBeCloseTo(50)
    })

    it('caps progress at 100 for higher_is_better', () => {
      const kpi = makeKPI({ target_value: 100, current_value: 150 })
      expect(service.computeProgress(kpi)).toBe(100)
    })

    it('computes progress for lower_is_better (at target = 100%)', () => {
      const kpi = makeKPI({ direction: 'lower_is_better', target_value: 10, current_value: 10 })
      expect(service.computeProgress(kpi)).toBeCloseTo(100)
    })

    it('computes 0% for lower_is_better when value is 2x target', () => {
      const kpi = makeKPI({ direction: 'lower_is_better', target_value: 10, current_value: 20 })
      const progress = service.computeProgress(kpi)
      expect(progress).toBeLessThan(50)
    })
  })
})
