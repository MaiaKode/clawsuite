import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getActivityStreamDiagnostics,
  reconnectActivityStream,
  sanitizeText,
} from '../../../server/activity-stream'
import { requireAuth } from '@/server/auth-middleware'

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return sanitizeText(error.message)
  return sanitizeText(String(error))
}

export const Route = createFileRoute('/api/debug/reconnect')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          await reconnectActivityStream()
          return json({
            ok: true,
            state: getActivityStreamDiagnostics().status,
          })
        } catch (error) {
          return json(
            {
              ok: false,
              state: getActivityStreamDiagnostics().status,
              error: toErrorMessage(error),
            },
            { status: 503 },
          )
        }
      },
    },
  },
})
