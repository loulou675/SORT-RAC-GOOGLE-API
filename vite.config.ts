import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// The production function is plain JavaScript because Vercel loads it directly.
// @ts-expect-error No declaration file is needed for this local runtime adapter.
import analyzeImage from './api/analyze-image.js'

type VercelHandler = (
  request: { method?: string; body?: unknown },
  response: {
    statusCode: number
    setHeader(name: string, value: string): void
    status(code: number): unknown
    json(value: unknown): void
  },
) => Promise<unknown> | unknown

function localGoogleApi(): Plugin {
  return {
    name: 'local-google-api',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
      }

      server.middlewares.use('/api/analyze-image', async (
        request: IncomingMessage,
        response: ServerResponse,
        next: (error?: unknown) => void,
      ) => {
        if (request.method !== 'POST') {
          next()
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of request) chunks.push(chunk)

        let body
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'Invalid JSON request body' }))
          return
        }

        const vercelResponse: Parameters<VercelHandler>[1] = {
          statusCode: 200,
          setHeader(name, value) {
            response.setHeader(name, value)
          },
          status(code) {
            this.statusCode = code
            return this
          },
          json(value) {
            response.statusCode = this.statusCode
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(value))
          },
        }

        await (analyzeImage as VercelHandler)({ method: request.method, body }, vercelResponse)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), localGoogleApi()],
  server: {
    // Full-page refreshes are more reliable for this project than keeping a
    // long-lived HMR module graph across model/build changes.
    hmr: false,
    watch: {
      ignored: ['**/training/**'],
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
    globals: true,
  },
})
