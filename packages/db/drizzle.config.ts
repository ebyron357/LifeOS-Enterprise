import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/businesses.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/lifeos',
  },
  verbose: true,
  strict: true,
})
