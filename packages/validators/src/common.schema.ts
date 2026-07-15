import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// ID PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

export const BusinessIdSchema = z
  .string()
  .regex(/^BIZ-[A-Z0-9]{4,}$/, 'Business ID must match BIZ-XXXX format')

export const ProjectIdSchema = z
  .string()
  .regex(/^PRJ-[A-Z0-9]{4,}$/, 'Project ID must match PRJ-XXXX format')

export const AgentIdSchema = z
  .string()
  .regex(/^AGT-[A-Z0-9]{4,}$/, 'Agent ID must match AGT-XXXX format')

export const AutomationIdSchema = z
  .string()
  .regex(/^AUT-[A-Z0-9]{4,}$/, 'Automation ID must match AUT-XXXX format')

export const ISODateSchema = z.string().date('Must be a valid ISO 8601 date (YYYY-MM-DD)')
export const ISODateTimeSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime' })

export const PrioritySchema = z.enum(['Critical', 'High', 'Medium', 'Low'])
export const ImpactLevelSchema = z.enum(['High', 'Medium', 'Low'])
export const UserRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(25),
})

export const SortOrderSchema = z.enum(['asc', 'desc']).default('desc')

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query cannot be empty')
  .max(500, 'Search query is too long')
  .trim()

export type PaginationInput = z.infer<typeof PaginationSchema>
export type SortOrder = z.infer<typeof SortOrderSchema>
