import { z } from 'zod'
import { supabase } from '../lib/supabase/client'

const visitorStorageKey = 'sot-rac-analytics-visitor-v1'
const heartbeatMilliseconds = 15_000

const eventNames = [
  'page_view',
  'feature_use',
  'scan_success',
  'scan_error',
  'feedback_submitted',
  'survey_submitted',
] as const

export type AnalyticsEventName = (typeof eventNames)[number]

const devStatsSchema = z.object({
  periodDays: z.number().int(),
  generatedAt: z.string(),
  totals: z.object({
    visitors: z.number().int(),
    sessions: z.number().int(),
    avgActiveSeconds: z.number().int(),
    featureUses: z.number().int(),
  }),
  daily: z.array(z.object({
    date: z.string(),
    visitors: z.number().int(),
    sessions: z.number().int(),
    avgActiveSeconds: z.number().int(),
    featureUses: z.number().int(),
  })),
  features: z.array(z.object({ code: z.string(), uses: z.number().int() })),
  pages: z.array(z.object({ path: z.string(), views: z.number().int() })),
  devices: z.array(z.object({ category: z.string(), sessions: z.number().int() })),
  sources: z.array(z.object({ host: z.string(), sessions: z.number().int() })),
})

export type DevStats = z.infer<typeof devStatsSchema>

interface AnalyticsSession {
  id: string
  visitorId: string
  startedAt: string
  lastSeenAt: string
  activeSeconds: number
  pageViews: number
  entryPath: string
  exitPath: string
  deviceCategory: 'mobile' | 'tablet' | 'desktop'
  referrerHost?: string
}

let session: AnalyticsSession | undefined
let initialSync: Promise<boolean> | undefined
let heartbeatId: number | undefined
let visibleSince = 0
let analyticsStarted = false
let pageViewTracked = false
let sessionSynced = false

export function normalizeStatsPath(pathname = window.location.pathname, hash = window.location.hash) {
  const rawPath = `${pathname}${hash.split('?')[0]}`
  return (`/${rawPath}`.replace(/\/{2,}/g, '/').slice(0, 120) || '/').replace(/\/$/, '') || '/'
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function humanizeFeatureCode(code: string) {
  return code
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isInternalToolPath() {
  return /\/(?:devstats|dataset-review)\/?$/.test(window.location.pathname)
}

function analyticsAllowed() {
  const localTrackingAllowed = !import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_LOCAL === 'true'
  return localTrackingAllowed && !isInternalToolPath() && navigator.doNotTrack !== '1' && Boolean(supabase)
}

function randomUuid() {
  return crypto.randomUUID()
}

function storedUuid(storage: Storage, key: string) {
  const existing = storage.getItem(key)
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing
  const value = randomUuid()
  storage.setItem(key, value)
  return value
}

function referrerHost() {
  if (!document.referrer) return undefined
  try {
    const host = new URL(document.referrer).hostname.toLowerCase()
    return host && host !== window.location.hostname ? host.slice(0, 120) : undefined
  } catch {
    return undefined
  }
}

function deviceCategory(): AnalyticsSession['deviceCategory'] {
  const width = window.innerWidth
  if (width < 700) return 'mobile'
  if (width < 1100) return 'tablet'
  return 'desktop'
}

function createSession(): AnalyticsSession {
  const path = normalizeStatsPath()
  const now = new Date().toISOString()
  return {
    id: randomUuid(),
    visitorId: storedUuid(window.localStorage, visitorStorageKey),
    startedAt: now,
    lastSeenAt: now,
    activeSeconds: 0,
    pageViews: 1,
    entryPath: path,
    exitPath: path,
    deviceCategory: deviceCategory(),
    referrerHost: referrerHost(),
  }
}

function addVisibleTime() {
  if (!session || !visibleSince) return
  const elapsed = Math.max(0, Math.min(heartbeatMilliseconds / 1000, (Date.now() - visibleSince) / 1000))
  session.activeSeconds = Math.min(86_400, Math.round(session.activeSeconds + elapsed))
  session.lastSeenAt = new Date().toISOString()
  visibleSince = document.visibilityState === 'visible' ? Date.now() : 0
}

async function syncSession() {
  if (!session || !supabase) return false
  addVisibleTime()
  const { error } = await supabase.rpc('record_site_session', {
    p_id: session.id,
    p_visitor_id: session.visitorId,
    p_started_at: session.startedAt,
    p_last_seen_at: session.lastSeenAt,
    p_active_seconds: session.activeSeconds,
    p_page_views: session.pageViews,
    p_entry_path: session.entryPath,
    p_exit_path: session.exitPath,
    p_device_category: session.deviceCategory,
    p_referrer_host: session.referrerHost ?? null,
  })
  sessionSynced = !error
  if (error && import.meta.env.DEV) console.warn('Analytics session was not saved.', error.message)
  return sessionSynced
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    visibleSince = Date.now()
  } else {
    void syncSession()
  }
}

export function startSiteAnalytics() {
  if (analyticsStarted || !analyticsAllowed()) return
  analyticsStarted = true
  try {
    session = createSession()
  } catch {
    analyticsStarted = false
    return
  }
  visibleSince = document.visibilityState === 'visible' ? Date.now() : 0
  initialSync = syncSession()
  heartbeatId = window.setInterval(() => void syncSession(), heartbeatMilliseconds)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', () => void syncSession(), { once: true })
}

export async function trackPageView(featureCode = 'page_view') {
  if (!analyticsAllowed()) return
  if (!analyticsStarted) startSiteAnalytics()
  if (!session) return
  if (pageViewTracked) session.pageViews += 1
  pageViewTracked = true
  session.exitPath = normalizeStatsPath()
  await trackFeature(featureCode, 'page_view')
}

export async function trackFeature(featureCode: string, eventName: AnalyticsEventName = 'feature_use') {
  if (!analyticsAllowed()) return
  if (!analyticsStarted) startSiteAnalytics()
  if (!session || !supabase || !eventNames.includes(eventName)) return
  const normalizedFeature = featureCode.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 48)
  if (!normalizedFeature) return

  await initialSync
  if (!sessionSynced) await syncSession()
  if (!sessionSynced) return
  const { error } = await supabase.rpc('record_site_feature', {
    p_id: randomUuid(),
    p_session_id: session.id,
    p_visitor_id: session.visitorId,
    p_occurred_at: new Date().toISOString(),
    p_event_name: eventName,
    p_feature_code: normalizedFeature,
    p_path: normalizeStatsPath(),
  })
  if (error && import.meta.env.DEV) console.warn('Analytics event was not saved.', error.message)
}

