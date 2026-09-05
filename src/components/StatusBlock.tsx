export function StatusBlock({ message }: { message: string }) {
  return (
    <div className="status-block" aria-live="polite" aria-busy="true" aria-label={message}>
      <span className="status-spinner" aria-hidden="true" />
      <p>Loading…</p>
    </div>
  )
}
