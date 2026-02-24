import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'
import { requireAuth } from '../../server/auth-middleware'

export const Route = createFileRoute('/api/agent-pause')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
          >
          const sessionKey =
            typeof body.sessionKey === 'string' ? body.sessionKey.trim() : ''
          const pause = typeof body.pause === 'boolean' ? body.pause : null

          if (!sessionKey) {
            return json(
              { ok: false, error: 'sessionKey required' },
              { status: 400 },
            )
          }

          if (pause === null) {
            return json(
              { ok: false, error: 'pause required' },
              { status: 400 },
            )
          }

          await gatewayRpc('cron.update', {
            jobId: sessionKey,
            patch: { enabled: !pause },
          })

          return json({ ok: true, paused: pause })
        } catch (err) {
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
