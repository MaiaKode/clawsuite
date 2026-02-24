import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../../server/gateway'
import { requireAuth } from '@/server/auth-middleware'

export const Route = createFileRoute('/api/gateway/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const status = await gatewayRpc('status')
          const data =
            typeof status === 'object' && status !== null ? status : {}
          return json({ connected: true, ok: true, ...data })
        } catch {
          return json({ connected: true, ok: true })
        }
      },
    },
  },
})
