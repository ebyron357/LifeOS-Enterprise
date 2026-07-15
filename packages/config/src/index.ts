/**
 * @lifeos/config
 *
 * Shared runtime configuration for all LifeOS packages.
 * Values are read from environment variables with safe defaults for development.
 * Never hardcode secrets or environment-specific values here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        'Check your .env file or deployment configuration.',
    )
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue
}

function getBoolEnvVar(key: string, defaultValue: boolean): boolean {
  const val = process.env[key]
  if (val === undefined) return defaultValue
  return val === 'true' || val === '1'
}

function getIntEnvVar(key: string, defaultValue: number): number {
  const val = process.env[key]
  if (val === undefined) return defaultValue
  const parsed = parseInt(val, 10)
  if (isNaN(parsed)) throw new Error(`Environment variable ${key} must be an integer, got: ${val}`)
  return parsed
}

function parseNodeEnv(value: string): 'development' | 'test' | 'production' {
  if (value === 'production' || value === 'test' || value === 'development') return value
  return 'development'
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE ENVIRONMENT
// ─────────────────────────────────────────────────────────────────────────────

export const NODE_ENV = parseNodeEnv(getOptionalEnvVar('NODE_ENV', 'development'))

export const IS_PRODUCTION = NODE_ENV === 'production'
export const IS_TEST = NODE_ENV === 'test'
export const IS_DEVELOPMENT = NODE_ENV === 'development'

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export const databaseConfig = {
  url: IS_TEST
    ? getOptionalEnvVar('TEST_DATABASE_URL', ':memory:')
    : getEnvVar('DATABASE_URL'),
  maxConnections: getIntEnvVar('DB_MAX_CONNECTIONS', 10),
  connectionTimeoutMs: getIntEnvVar('DB_CONNECTION_TIMEOUT_MS', 30_000),
  statementTimeoutMs: getIntEnvVar('DB_STATEMENT_TIMEOUT_MS', 10_000),
}

// ─────────────────────────────────────────────────────────────────────────────
// REDIS
// ─────────────────────────────────────────────────────────────────────────────

export const redisConfig = {
  url: getOptionalEnvVar('REDIS_URL', ''),
  tokenBucketCapacity: getIntEnvVar('RATE_LIMIT_BUCKET_CAPACITY', 100),
  tokenBucketRefillRatePerSecond: getIntEnvVar('RATE_LIMIT_REFILL_RATE', 10),
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export const authConfig = {
  jwtSecret: IS_TEST
    ? 'test-jwt-secret-not-for-production'
    : getEnvVar('JWT_SECRET'),
  jwtExpiresInSeconds: getIntEnvVar('JWT_EXPIRES_IN_SECONDS', 3600),
  refreshTokenExpiresInSeconds: getIntEnvVar('REFRESH_TOKEN_EXPIRES_IN_SECONDS', 604_800), // 7 days
  sessionCookieName: getOptionalEnvVar('SESSION_COOKIE_NAME', 'lifeos_session'),
  secureCookies: IS_PRODUCTION,
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export const auditConfig = {
  retentionDays: getIntEnvVar('AUDIT_RETENTION_DAYS', 90),
  enableDetailedLogging: getBoolEnvVar('AUDIT_DETAILED_LOGGING', !IS_PRODUCTION),
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

export const paginationConfig = {
  defaultPageSize: 25,
  maxPageSize: 100,
  defaultActivityLimit: 20,
  defaultAuditLimit: 20,
  defaultVersionHistoryLimit: 10,
  defaultSearchLimit: 10,
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const businessEngineConfig = {
  healthScoreWeights: {
    project_health: 0.30,
    kpi_performance: 0.25,
    agent_activity: 0.15,
    automation_reliability: 0.15,
    knowledge_coverage: 0.10,
    repository_health: 0.05,
  },
  healthScoreThresholds: {
    excellent: 85,
    good: 70,
    fair: 50,
    poor: 30,
    // Below 30 = Critical
  },
  staleProjectThresholdDays: 14,
  kpiOffTrackThresholdPercent: 0.1, // 10% below target = at_risk
  kpiCriticalThresholdPercent: 0.25, // 25% below target = off_track
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

export const featureFlags = {
  enableSemanticSearch: getBoolEnvVar('FEATURE_SEMANTIC_SEARCH', false),
  enableAIRecommendations: getBoolEnvVar('FEATURE_AI_RECOMMENDATIONS', false),
  enableVersionHistory: getBoolEnvVar('FEATURE_VERSION_HISTORY', true),
  enableAuditLog: getBoolEnvVar('FEATURE_AUDIT_LOG', true),
  enableActivityTimeline: getBoolEnvVar('FEATURE_ACTIVITY_TIMELINE', true),
}
