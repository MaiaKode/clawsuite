import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getGatewayTabsResponse } from '../../../server/browser-monitor'
import { requireAuth } from '@/server/auth-middleware'

export const Route = createFileRoute('/api/browser/tabs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const payload = await getGatewayTabsResponse()
        return json(payload)
      },
    },
  },
})
