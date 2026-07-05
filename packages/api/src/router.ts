import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import { evaluateHealth } from '../../core/src/health';

const t = initTRPC.create({
  transformer: superjson,
});

export const appRouter = t.router({
  health: t.procedure.query(async () =>
    evaluateHealth([
      {
        name: 'api',
        check: async () => 'ok',
      },
    ]),
  ),
  echo: t.procedure.input(z.object({ message: z.string().min(1) })).query(({ input }) => input),
});

export type AppRouter = typeof appRouter;
