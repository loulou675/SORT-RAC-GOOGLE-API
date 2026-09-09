import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  CircleX,
  Clock3,
  Gauge,
  MessageSquareText,
  RefreshCw,
  Repeat2,
  ScanLine,
  Smartphone,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchDevStats,
  formatDuration,
  humanizeFeatureCode,
} from '../services/siteAnalytics'
import type { DevStats } from '../services/siteAnalytics'

const ranges = [7, 30, 90] as const
type StatsRange = (typeof ranges)[number]

function appHomeHref() {
  return window.location.pathname.replace(/devstats\/?$/, '') || '/'
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)}%`
}

function formatDay(value: string, range: StatsRange) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en', range === 7
    ? { weekday: 'short' }
    : { month: 'short', day: 'numeric' }).format(date)
}

export function DevStatsPage() {
  const [range, setRange] = useState<StatsRange>(30)
  const [stats, setStats] = useState<DevStats>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [refreshKey, setRefreshKey] = useState(0)

  const loadStats = useCallback(() => setRefreshKey((current) => current + 1), [])

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(undefined)
    void fetchDevStats(range)
      .then((result) => {
        if (current) setStats(result)
      })
      .catch((loadError: unknown) => {
        if (!current) return
        setStats(undefined)
        setError(loadError instanceof Error ? loadError.message : 'Analytics could not be loaded.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [range, refreshKey])

  const maxVisitors = useMemo(
    () => Math.max(1, ...(stats?.daily.map((day) => day.visitors) ?? [])),
    [stats],
  )
  const maxFeatureUses = Math.max(1, ...(stats?.features.map((feature) => feature.uses) ?? []))
  const maxPageViews = Math.max(1, ...(stats?.pages.map((page) => page.views) ?? []))
  const maxFrequency = Math.max(1, ...(stats?.visitFrequency.map((item) => item.visitors) ?? []))
  const totalDeviceVisitors = stats?.devices.reduce((sum, device) => sum + device.visitors, 0) ?? 0
  const retentionDaily = useMemo(() => stats?.daily.slice(-7) ?? [], [stats])
  const retentionTotals = useMemo(
    () => retentionDaily.reduce(
      (totals, day) => ({
        newVisitors: totals.newVisitors + day.newVisitors,
        returningVisitors: totals.returningVisitors + day.returningVisitors,
      }),
      { newVisitors: 0, returningVisitors: 0 },
    ),
    [retentionDaily],
  )
  const hasData = Boolean(stats && stats.totals.sessions > 0)

  return (
    <main className="devstats-page">
      <header className="devstats-header">
        <a className="devstats-brand" href={appHomeHref()}>
          SỌRT RÁC <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <div className="devstats-header-actions">
          <div className="devstats-range" aria-label="Statistics date range">
            {ranges.map((days) => (
              <button
                type="button"
                key={days}
                className={range === days ? 'active' : ''}
                aria-pressed={range === days}
                onClick={() => setRange(days)}
              >
                {days}D
              </button>
            ))}
          </div>
          <button type="button" className="devstats-refresh" onClick={loadStats} disabled={loading} aria-label="Refresh statistics">
            <RefreshCw size={17} className={loading ? 'spinning' : ''} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="devstats-intro">
        <p className="devstats-kicker">Google API telemetry / aggregate view</p>
        <h1>How people use<br /><em>the sorter.</em></h1>
        <p className="devstats-intro-copy">
          Anonymous, privacy-minimized signals from real sessions. Dashboard visits are excluded from every figure below.
        </p>
      </section>

      {loading && !stats ? <DevStatsLoading /> : null}

      {error ? (
        <section className="devstats-message devstats-error" role="alert">
          <p className="devstats-kicker">Connection needed</p>
          <h2>The statistics endpoint is not ready.</h2>
          <p>{error}</p>
          <p>Apply the Supabase analytics migrations to enable anonymous collection and engagement reporting.</p>
          <button type="button" onClick={loadStats}>Try again</button>
        </section>
      ) : null}

      {!loading && stats && !hasData ? (
        <section className="devstats-message">
          <p className="devstats-kicker">Ready to collect</p>
          <h2>No tracked visits in this period yet.</h2>
          <p>Once people use the deployed sorter, daily visitors, active time, and feature activity will appear here.</p>
        </section>
      ) : null}

      {stats && hasData ? (
        <>
          <section className="devstats-kpi-grid" aria-label="Key metrics">
            <MetricCard icon={<UsersRound />} label="Visitors" value={formatCompact(stats.totals.visitors)} note={`Unique browsers / ${range} days`} tone="orange" />
            <MetricCard icon={<Activity />} label="Sessions" value={formatCompact(stats.totals.sessions)} note="Tracked site visits" tone="blue" />
            <MetricCard icon={<Repeat2 />} label="Returning visitors" value={formatCompact(stats.totals.returningVisitors)} note="Browsers seen before this period" tone="yellow" />
            <MetricCard icon={<ArrowDownRight />} label="Bounce rate" value={formatPercent(stats.totals.bounceRate)} note="1 page, under 10s, no action" tone="red" />
            <MetricCard icon={<Gauge />} label="Repeat visit rate" value={formatPercent(stats.totals.repeatVisitRate)} note="2+ sessions in this period" tone="blue" />
            <MetricCard icon={<Clock3 />} label="Avg. active time" value={formatDuration(stats.totals.avgActiveSeconds)} note="Visible, engaged time" tone="orange" />
          </section>

          <section className="devstats-dashboard-grid">
            <article className="devstats-panel devstats-traffic-panel">
              <PanelHeader index="01" title="Daily visitors" meta={`${range}-day view`} />
              <div className={`devstats-bars range-${range}`} role="img" aria-label="Daily unique visitors bar chart">
                {stats.daily.map((day, index) => (
                  <div className="devstats-bar-column" key={day.date} title={`${formatDay(day.date, range)}: ${day.visitors} visitors`}>
                    <span className="devstats-bar-value">{day.visitors}</span>
                    <span className="devstats-bar-track">
                      <i style={{ height: `${Math.max(4, (day.visitors / maxVisitors) * 100)}%` }} />
                    </span>
                    {(range === 7 || index === 0 || index === stats.daily.length - 1 || index % Math.ceil(stats.daily.length / 5) === 0) ? (
                      <small>{formatDay(day.date, range)}</small>
                    ) : <small aria-hidden="true">&nbsp;</small>}
                  </div>
                ))}
              </div>
            </article>

            <article className="devstats-panel devstats-retention-panel">
              <PanelHeader index="02" title="New vs. returning" meta="Last 7 days" />
              <div className="devstats-retention-summary">
                <span><strong>{formatCompact(retentionTotals.newVisitors)}</strong> new</span>
                <span><strong>{formatCompact(retentionTotals.returningVisitors)}</strong> returning</span>
              </div>
              <div className="devstats-retention-list" role="img" aria-label="Daily new and returning visitors">
                {retentionDaily.map((day) => {
                  const total = Math.max(1, day.newVisitors + day.returningVisitors)
                  return (
                    <div key={day.date} title={`${formatDay(day.date, range)}: ${day.newVisitors} new, ${day.returningVisitors} returning`}>
                      <small>{formatDay(day.date, range)}</small>
                      <span>
                        <i className="new" style={{ width: `${(day.newVisitors / total) * 100}%` }} />
                        <i className="returning" style={{ width: `${(day.returningVisitors / total) * 100}%` }} />
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="devstats-panel-note">Returning means the anonymous browser first visited before the current reporting period.</p>
            </article>

            <article className="devstats-panel devstats-engagement-panel">
              <PanelHeader index="03" title="Engagement quality" meta="Session-level view" />
              <div className="devstats-engagement-values">
                <div><span>Engaged sessions</span><strong>{formatCompact(stats.totals.engagedSessions)}</strong><small>{formatPercent(stats.totals.engagementRate)} of sessions</small></div>
                <div><span>Sessions / visitor</span><strong>{stats.totals.avgSessionsPerVisitor.toFixed(2)}x</strong><small>{formatCompact(stats.totals.repeatVisitors)} repeat browsers</small></div>
                <div><span>Feature actions</span><strong>{formatCompact(stats.totals.featureUses)}</strong><small>Scans, uploads, feedback + more</small></div>
              </div>
              <p className="devstats-panel-note">A bounce is one page view under 10 seconds with no interaction other than the automatic page load.</p>
            </article>

            <article className="devstats-panel devstats-scan-panel">
              <PanelHeader index="04" title="Scan health" meta="Recognition events" />
              <div className="devstats-scan-grid">
                <div><ScanLine size={17} aria-hidden="true" /><span>Scan starts</span><strong>{formatCompact(stats.scan.scanStarts)}</strong></div>
                <div><CircleCheck size={17} aria-hidden="true" /><span>Completed</span><strong>{formatCompact(stats.scan.scanSuccesses)}</strong></div>
                <div><CircleX size={17} aria-hidden="true" /><span>Errors</span><strong>{formatCompact(stats.scan.scanErrors)}</strong></div>
                <div><MessageSquareText size={17} aria-hidden="true" /><span>Feedback</span><strong>{formatCompact(stats.scan.feedbackSubmissions)}</strong></div>
              </div>
              <div className="devstats-success-rate"><span>Completion rate</span><strong>{formatPercent(stats.scan.scanSuccessRate)}</strong></div>
            </article>

            <article className="devstats-panel devstats-frequency-panel">
              <PanelHeader index="05" title="Visit frequency" meta="Sessions per browser" />
              <div className="devstats-frequency-list">
                {stats.visitFrequency.map((item) => (
                  <div key={item.bucket}>
                    <span>{item.bucket}</span>
                    <i><b style={{ width: `${(item.visitors / maxFrequency) * 100}%` }} /></i>
                    <strong>{formatCompact(item.visitors)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="devstats-panel">
              <PanelHeader index="06" title="Top features" meta="By action count" />
              <div className="devstats-ranking">
                {stats.features.map((feature, index) => (
                  <div className="devstats-rank-row" key={feature.label}>
                    <span className="devstats-rank-index">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="devstats-rank-label">
                        <strong>{humanizeFeatureCode(feature.label)}</strong>
                        <span>{formatCompact(feature.uses)}</span>
                      </div>
                      <span className="devstats-progress"><i style={{ width: `${(feature.uses / maxFeatureUses) * 100}%` }} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="devstats-panel">
              <PanelHeader index="07" title="Top pages" meta="By page views" />
              <div className="devstats-page-list">
                {stats.pages.map((page) => (
                  <div key={page.path}>
                    <span className="devstats-page-path" title={page.path}>{friendlyPath(page.path)}</span>
                    <span className="devstats-page-count">{formatCompact(page.views)}</span>
                    <i style={{ width: `${(page.views / maxPageViews) * 100}%` }} />
                  </div>
                ))}
              </div>
            </article>

            <article className="devstats-panel">
              <PanelHeader index="08" title="Device mix" meta="By unique browser" />
              <div className="devstats-device-list">
                {stats.devices.map((device) => {
                  const percentage = totalDeviceVisitors ? Math.round((device.visitors / totalDeviceVisitors) * 100) : 0
                  return (
                    <div key={device.label}>
                      <span className="devstats-device-icon"><Smartphone size={18} aria-hidden="true" /></span>
                      <span><strong>{humanizeFeatureCode(device.label)}</strong><small>{formatCompact(device.visitors)} visitors</small></span>
                      <b>{percentage}%</b>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="devstats-panel devstats-sources-panel">
              <PanelHeader index="09" title="Traffic sources" meta="Referral host only" />
              <div className="devstats-source-list">
                {stats.sources.map((source) => (
                  <div key={source.label}>
                    <span>{source.label}</span>
                    <strong>{formatCompact(source.visitors)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <footer className="devstats-footer">
            <p>Last updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(stats.generatedAt))}</p>
            <p>Daily totals use Vietnam time (UTC+7). A local anonymous browser ID only supports return-rate estimates; no names, images, locations, or raw visitor records are shown.</p>
          </footer>
        </>
      ) : null}
    </main>
  )
}

function MetricCard({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: string }) {
  return (
    <article className={`devstats-kpi tone-${tone}`}>
      <span className="devstats-kpi-icon">{icon}</span>
      <span className="devstats-kpi-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function PanelHeader({ index, title, meta }: { index: string; title: string; meta: string }) {
  return (
    <header className="devstats-panel-header">
      <span>{index}</span>
      <h2>{title}</h2>
      <small>{meta}</small>
    </header>
  )
}

function friendlyPath(path: string) {
  const hashRoute = path.split('#')[1] || '/'
  if (hashRoute === '/') return 'Waste scan'
  return humanizeFeatureCode(hashRoute.replace(/^\//, '').replace(/\//g, '_'))
}

function DevStatsLoading() {
  return (
    <section className="devstats-loading" aria-label="Loading statistics" aria-live="polite">
      <span>Loading aggregate data</span>
      <i /><i /><i /><i />
    </section>
  )
}
