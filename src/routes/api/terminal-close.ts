import { createFileRoute } from '@tanstack/react-router'
import { closeTerminalSession } from '../../server/terminal-sessions'
import { requireAuth } from '../../server/auth-middleware'

export const Route = createFileRoute('/api/terminal-close')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >
        const sessionId =
          typeof body.sessionId === 'string' ? body.sessionId : ''
        closeTerminalSession(sessionId)
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
