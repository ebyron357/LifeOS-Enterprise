import { HealthStatus } from '../../shared-types/src';

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus>;
}

export async function evaluateHealth(checks: HealthCheck[]) {
  const results = await Promise.all(
    checks.map(async ({ name, check }) => ({
      name,
      status: await check(),
    })),
  );

  const globalStatus = results.some((result) => result.status === 'down')
    ? 'down'
    : results.some((result) => result.status === 'degraded')
      ? 'degraded'
      : 'ok';

  return {
    status: globalStatus,
    checks: results,
  };
}
