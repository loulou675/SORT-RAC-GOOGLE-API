type FieldRecord = {
  id: string
  time: string
  outcome: 'Successful' | 'Unsuccessful'
}

const totalRequests = 73

// Stable example data for a presentation-only field-test log. The page itself
// makes clear that individual timestamps/outcomes are not production telemetry.
const records: FieldRecord[] = Array.from({ length: totalRequests }, (_, index) => {
  const minute = 11 * 60 + ((index * 37 + 11) % (4 * 60))
  const hour = Math.floor(minute / 60)
  const minutes = minute % 60
  const unsuccessful = new Set([4, 9, 16, 21, 29, 34, 42, 48, 53, 61, 68]).has(index)
  return {
    id: `FT-20260917-${String(index + 1).padStart(3, '0')}`,
    time: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    outcome: unsuccessful ? ('Unsuccessful' as const) : ('Successful' as const),
  }
}).sort((a, b) => a.time.localeCompare(b.time))

export function FieldTestStatsPage() {
  const completed = records.filter((record) => record.outcome === 'Successful').length
  const failed = records.length - completed

  return (
    <main className="fieldstats-page">
      <header className="fieldstats-header">
        <a href="/" className="fieldstats-brand">SỌRT RÁC</a>
        <span>FIELD TEST LOG</span>
      </header>

      <section className="fieldstats-intro">
        <p>17 September 2026 · 11:00–15:00 ICT</p>
        <h1>Field test statistics</h1>
        <p className="fieldstats-disclosure">
          Demonstration report using a 73-request aggregate. Individual row times and outcomes below are example records for presentation, not production telemetry.
        </p>
      </section>

      <section className="fieldstats-summary" aria-label="Field-test summary">
        <div><span>Requests recorded</span><strong>{totalRequests}</strong></div>
        <div><span>Successful</span><strong>{completed}</strong></div>
        <div><span>Unsuccessful</span><strong>{failed}</strong></div>
      </section>

      <section className="fieldstats-log" aria-labelledby="fieldstats-log-title">
        <div className="fieldstats-log-heading">
          <div>
            <p>Example records</p>
            <h2 id="fieldstats-log-title">Scan activity</h2>
          </div>
          <span>{records.length} rows</span>
        </div>
        <div className="fieldstats-table-wrap">
          <table>
            <thead>
              <tr><th>Record</th><th>Date</th><th>Time</th><th>Status</th><th>Result</th></tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>17 Sep 2026</td>
                  <td>{record.time}</td>
                  <td><span className="fieldstats-recorded">Recorded</span></td>
                  <td><span className={`fieldstats-status ${record.outcome === 'Successful' ? 'success' : 'failure'}`}>{record.outcome}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
