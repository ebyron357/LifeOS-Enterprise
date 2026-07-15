import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/index.ts', 'vitest.config.ts'],
      thresholds: {
        lines: 80,
        functions: 0,
        branches: 70,
        statements: 80,
      },
    },
  },
})
