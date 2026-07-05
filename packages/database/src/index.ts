import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

export interface DatabaseClients {
  pg: ReturnType<typeof drizzle>;
  redis: Redis;
  supabase: ReturnType<typeof createClient>;
}

export function createDatabaseClients(config: {
  databaseUrl: string;
  redisUrl: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}): DatabaseClients {
  const pool = new Pool({ connectionString: config.databaseUrl });

  return {
    pg: drizzle(pool),
    redis: new Redis(config.redisUrl),
    supabase: createClient(config.supabaseUrl, config.supabaseServiceRoleKey),
  };
}
