import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gatewayReconnect } from '../../server/gateway'
import { requireAuth } from '../../server/auth-middleware'

export const Route = createFileRoute('/api/gateway-config')({
  server: {
    handlers: {
      // GET: return current gateway config (non-sensitive)
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const url = process.env.CLAWDBOT_GATEWAY_URL?.trim() || 'ws://127.0.0.1:18789'
          const hasToken = Boolean(process.env.CLAWDBOT_GATEWAY_TOKEN?.trim())
          return json({ ok: true, url, hasToken })
        } catch (err) {
          return json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          )
        }
      },

      // POST: update gateway URL and/or token in .env file
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const body = (await request.json().catch(() => ({}))) as {
            url?: string
            token?: string
          }

          // ── Input validation to prevent .env injection ──────────────────
          if (body.url !== undefined) {
            // Must be a valid ws:// or wss:// WebSocket URL
            let parsedUrl: URL
            try {
              parsedUrl = new URL(body.url)
            } catch {
              return json({ ok: false, error: 'Invalid gateway URL format' }, { status: 400 })
            }
            if (parsedUrl.protocol !== 'ws:' && parsedUrl.protocol !== 'wss:') {
              return json({ ok: false, error: 'Gateway URL must use ws:// or wss:// protocol' }, { status: 400 })
            }
            // Strip newlines/control chars to prevent .env injection
            body.url = body.url.replace(/[\r\n\t]/g, '')
          }

          if (body.token !== undefined) {
            if (/[\r\n]/.test(body.token)) {
              return json({ ok: false, error: 'Token contains invalid characters' }, { status: 400 })
            }
            if (body.token.length > 512) {
              return json({ ok: false, error: 'Token too long' }, { status: 400 })
            }
          }
          // ─────────────────────────────────────────────────────────────────

          const envPath = join(process.cwd(), '.env')
          let envContent = ''

          try {
            envContent = await readFile(envPath, 'utf-8')
          } catch {
            // .env doesn't exist — create from .env.example or empty
            try {
              envContent = await readFile(join(process.cwd(), '.env.example'), 'utf-8')
            } catch {
              envContent = ''
            }
          }

          // Update or add CLAWDBOT_GATEWAY_URL
          if (body.url !== undefined) {
            if (envContent.match(/^CLAWDBOT_GATEWAY_URL=/m)) {
              envContent = envContent.replace(
                /^CLAWDBOT_GATEWAY_URL=.*/m,
                `CLAWDBOT_GATEWAY_URL=${body.url}`,
              )
            } else {
              envContent += `\nCLAWDBOT_GATEWAY_URL=${body.url}`
            }
            // Also update process.env so it takes effect without restart
            process.env.CLAWDBOT_GATEWAY_URL = body.url
          }

          // Update or add CLAWDBOT_GATEWAY_TOKEN
          if (body.token !== undefined) {
            if (envContent.match(/^CLAWDBOT_GATEWAY_TOKEN=/m)) {
              envContent = envContent.replace(
                /^CLAWDBOT_GATEWAY_TOKEN=.*/m,
                `CLAWDBOT_GATEWAY_TOKEN=${body.token}`,
              )
            } else {
              envContent += `\nCLAWDBOT_GATEWAY_TOKEN=${body.token}`
            }
            process.env.CLAWDBOT_GATEWAY_TOKEN = body.token
          }

          // Try to persist to .env (may fail in Docker/read-only containers — that's OK)
          try {
            await writeFile(envPath, envContent, 'utf-8')
          } catch {
            // In-memory env vars are already set above, so connection will still work
          }

          // Force reconnect the gateway client with new credentials
          try {
            await gatewayReconnect()
            return json({ ok: true, connected: true })
          } catch (connErr) {
            return json({
              ok: true,
              connected: false,
              error: `Config saved but connection failed: ${connErr instanceof Error ? connErr.message : String(connErr)}`,
            })
          }
        } catch (err) {
          return json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          )
        }
      },
    },
  },
})
