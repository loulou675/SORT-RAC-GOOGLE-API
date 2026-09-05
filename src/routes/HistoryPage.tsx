import { History, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearScanHistory, readScanHistory, type ScanHistoryEntry } from '../services/history'

export function HistoryPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([])

  useEffect(() => {
    setEntries(readScanHistory())
  }, [])

  return (
    <section className="flow-layout history-page">
      <div className="page-heading">
        <p className="eyebrow">History</p>
        <h1>Recently scanned items</h1>
        <p>Items are saved on this device only. Photos are not stored.<span className="vi-note">Thông tin vật thể chỉ được lưu trên thiết bị này. Ảnh không được lưu.</span></p>
      </div>

      {entries.length ? (
        <div className="history-list">
          {entries.map((entry) => (
            <button
              type="button"
              className="history-card"
              key={entry.id}
              onClick={() => navigate(
                entry.materialCode
                  ? `/?material=${entry.materialCode}&source=history`
                  : `/?item=${entry.itemCode}&source=history`,
              )}
            >
              <span className="history-dot" style={{ background: entry.destinationHex }} aria-hidden="true" />
              <span>
                <strong>{entry.itemName}</strong>
                <small>
                  {entry.itemNameVi} · {entry.destinationName} · {entry.inputMethod}
                </small>
              </span>
              <History size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-search">
          <h2>No scan history yet.<span className="vi-note">Chưa có lịch sử quét.</span></h2>
          <button type="button" className="primary-action large" onClick={() => navigate('/')}>
            <RotateCcw size={18} aria-hidden="true" />
            <span>Start scanning</span>
          </button>
        </div>
      )}

      {entries.length ? (
        <button
          type="button"
          className="ghost-action history-clear"
          onClick={() => {
            clearScanHistory()
            setEntries([])
          }}
        >
          <Trash2 size={17} aria-hidden="true" />
          <span>Clear history</span>
        </button>
      ) : null}
    </section>
  )
}
