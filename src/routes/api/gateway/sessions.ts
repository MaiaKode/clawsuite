import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '@/server/gateway'
import { requireAuth } from '@/server/auth-middleware'

export const Route = createFileRoute('/api/gateway/sessions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const result = await gatewayRpc<Record<string, unknown>>(
            'sessions.list',
            {
              limit: 100,
            },
          )
          return json({ ok: true, data: result })
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
