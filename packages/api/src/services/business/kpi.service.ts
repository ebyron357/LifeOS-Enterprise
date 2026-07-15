/**
 * KPI Service
 *
 * Manages KPI lifecycle: create, update, delete, track history.
 * Computes trend direction and formats KPI data for display.
 */
import type { IBusinessRepository } from './business.repository.js'
import type { CreateKPIData, KPIRecord, UpdateKPIData } from './types.js'

export interface KPITrend {
  direction: 'up' | 'down' | 'stable'
  is_positive: boolean
  percent_change: number | null
  change_absolute: number
}

export interface KPIWithTrend extends KPIRecord {
  trend: KPITrend | null
  formatted_current: string
  formatted_target: string
  progress_percent: number | null
}

export class KPIService {
  constructor(private readonly repo?: IBusinessRepository) {}

  async create(data: CreateKPIData): Promise<KPIRecord> {
    if (!this.repo) throw new Error('Repository is required for create()')
    return this.repo.createKPI(data)
  }

  async update(id: string, orgId: string, data: UpdateKPIData): Promise<KPIRecord> {
    if (!this.repo) throw new Error('Repository is required for update()')
    return this.repo.updateKPI(id, orgId, data)
  }

  async delete(id: string, orgId: string): Promise<void> {
    if (!this.repo) throw new Error('Repository is required for delete()')
    return this.repo.deleteKPI(id, orgId)
  }

  async get(id: string, orgId: string): Promise<KPIRecord | null> {
    if (!this.repo) throw new Error('Repository is required for get()')
    return this.repo.getKPI(id, orgId)
  }

  async listForBusiness(businessId: string, orgId: string): Promise<KPIWithTrend[]> {
    if (!this.repo) throw new Error('Repository is required for listForBusiness()')
    const kpis = await this.repo.listKPIs(businessId, orgId)
    return kpis.map((kpi) => this.enrichKPI(kpi))
  }

  private enrichKPI(kpi: KPIRecord): KPIWithTrend {
    const trend = this.computeTrend(kpi)
    const formatted_current = this.formatValue(kpi, kpi.current_value)
    const formatted_target = this.formatValue(kpi, kpi.target_value)
    const progress_percent = this.computeProgress(kpi)

    return { ...kpi, trend, formatted_current, formatted_target, progress_percent }
  }

  /** Compute trend direction between current and previous value. */
  computeTrend(kpi: KPIRecord): KPITrend | null {
    if (kpi.current_value === undefined || kpi.previous_value === undefined) {
      return null
    }

    const change_absolute = kpi.current_value - kpi.previous_value
    const isStable = Math.abs(change_absolute) < 0.001

    const percent_change =
      kpi.previous_value !== 0
        ? Math.round((change_absolute / Math.abs(kpi.previous_value)) * 10000) / 100
        : null

    let direction: KPITrend['direction'] = 'stable'
    if (!isStable) {
      direction = change_absolute > 0 ? 'up' : 'down'
    }

    // is_positive = improvement in the direction the KPI is measuring
    const is_positive: boolean =
      direction === 'stable'
        ? true
        : kpi.direction === 'higher_is_better'
          ? direction === 'up'
          : kpi.direction === 'lower_is_better'
            ? direction === 'down'
            : kpi.current_value !== undefined &&
              kpi.previous_value !== undefined &&
              Math.abs(kpi.current_value - kpi.target_value) <
                Math.abs(kpi.previous_value - kpi.target_value)

    return { direction, is_positive, percent_change, change_absolute }
  }

  /** Format a numeric KPI value for display using the KPI's unit. */
  formatValue(kpi: KPIRecord, value: number | undefined): string {
    if (value === undefined) return 'N/A'
    switch (kpi.unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value)
      case 'percentage':
        return `${Math.round(value * 100) / 100}%`
      case 'time_hours':
        return `${value}h`
      case 'time_days':
        return `${value}d`
      default:
        return new Intl.NumberFormat('en-US').format(value)
    }
  }

  /** Compute progress percentage (0–100) toward the KPI target. */
  computeProgress(kpi: KPIRecord): number | null {
    if (kpi.current_value === undefined || kpi.target_value === 0) return null

    if (kpi.direction === 'higher_is_better') {
      return Math.round(Math.min(100, (kpi.current_value / kpi.target_value) * 100))
    } else if (kpi.direction === 'lower_is_better') {
      // 100% means we've reached/beaten the target (current <= target)
      if (kpi.current_value <= kpi.target_value) return 100
      // If 2x the target, show 0%
      const excess = kpi.current_value - kpi.target_value
      const max_excess = kpi.target_value
      return Math.max(0, Math.round(100 - (excess / max_excess) * 100))
    }

    // target_range — proximity to target
    const pct = Math.abs((kpi.current_value - kpi.target_value) / kpi.target_value)
    return Math.max(0, Math.round((1 - pct) * 100))
  }
}
