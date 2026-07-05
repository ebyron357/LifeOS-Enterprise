import { initTRPC, TRPCError } from '@trpc/server'
import type { UserRole } from '@lifeos/types'

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  org_id: string
  avatar_url?: string
}

export interface RequestContext {
  /**
   * The authenticated user. null means the request is unauthenticated.
   * Protected procedures enforce this is non-null.
   */
  user: AuthenticatedUser | null
  /**
   * The organization ID scoping this request.
   * Injected after authentication for all protected routes.
   */
  org_id: string | null
  /**
   * Optional request metadata for audit logging.
   */
  request_meta?: {
    ip_address?: string
    user_agent?: string
    request_id?: string
  }
}

export type ProtectedContext = RequestContext & {
  user: AuthenticatedUser
  org_id: string
}

// ─────────────────────────────────────────────────────────────────────────────
// tRPC INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const t = initTRPC.context<RequestContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Strip internal details from production errors
        cause:
          process.env['NODE_ENV'] !== 'production' ? error.cause?.toString() : undefined,
      },
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// BASE ROUTER & PROCEDURE
// ─────────────────────────────────────────────────────────────────────────────

export const router = t.router
export const publicProcedure = t.procedure

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authentication middleware.
 * Verifies the user is logged in before allowing access to a procedure.
 */
const enforceAuthenticated = t.middleware(({ ctx, next }) => {
  if (ctx.user === null || ctx.org_id === null) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      org_id: ctx.org_id,
    } satisfies ProtectedContext,
  })
})

/**
 * Authorization middleware factory.
 * Rejects users whose role is below the minimum required role.
 */
function enforceRole(minimumRole: UserRole) {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 0,
    member: 1,
    admin: 2,
    owner: 3,
  }

  return t.middleware(({ ctx, next }) => {
    if (ctx.user === null || ctx.org_id === null) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource.',
      })
    }

    const userLevel = roleHierarchy[ctx.user.role] ?? -1
    const requiredLevel = roleHierarchy[minimumRole] ?? 999

    if (userLevel < requiredLevel) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This action requires the '${minimumRole}' role or higher.`,
      })
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        org_id: ctx.org_id,
      } satisfies ProtectedContext,
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Requires authentication (any role). */
export const protectedProcedure = t.procedure.use(enforceAuthenticated)

/** Requires viewer role or higher (read-only). */
export const viewerProcedure = t.procedure.use(enforceRole('viewer'))

/** Requires member role or higher. */
export const memberProcedure = t.procedure.use(enforceRole('member'))

/** Requires admin role or higher. */
export const adminProcedure = t.procedure.use(enforceRole('admin'))

/** Requires owner role. */
export const ownerProcedure = t.procedure.use(enforceRole('owner'))

// ─────────────────────────────────────────────────────────────────────────────
// TEST CONTEXT FACTORIES
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a mock context for testing. Never use outside of tests. */
export function createTestContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    user: null,
    org_id: null,
    ...overrides,
  }
}

export function createAuthenticatedTestContext(
  user: Partial<AuthenticatedUser> & { id: string; org_id: string },
): RequestContext {
  return {
    user: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      avatar_url: undefined,
      ...user,
    },
    org_id: user.org_id,
    request_meta: {
      ip_address: '127.0.0.1',
      request_id: 'test-request-id',
    },
  }
}
