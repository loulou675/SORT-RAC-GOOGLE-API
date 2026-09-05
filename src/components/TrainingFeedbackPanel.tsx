import { Check, MessageSquareWarning, Search, Send, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { trainingTargetClassCodes } from '../config/modelClasses'
import { resultFeedbackEnabled } from '../config/trainingMode'
import { wasteItems } from '../data/referenceData'
import type { AppErrorCode } from '../lib/errors'
import {
  automaticFeedbackUploadConfigured,
  saveTrainingFeedback,
} from '../services/trainingFeedback'
import type { InputMethod } from '../types/domain'
import { trackFeature } from '../services/siteAnalytics'

interface TrainingFeedbackPanelProps {
  imagePreview?: string
  predictedItemCode?: string
  errorCode?: AppErrorCode
  inputMethod?: InputMethod
  submittedStatus?: 'uploaded' | 'queued'
  onCorrected?: (itemCode: string, uploaded: boolean) => void
  onSubmitted?: (uploaded: boolean) => void
}

type FeedbackKind = 'confirmation' | 'correction'

export function TrainingFeedbackPanel({ imagePreview, predictedItemCode, errorCode, inputMethod, submittedStatus, onCorrected, onSubmitted }: TrainingFeedbackPanelProps) {
  const [view, setView] = useState<'prompt' | 'correction'>(predictedItemCode ? 'prompt' : 'correction')
  const [query, setQuery] = useState('')
  const [correctedItemCode, setCorrectedItemCode] = useState('')
  const [note, setNote] = useState('')
  const [consented, setConsented] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedKind, setSubmittedKind] = useState<FeedbackKind>()
  const [uploaded, setUploaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const recognitionFailed = Boolean(errorCode)

  const itemOptions = useMemo(
    () => wasteItems
      .filter((item) => item.isActive && trainingTargetClassCodes.includes(item.code as (typeof trainingTargetClassCodes)[number]))
      .sort((left, right) => left.nameEn.localeCompare(right.nameEn)),
    [],
  )
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const unknownOption = itemOptions.find((item) => item.code === 'unknown' && item.code !== predictedItemCode)
    const matches = itemOptions
      .filter((item) => item.code !== predictedItemCode && item.code !== 'unknown')
      .filter((item) => {
        if (!normalizedQuery) return true
        return [item.nameEn, item.nameVi, ...item.aliasesEn, ...item.aliasesVi]
          .some((label) => label.toLowerCase().includes(normalizedQuery))
      })
      .slice(0, 7)

    return unknownOption ? [...matches, unknownOption] : matches
  }, [itemOptions, predictedItemCode, query])

  if (!resultFeedbackEnabled || !imagePreview) return null

  const selectedItem = itemOptions.find((item) => item.code === correctedItemCode)
  async function saveFeedback(itemCode: string, kind: FeedbackKind) {
    if (!itemCode || (kind === 'correction' && !consented)) return

    setSaving(true)
    setSaveError(undefined)
    try {
      const result = await saveTrainingFeedback({
        imageDataUrl: imagePreview as string,
        predictedItemCode,
        correctedItemCode: itemCode,
        inputMethod,
        errorCode,
        note: note.trim() || undefined,
        consentVersion: 'feedback-v1',
      })
      setUploaded(result.uploaded)
      setSubmittedKind(kind)
      setSubmitted(true)
      void trackFeature(kind === 'confirmation' ? 'feedback_confirmation' : 'feedback_correction', 'feedback_submitted')
      if (kind === 'correction') onCorrected?.(itemCode, result.uploaded)
      else onSubmitted?.(result.uploaded)
    } catch {
      setSaveError(`Could not save this ${kind === 'confirmation' ? 'feedback' : 'correction'}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  function confirmPrediction() {
    if (predictedItemCode) void saveFeedback(predictedItemCode, 'confirmation')
  }

  function submitCorrection() {
    if (correctedItemCode) void saveFeedback(correctedItemCode, 'correction')
  }

  if (submitted || submittedStatus) {
    const wasUploaded = uploaded || submittedStatus === 'uploaded'
    return (
      <section className="training-feedback feedback-thanks" aria-label="Result feedback">
        <div className="training-feedback-saved" role="status">
          <Check size={18} aria-hidden="true" />
          <span>
            {wasUploaded
              ? submittedKind === 'confirmation'
                ? 'Thanks. This image was sent to the review queue.'
                : 'Thanks. Your feedback was sent for review.'
              : 'Thanks. Your feedback is saved and will send automatically when online.'}
            <span className="vi-note">
              {wasUploaded ? 'Cảm ơn bạn. Phản hồi đã được gửi để duyệt.' : 'Cảm ơn bạn. Phản hồi đã được lưu và sẽ tự gửi khi có mạng.'}
            </span>
          </span>
        </div>
      </section>
    )
  }

  if (view === 'prompt') {
    return (
      <section className="training-feedback feedback-prompt" aria-label="Confirm AI result">
        <div className="feedback-verdict-copy">
          <h2>Is this result correct?</h2>
          <p>
            Selecting Yes privately saves this captured image and result for review and future AI training.
          </p>
        </div>
        <div className="feedback-verdict-actions">
          <button type="button" className="feedback-verdict-button yes" onClick={confirmPrediction} disabled={saving}>
            <Check size={16} aria-hidden="true" />
            <span>{saving ? 'Saving…' : 'Yes'}</span>
          </button>
          <button type="button" className="feedback-verdict-button no" onClick={() => setView('correction')} disabled={saving}>
            <X size={16} aria-hidden="true" />
            <span>No</span>
          </button>
        </div>
        {saveError ? <p className="inline-error">{saveError}</p> : null}
      </section>
    )
  }

  return (
    <section className="training-feedback feedback-editor" aria-label="Result correction">
      <div className="training-feedback-heading">
        <MessageSquareWarning size={18} aria-hidden="true" />
        <div>
          <p className="eyebrow">
            {recognitionFailed ? 'Give feedback' : 'Improve this result'}
          </p>
          <h2>
            {recognitionFailed ? 'Help identify this scan' : 'What is this item?'}
          </h2>
        </div>
      </div>
      <p className="training-feedback-copy">
        {recognitionFailed
          ? 'Exact-item and broad-material recognition both abstained. Choose the correct item so this scan can be reviewed.'
          : 'Choose the closest match. We review corrections before using them to train the AI.'}
        <span className="vi-note">
          {recognitionFailed
            ? 'Hệ thống chưa nhận diện đủ chắc chắn. Hãy chọn đúng vật để ảnh quét được duyệt.'
            : 'Hãy chọn vật gần đúng nhất. Mọi chỉnh sửa đều được duyệt trước khi dùng để huấn luyện AI.'}
        </span>
      </p>

      <label className="feedback-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search item name / Tìm tên vật"
          autoComplete="off"
        />
      </label>

      <div className="feedback-option-list" role="listbox" aria-label="Correct item">
        {visibleOptions.map((item) => {
          const selected = correctedItemCode === item.code
          return (
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={selected ? 'selected' : ''}
              onClick={() => setCorrectedItemCode(item.code)}
              key={item.code}
            >
              <span>
                {item.code === 'unknown' ? 'Something else / not listed' : item.nameEn}
                <span className="vi-note">{item.code === 'unknown' ? 'Vật khác / chưa có trong danh sách' : item.nameVi}</span>
              </span>
              {item.code === 'unknown' ? null : <small>{item.category}</small>}
              {selected ? <Check size={16} aria-hidden="true" /> : null}
            </button>
          )
        })}
        {visibleOptions.length === 0 ? <p className="feedback-empty">No matching item found.<span className="vi-note">Không tìm thấy vật phù hợp.</span></p> : null}
      </div>

      {selectedItem ? (
        <label className="training-feedback-field">
          <span>
            {selectedItem.code === 'unknown' ? 'What is it called?' : 'Optional note'}
            {selectedItem.code === 'unknown' ? <span className="vi-note">Vật này được gọi là gì?</span> : null}
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={selectedItem.code === 'unknown' ? 'Enter the item name / Nhập tên vật' : 'Lighting, condition, or anything unusual / Ánh sáng, tình trạng hoặc điểm bất thường'}
          />
        </label>
      ) : null}

      <label className="feedback-consent">
        <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
        <span>I agree to save the captured item image and this correction for AI review.<span className="vi-note">Tôi đồng ý lưu ảnh vật thể và chỉnh sửa này để duyệt AI.</span></span>
      </label>
      <p className="feedback-privacy-note">
        {automaticFeedbackUploadConfigured()
          ? 'After you send, the captured image and correction are uploaded privately for review.'
          : 'Saved on this device. Automatic upload will start after the project review queue is connected.'}
        <span className="vi-note">
          {automaticFeedbackUploadConfigured()
            ? 'Sau khi gửi, ảnh đã cắt và chỉnh sửa sẽ được tải lên riêng tư để duyệt.'
            : 'Dữ liệu được lưu trên thiết bị và sẽ tự tải lên khi hàng đợi duyệt được kết nối.'}
        </span>
      </p>

      <div className="feedback-actions">
        {predictedItemCode ? (
          <button type="button" className="ghost-action" onClick={() => setView('prompt')}>
            <span>Cancel</span>
          </button>
        ) : null}
        <button type="button" className="secondary-action" onClick={submitCorrection} disabled={!correctedItemCode || !consented || saving}>
          <Send size={16} aria-hidden="true" />
          <span>{saving ? 'Saving…' : 'Send correction'}</span>
        </button>
      </div>
      {saveError ? <p className="inline-error">{saveError}</p> : null}

    </section>
  )
}
