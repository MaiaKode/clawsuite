import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  launchBrowser,
  closeBrowser,
  navigate,
  typeText,
  pressKey,
  goBack,
  goForward,
  refresh,
  scrollPage,
  getScreenshot,
  getPageContent,
  cdpMouseClick,
} from '../../server/browser-session'
import {
  startProxy,
  stopProxy,
  getProxyUrl,
  getCurrentTarget,
} from '../../server/browser-proxy'
import { startBrowserStream } from '../../server/browser-stream'
import { requireAuth } from '../../server/auth-middleware'

const BrowserActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('launch') }),
  z.object({ action: z.literal('close') }),
  z.object({ action: z.literal('navigate'), url: z.string().url() }),
  z.object({ action: z.literal('click'), x: z.number().default(0), y: z.number().default(0) }),
  z.object({ action: z.literal('type'), text: z.string().default(''), submit: z.boolean().default(false) }),
  z.object({ action: z.literal('press'), key: z.string().min(1) }),
  z.object({ action: z.literal('back') }),
  z.object({ action: z.literal('forward') }),
  z.object({ action: z.literal('refresh') }),
  z.object({ action: z.literal('scroll'), direction: z.enum(['up', 'down']).default('down'), amount: z.number().default(400) }),
  z.object({ action: z.literal('screenshot') }),
  z.object({ action: z.literal('content') }),
  z.object({ action: z.literal('proxy-start') }),
  z.object({ action: z.literal('proxy-stop') }),
  z.object({ action: z.literal('proxy-navigate'), url: z.string().min(1) }),
  z.object({ action: z.literal('proxy-status') }),
  z.object({ action: z.literal('stream-start') }),
])

export const Route = createFileRoute('/api/browser')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const action = url.searchParams.get('action') || 'status'

        if (action === 'status' || action === 'proxy-status') {
          try {
            return json({
              ok: true,
              proxyUrl: getProxyUrl(),
              target: getCurrentTarget(),
            })
          } catch (err) {
            return json(
              {
                ok: false,
                error: err instanceof Error ? err.message : String(err),
              },
              { status: 500 },
            )
          }
        }

        return json(
          { error: `Unsupported GET action: ${action}` },
          { status: 400 },
        )
      },

      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        try {
          const rawBody = await request.json().catch(() => ({}))
          const result = BrowserActionSchema.safeParse(rawBody)

          if (!result.success) {
            return json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 })
          }

          const body = result.data
          const action = body.action

          switch (action) {
            case 'launch': {
              const state = await launchBrowser()
              return json({ ok: true, ...state })
            }

            case 'close': {
              await closeBrowser()
              return json({ ok: true, running: false })
            }

            case 'navigate': {
              const url = typeof body.url === 'string' ? body.url.trim() : ''
              if (!url)
                return json({ error: 'url is required' }, { status: 400 })

              // SSRF/Local File Access mitigation: Only allow http and https
              try {
                const parsed = new URL(url)
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                  return json({ error: 'Only http and https protocols are allowed' }, { status: 400 })
                }
              } catch {
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  // If not a full URL, we could attempt to prepend https:// but safer to reject
                  return json({ error: 'Invalid URL or protocol' }, { status: 400 })
                }
              }

              const state = await navigate(url)
              return json({ ok: true, ...state })
            }

            case 'click': {
              const x = typeof body.x === 'number' ? body.x : 0
              const y = typeof body.y === 'number' ? body.y : 0
              const state = await cdpMouseClick(x, y)
              return json({ ok: true, ...state })
            }

            case 'type': {
              const text = typeof body.text === 'string' ? body.text : ''
              const submit = body.submit === true
              const state = await typeText(text, submit)
              return json({ ok: true, ...state })
            }

            case 'press': {
              const key = typeof body.key === 'string' ? body.key : ''
              if (!key)
                return json({ error: 'key is required' }, { status: 400 })
              const state = await pressKey(key)
              return json({ ok: true, ...state })
            }

            case 'back': {
              const state = await goBack()
              return json({ ok: true, ...state })
            }

            case 'forward': {
              const state = await goForward()
              return json({ ok: true, ...state })
            }

            case 'refresh': {
              const state = await refresh()
              return json({ ok: true, ...state })
            }

            case 'scroll': {
              const direction = body.direction === 'up' ? 'up' : 'down'
              const amount = typeof body.amount === 'number' ? body.amount : 400
              const state = await scrollPage(direction, amount)
              return json({ ok: true, ...state })
            }

            case 'screenshot': {
              const state = await getScreenshot()
              return json({ ok: true, ...state })
            }

            case 'content': {
              const content = await getPageContent()
              return json({ ok: true, ...content })
            }

            // Proxy mode — iframe-based browsing
            case 'proxy-start': {
              const result = await startProxy()
              return json({ ok: true, ...result })
            }

            case 'proxy-stop': {
              await stopProxy()
              return json({ ok: true })
            }

            case 'proxy-navigate': {
              const url = typeof body.url === 'string' ? body.url.trim() : ''
              if (!url) return json({ error: 'url required' }, { status: 400 })
              let normalizedUrl = url
              if (!normalizedUrl.match(/^https?:\/\//))
                normalizedUrl = `https://${normalizedUrl}`

              // SSRF/Local File Access mitigation: Only allow http and https
              try {
                const parsed = new URL(normalizedUrl)
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                  return json({ error: 'Only http and https protocols are allowed' }, { status: 400 })
                }
              } catch {
                return json({ error: 'Invalid URL' }, { status: 400 })
              }

              // Navigate the proxy
              const proxyUrl = getProxyUrl()
              await fetch(
                `${proxyUrl}/__proxy__/navigate?url=${encodeURIComponent(normalizedUrl)}`,
              )
              return json({
                ok: true,
                proxyUrl,
                iframeSrc: `${proxyUrl}/?url=${encodeURIComponent(normalizedUrl)}`,
                url: normalizedUrl,
              })
            }

            case 'proxy-status': {
              return json({
                ok: true,
                proxyUrl: getProxyUrl(),
                target: getCurrentTarget(),
              })
            }

            case 'stream-start': {
              const result = await startBrowserStream()
              return json({
                ok: true,
                wsUrl: `ws://localhost:${result.port}`,
                ...result,
              })
            }

            default:
              return json(
                { error: `Unknown action: ${action}` },
                { status: 400 },
              )
          }
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