export async function fetchDevStats(days: 7 | 30 | 90): Promise<DevStats> {
  if (import.meta.env.DEV && import.meta.env.VITE_DEVSTATS_MOCK === 'true') {
    return mockDevStats(days)
  }
  if (!supabase) throw new Error('Analytics is not configured for this build.')
  const { data, error } = await supabase.rpc('get_devstats', { p_days: days })
  if (error) throw new Error(error.message)
  return devStatsSchema.parse(data)
}

function mockDevStats(days: 7 | 30 | 90): DevStats {
  const visibleDays = Math.min(days, 30)
  const daily = Array.from({ length: visibleDays }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - visibleDays + index + 1)
    const visitors = 18 + ((index * 17) % 29)
    return {
      date: date.toISOString().slice(0, 10),
      visitors,
      sessions: visitors + 5 + (index % 8),
      avgActiveSeconds: 88 + ((index * 13) % 96),
      featureUses: visitors * 2 + (index % 11),
    }
  })
  const factor = days / 30
  return {
    periodDays: days,
    generatedAt: new Date().toISOString(),
    totals: {
      visitors: Math.round(742 * factor),
      sessions: Math.round(906 * factor),
      avgActiveSeconds: 142,
      featureUses: Math.round(1684 * factor),
    },
    daily,
    features: [
      { code: 'camera_scan', uses: Math.round(588 * factor) },
      { code: 'image_upload', uses: Math.round(414 * factor) },
      { code: 'manual_search', uses: Math.round(278 * factor) },
      { code: 'feedback_confirmation', uses: Math.round(226 * factor) },
      { code: 'history', uses: Math.round(112 * factor) },
      { code: 'survey_submitted', uses: Math.round(66 * factor) },
    ],
    pages: [
      { path: '/S-RT-R-C/#/', views: Math.round(1048 * factor) },
      { path: '/S-RT-R-C/#/history', views: Math.round(196 * factor) },
      { path: '/S-RT-R-C/#/about', views: Math.round(84 * factor) },
    ],
    devices: [
      { category: 'mobile', sessions: Math.round(646 * factor) },
      { category: 'desktop', sessions: Math.round(198 * factor) },
      { category: 'tablet', sessions: Math.round(62 * factor) },
    ],
    sources: [
      { host: 'Direct / unknown', sessions: Math.round(522 * factor) },
      { host: 'instagram.com', sessions: Math.round(212 * factor) },
      { host: 'google.com', sessions: Math.round(172 * factor) },
    ],
  }
}

export function stopSiteAnalyticsForTests() {
  if (heartbeatId) window.clearInterval(heartbeatId)
  heartbeatId = undefined
  analyticsStarted = false
  pageViewTracked = false
  sessionSynced = false
  session = undefined
  initialSync = undefined
  visibleSince = 0
  document.removeEventListener('visibilitychange', onVisibilityChange)
}
