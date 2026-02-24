import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayCronRpc, normalizeCronJobs } from '@/server/cron'
import { requireAuth } from '@/server/auth-middleware'

export const Route = createFileRoute('/api/cron/list')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const payload = await gatewayCronRpc(
            ['cron.list', 'cron.jobs.list', 'scheduler.jobs.list'],
            { includeDisabled: true },
          )

          return json({
            jobs: normalizeCronJobs(payload),
          })
        } catch (err) {
          return json(
            {
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
