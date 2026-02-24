import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { requireAuth } from '../../server/auth-middleware'

export const Route = createFileRoute('/api/agent-activity')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        return json({ events: [], ok: true })
      },
    },
  },
})
