const pilot = {
  cameraStarts: 68,
  completed: 42,
  unresolved: 21,
  noOutcome: 5,
  completionRate: 66.7,
}

const scanActivity = [
  { time: '11:00', shortTime: '11:00', scans: 9, peak: true },
  { time: '11:20', shortTime: '11:20', scans: 12, peak: true },
  { time: '11:40', shortTime: '11:40', scans: 12, peak: true },
  { time: '12:00', shortTime: '12:00', scans: 4, peak: false },
  { time: '12:30', shortTime: '12:30', scans: 2, peak: false },
  { time: '13:00', shortTime: '13:00', scans: 2, peak: false },
  { time: '13:30', shortTime: '13:30', scans: 2, peak: false },
  { time: '14:00', shortTime: '14:00', scans: 2, peak: false },
  { time: '14:10', shortTime: '14:10', scans: 14, peak: true },
  { time: '14:30', shortTime: '14:30', scans: 5, peak: false },
  { time: '15:00–16:00', shortTime: '15–16', scans: 4, peak: false },
]

const chart = { left: 70, right: 950, top: 34, bottom: 248, maximum: 15 }
const chartPoints = scanActivity.map((entry, index) => ({
  ...entry,
  x: chart.left + ((chart.right - chart.left) * index) / (scanActivity.length - 1),
  y: chart.bottom - (entry.scans / chart.maximum) * (chart.bottom - chart.top),
}))

export function FieldTestStatsPage() {
  const recordedOutcomes = pilot.completed + pilot.unresolved

  return (
    <main className="fieldstats-page">
      <header className="fieldstats-header">
        <a href="/" className="fieldstats-brand">SỌRT RÁC</a>
        <span>VAS FIELD TEST / CAMERA TELEMETRY</span>
      </header>

      <section className="fieldstats-intro">
        <p>VAS cafeteria · Pilot day 1 · 17 September 2026</p>
        <h1>Field test statistics</h1>
        <p className="fieldstats-disclosure">
          One shared camera station. These figures describe camera starts and recognition outcomes, not individual students, visits, or returning users.
        </p>
      </section>

      <section className="fieldstats-overview" aria-label="VAS camera pilot summary">
        <article className="fieldstats-flow-card">
          <div className="fieldstats-panel-heading">
            <span>01</span><h2>Camera scan flow</h2><small>Pilot-day outcomes</small>
          </div>
          <div className="fieldstats-flow-total"><span>Total camera starts</span><strong>{pilot.cameraStarts}</strong></div>
          <FlowRow label="Completed with guidance" value={pilot.completed} tone="success" />
          <FlowRow label="Unresolved / needs another scan" value={pilot.unresolved} tone="error" />
          <FlowRow label="No recorded outcome" value={pilot.noOutcome} tone="neutral" />
          <p className="fieldstats-note">“No recorded outcome” means a flow started without a completion or error event, for example when a person left the flow.</p>
        </article>

        <article className="fieldstats-rate-card">
          <div className="fieldstats-panel-heading">
            <span>02</span><h2>Recognition outcome</h2><small>Completed vs. unresolved</small>
          </div>
          <div className="fieldstats-rate-content">
            <div className="fieldstats-rate-ring"><strong>{pilot.completionRate}%</strong><span>completion</span></div>
            <div>
              <p>The camera reached a recorded outcome for <strong>{recordedOutcomes}</strong> of {pilot.cameraStarts} starts.</p>
              <p className="fieldstats-note">The rate compares completed guidance with scans that ended unresolved. It does not measure user accuracy.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="fieldstats-chart" aria-labelledby="fieldstats-chart-title">
        <div className="fieldstats-panel-heading">
          <span>03</span><h2 id="fieldstats-chart-title">Observed scan activity by time</h2><small>11:00–16:00</small>
        </div>
        <div className="fieldstats-chart-wrap">
          <svg className="fieldstats-chart-svg" viewBox="0 0 1000 320" role="img" aria-label="Observed camera activity during the VAS pilot">
            <rect className="fieldstats-window lunch" x="67" y={chart.top} width="225" height={chart.bottom - chart.top} />
            <rect className="fieldstats-window snack" x="758" y={chart.top} width="110" height={chart.bottom - chart.top} />
            <text className="fieldstats-window-label" x="82" y="56">Lunch</text>
            <text className="fieldstats-window-label" x="772" y="56">Snack</text>
            {[0, 5, 10, 15].map((value) => {
              const y = chart.bottom - (value / chart.maximum) * (chart.bottom - chart.top)
              return <g key={value}><line x1={chart.left} x2={chart.right} y1={y} y2={y} /><text x="56" y={y + 5}>{value}</text></g>
            })}
            <line className="fieldstats-axis" x1={chart.left} x2={chart.right} y1={chart.bottom} y2={chart.bottom} />
            <polyline className="fieldstats-line" points={chartPoints.map((point) => `${point.x},${point.y}`).join(' ')} />
            {chartPoints.map((point) => (
              <g key={point.time}>
                <title>{`${point.time}: ${point.scans} camera starts`}</title>
                <circle className={point.peak ? 'fieldstats-point peak' : 'fieldstats-point'} cx={point.x} cy={point.y} r="7" />
                <text className="fieldstats-point-value" x={point.x} y={point.y - 15}>{point.scans}</text>
                <text className="fieldstats-axis-label" x={point.x} y="278">{point.shortTime}</text>
              </g>
            ))}
            <text className="fieldstats-y-title" x="18" y="142" transform="rotate(-90 18 142)">Camera starts</text>
          </svg>
        </div>
        <p className="fieldstats-chart-caption">The camera was placed in the VAS cafeteria. Activity clusters around lunch and snack periods, when students are most likely to dispose of food, drink containers, and packaging.</p>
      </section>
    </main>
  )
}

function FlowRow({ label, value, tone }: { label: string; value: number; tone: 'success' | 'error' | 'neutral' }) {
  return (
    <div className="fieldstats-flow-row">
      <div><span>{label}</span><strong>{value}</strong></div>
      <i><b className={tone} style={{ width: `${(value / pilot.cameraStarts) * 100}%` }} /></i>
    </div>
  )
}
