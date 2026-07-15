/**
 * @lifeos/db — Database client factory
 *
 * Returns a Drizzle ORM client connected to PostgreSQL.
 * The connection string is read from the DATABASE_URL environment variable.
 *
 * This module is intentionally not imported in test environments —
 * tests use the InMemoryBusinessRepository instead.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

export type LifeOSDatabase = ReturnType<typeof createDatabaseClient>

let _client: LifeOSDatabase | null = null

export function createDatabaseClient(connectionString: string): ReturnType<typeof drizzle> {
  const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false, // required for Supabase Transaction pooler
  })

  return drizzle(sql, { schema })
}

/**
 * Returns the singleton database client.
 * Call `initDatabase(url)` before using this in production code.
 */
export function getDatabase(): LifeOSDatabase {
  if (_client === null) {
    throw new Error(
      'Database has not been initialized. Call initDatabase(connectionString) first.',
    )
  }
  return _client
}

export function initDatabase(connectionString: string): LifeOSDatabase {
  if (_client !== null) {
    return _client
  }
  _client = createDatabaseClient(connectionString)
  return _client
}

/** For testing: reset the singleton. Never use in production. */
export function resetDatabaseClient(): void {
  _client = null
}

export * from './schema/index.js'
