import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getGatewayScreenshotResponse } from '../../../server/browser-monitor'
import { requireAuth } from '@/server/auth-middleware'

export const Route = createFileRoute('/api/browser/screenshot')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const tabId = url.searchParams.get('tabId')
        const payload = await getGatewayScreenshotResponse(tabId)
        return json(payload)
      },
    },
  },
})
