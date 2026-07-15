/**
 * Business Zod Schemas — Validation Tests
 */
import { describe, it, expect } from 'vitest'
import {
  CreateBusinessSchema,
  UpdateBusinessSchema,
  ListBusinessesSchema,
  SearchBusinessesSchema,
  CreateKPISchema,
  UpdateKPISchema,
  AddTagSchema,
  GetByIdSchema,
} from '../business.schema.js'

describe('CreateBusinessSchema', () => {
  it('accepts valid business input', () => {
    const result = CreateBusinessSchema.safeParse({
      name: 'TradeIQ Platform',
      status: 'Pre-Launch',
      tags: ['fintech', 'saas'],
      metadata: {},
    })
    expect(result.success).toBe(true)
  })

  it('requires name', () => {
    const result = CreateBusinessSchema.safeParse({
      status: 'Pre-Launch',
      tags: [],
      metadata: {},
    })
    expect(result.success).toBe(false)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = CreateBusinessSchema.safeParse({ name: 'X', status: 'Active', tags: [], metadata: {} })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 characters', () => {
    const result = CreateBusinessSchema.safeParse({ name: 'A'.repeat(101), status: 'Active', tags: [], metadata: {} })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = CreateBusinessSchema.safeParse({
      name: 'Valid Name',
      status: 'INVALID_STATUS',
      tags: [],
      metadata: {},
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    const statuses = ['Pre-Launch', 'Active', 'Paused', 'Scaling', 'Mature', 'Closed']
    for (const status of statuses) {
      const result = CreateBusinessSchema.safeParse({ name: 'Test Corp', status, tags: [], metadata: {} })
      expect(result.success).toBe(true)
    }
  })

  it('accepts optional URL fields', () => {
    const result = CreateBusinessSchema.safeParse({
      name: 'Test Corp',
      status: 'Active',
      tags: [],
      metadata: {},
      website: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid URLs', () => {
    const result = CreateBusinessSchema.safeParse({
      name: 'Test Corp',
      status: 'Active',
      tags: [],
      metadata: {},
      website: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 tags', () => {
    const result = CreateBusinessSchema.safeParse({
      name: 'Test Corp',
      status: 'Active',
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
      metadata: {},
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateBusinessSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateBusinessSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts empty update object', () => {
    const result = UpdateBusinessSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid status in update', () => {
    const result = UpdateBusinessSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('ListBusinessesSchema', () => {
  it('uses defaults when no input provided', () => {
    const result = ListBusinessesSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.per_page).toBe(25)
    expect(result.sort_field).toBe('updated')
    expect(result.sort_order).toBe('desc')
  })

  it('accepts custom pagination', () => {
    const result = ListBusinessesSchema.parse({ page: 3, per_page: 50 })
    expect(result.page).toBe(3)
    expect(result.per_page).toBe(50)
  })

  it('rejects per_page above 100', () => {
    const result = ListBusinessesSchema.safeParse({ per_page: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects page below 1', () => {
    const result = ListBusinessesSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts status filter', () => {
    const result = ListBusinessesSchema.safeParse({ filter: { status: ['Active', 'Scaling'] } })
    expect(result.success).toBe(true)
  })
})

describe('SearchBusinessesSchema', () => {
  it('requires a non-empty query', () => {
    const result = SearchBusinessesSchema.safeParse({ query: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid query', () => {
    const result = SearchBusinessesSchema.safeParse({ query: 'TradeIQ', limit: 10 })
    expect(result.success).toBe(true)
  })

  it('uses default limit', () => {
    const result = SearchBusinessesSchema.parse({ query: 'test' })
    expect(result.limit).toBe(20)
  })

  it('rejects limit above 100', () => {
    const result = SearchBusinessesSchema.safeParse({ query: 'test', limit: 101 })
    expect(result.success).toBe(false)
  })
})

describe('CreateKPISchema', () => {
  it('accepts valid KPI input', () => {
    const result = CreateKPISchema.safeParse({
      name: 'Monthly Revenue',
      unit: 'currency',
      direction: 'higher_is_better',
      measurement_period: 'monthly',
      target_value: 100_000,
      tags: [],
    })
    expect(result.success).toBe(true)
  })

  it('requires positive target_value', () => {
    const result = CreateKPISchema.safeParse({
      name: 'Revenue',
      unit: 'currency',
      direction: 'higher_is_better',
      measurement_period: 'monthly',
      target_value: -100,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid unit', () => {
    const result = CreateKPISchema.safeParse({
      name: 'Revenue',
      unit: 'invalid_unit',
      direction: 'higher_is_better',
      measurement_period: 'monthly',
      target_value: 100,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid direction', () => {
    const result = CreateKPISchema.safeParse({
      name: 'Revenue',
      unit: 'currency',
      direction: 'sideways_is_better',
      measurement_period: 'monthly',
      target_value: 100,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional current_value', () => {
    const result = CreateKPISchema.safeParse({
      name: 'Revenue',
      unit: 'currency',
      direction: 'higher_is_better',
      measurement_period: 'monthly',
      target_value: 100,
      current_value: 75,
      tags: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('UpdateKPISchema', () => {
  it('accepts partial update', () => {
    const result = UpdateKPISchema.safeParse({ current_value: 85_000 })
    expect(result.success).toBe(true)
  })

  it('accepts name-only update', () => {
    const result = UpdateKPISchema.safeParse({ name: 'New KPI Name' })
    expect(result.success).toBe(true)
  })
})

describe('AddTagSchema', () => {
  it('accepts valid tag', () => {
    const result = AddTagSchema.safeParse({ tag: 'fintech' })
    expect(result.success).toBe(true)
  })

  it('rejects empty tag', () => {
    const result = AddTagSchema.safeParse({ tag: '' })
    expect(result.success).toBe(false)
  })

  it('rejects tag longer than 50 characters', () => {
    const result = AddTagSchema.safeParse({ tag: 'a'.repeat(51) })
    expect(result.success).toBe(false)
  })
})

describe('GetByIdSchema', () => {
  it('accepts UUID', () => {
    const result = GetByIdSchema.safeParse({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    expect(result.success).toBe(true)
  })

  it('accepts BIZ key', () => {
    const result = GetByIdSchema.safeParse({ id: 'BIZ-TRADE1' })
    expect(result.success).toBe(true)
  })

  it('rejects empty string', () => {
    const result = GetByIdSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
  })
})
