import { router } from '../trpc.js'
import { businessRouter } from './business.router.js'

export const appRouter = router({
  business: businessRouter,
})

export type AppRouter = typeof appRouter
