import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'
import { requireAuth } from '../../server/auth-middleware'
import {
  buildCostSummary,
  isGatewayMethodUnavailable,
} from '../../server/usage-cost'

const UNAVAILABLE_MESSAGE = 'Unavailable on this Gateway version'

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return String(error)
}

export const Route = createFileRoute('/api/cost')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const payload = await gatewayRpc('usage.cost', { days: 30 })
          const cost = buildCostSummary(payload)
          return json({ ok: true, cost })
        } catch (error) {
          if (isGatewayMethodUnavailable(error)) {
            return json(
              {
                ok: false,
                unavailable: true,
                error: UNAVAILABLE_MESSAGE,
              },
              { status: 501 },
            )
          }

          return json(
            {
              ok: false,
              error: readErrorMessage(error),
            },
            { status: 503 },
          )
        }
      },
    },
  },
})
