import { build, loadEnv } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const mode = process.env.NODE_ENV ?? 'production'
const env = loadEnv(mode, process.cwd(), '')
const resultFeedbackEnabled = env.VITE_RESULT_FEEDBACK !== 'false'
const feedbackUploadConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY,
)

if (resultFeedbackEnabled && !feedbackUploadConfigured) {
  throw new Error(
    'Result feedback is enabled, but Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or explicitly set VITE_RESULT_FEEDBACK=false.',
  )
}

await build({
  mode,
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})

const rootIndex = await readFile('docs/index.html', 'utf8')
const devStatsIndex = rootIndex
  .replaceAll('./assets/', '../assets/')
  .replaceAll('./favicon.svg', '../favicon.svg')

await mkdir('docs/devstats', { recursive: true })
await writeFile('docs/devstats/index.html', devStatsIndex)
