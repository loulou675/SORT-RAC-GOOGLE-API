import { Check, Send, X } from 'lucide-react'
import { useState } from 'react'
import type { InputMethod } from '../types/domain'
import { saveUserSurvey } from '../services/userSurvey'
import { trackFeature } from '../services/siteAnalytics'

interface UserSurveyModalProps {
  inputMethod: InputMethod
  predictedItemCode?: string
  destinationBinCode?: string
  onClose: () => void
}

const scaleOptions = ['1', '2', '3', '4', '5']
const navigationOptions = [
  { value: 'Finding the scan feature', en: 'Finding the scan feature', vi: 'Tìm chức năng quét' },
  { value: 'Reading the result', en: 'Reading the result', vi: 'Đọc kết quả' },
  { value: 'Scanning another item', en: 'Scanning another item', vi: 'Quét thêm vật khác' },
  { value: 'Using the navigation bar', en: 'Using the navigation bar', vi: 'Dùng thanh điều hướng' },
  { value: 'Nothing was difficult', en: 'Nothing was difficult', vi: 'Không có phần nào khó' },
]
const improvementOptions = [
  { value: 'Recognition accuracy', en: 'Recognition accuracy', vi: 'Độ chính xác nhận diện' },
  { value: 'Scanning speed', en: 'Scanning speed', vi: 'Tốc độ quét' },
  { value: 'Result explanation', en: 'Result explanation', vi: 'Giải thích kết quả' },
  { value: 'Visual design', en: 'Visual design', vi: 'Thiết kế giao diện' },
  { value: 'Other', en: 'Other', vi: 'Khác' },
]

export function UserSurveyModal({ inputMethod, predictedItemCode, destinationBinCode, onClose }: UserSurveyModalProps) {
  const [scanningEase, setScanningEase] = useState('')
  const [guidanceClarity, setGuidanceClarity] = useState('')
  const [resultTrust, setResultTrust] = useState('')
  const [confusionPoint, setConfusionPoint] = useState('')
  const [confusionDetails, setConfusionDetails] = useState('')
  const [improvementPriority, setImprovementPriority] = useState('')
  const [additionalFeedback, setAdditionalFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = Boolean(scanningEase && guidanceClarity && resultTrust && confusionPoint && improvementPriority)

  async function submit() {
    if (!canSubmit || saving) return
    setSaving(true)
    await saveUserSurvey({
      inputMethod,
      predictedItemCode,
      destinationBinCode,
      scanningEase,
      guidanceClarity,
      resultTrust,
      confusionPoint,
      confusionDetails: formatOpenFeedback(confusionDetails, additionalFeedback),
      improvementPriority,
    })
    setSubmitted(true)
    void trackFeature('survey_submitted', 'survey_submitted')
    setSaving(false)
  }

  return (
    <div className="survey-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="survey-dialog" role="dialog" aria-modal="true" aria-labelledby="survey-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="survey-close" aria-label="Close survey" onClick={onClose}>
          <X size={19} aria-hidden="true" />
        </button>

        {submitted ? (
          <div className="survey-success">
            <span className="survey-success-icon"><Check size={24} aria-hidden="true" /></span>
            <h2>Thanks for helping us improve.<span className="vi-note">Cảm ơn bạn đã giúp chúng mình cải thiện.</span></h2>
            <p>Your feedback has been saved.<span className="vi-note">Phản hồi của bạn đã được lưu.</span></p>
            <button type="button" className="primary-action" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <header className="survey-header">
              <p className="eyebrow">Quick feedback</p>
              <h2 id="survey-title">How was your first scan?<span className="vi-note">Lần quét đầu tiên của bạn thế nào?</span></h2>
              <p>Your answers help us improve SỌRT RÁC.<span className="vi-note">Câu trả lời của bạn giúp SỌRT RÁC tốt hơn.</span></p>
            </header>

            <div className="survey-question-list">
              <SurveyScaleQuestion
                number="1"
                label="How easy was it to complete the waste identification process?"
                labelVi="Bạn thấy quá trình nhận diện rác dễ đến mức nào?"
                value={scanningEase}
                leftLabel="Very difficult"
                leftLabelVi="Rất khó"
                rightLabel="Very easy"
                rightLabelVi="Rất dễ"
                onChange={setScanningEase}
              />
              <SurveyScaleQuestion
                number="2"
                label="How clear was the disposal guidance?"
                labelVi="Hướng dẫn phân loại rõ ràng đến mức nào?"
                value={guidanceClarity}
                leftLabel="Very unclear"
                leftLabelVi="Rất khó hiểu"
                rightLabel="Very clear"
                rightLabelVi="Rất rõ ràng"
                onChange={setGuidanceClarity}
              />
              <SurveyScaleQuestion
                number="3"
                label="How much do you trust this result?"
                labelVi="Bạn tin kết quả này đến mức nào?"
                value={resultTrust}
                leftLabel="Do not trust"
                leftLabelVi="Không tin"
                rightLabel="Fully trust"
                rightLabelVi="Hoàn toàn tin"
                onChange={setResultTrust}
              />
              <SurveyQuestion
                number="4"
                label="Which part of the interface was hardest to use?"
                labelVi="Phần nào của giao diện khó sử dụng nhất?"
                value={confusionPoint}
                options={navigationOptions}
                onChange={setConfusionPoint}
              />
              {confusionPoint ? (
                <label className="survey-why">
                  <span>Could you tell us why?<span className="vi-note">Bạn có thể nói rõ hơn không?</span> <small>Optional / Không bắt buộc</small></span>
                  <textarea value={confusionDetails} onChange={(event) => setConfusionDetails(event.target.value)} placeholder="Tell us what felt difficult or unclear / Hãy chia sẻ điều khiến bạn thấy khó hoặc chưa rõ" rows={2} maxLength={200} />
                </label>
              ) : null}
              <SurveyQuestion
                number="5"
                label="What should we improve first?"
                labelVi="Nên ưu tiên cải thiện điều gì?"
                value={improvementPriority}
                options={improvementOptions}
                onChange={setImprovementPriority}
              />
              <section className="survey-question survey-open-question" aria-labelledby="survey-open-question-title">
                <div className="survey-open-heading">
                  <span className="survey-question-number">6</span>
                  <span className="survey-open-label" id="survey-open-question-title">
                    What else would you like to tell us about your experience?
                    <span className="vi-note">Bạn còn muốn chia sẻ điều gì về trải nghiệm này?</span>
                    <small>Optional</small>
                  </span>
                </div>
                <textarea
                  aria-label="Additional feedback"
                  value={additionalFeedback}
                  onChange={(event) => setAdditionalFeedback(event.target.value)}
                  placeholder="Share any idea, concern, or suggestion / Chia sẻ ý tưởng, băn khoăn hoặc đề xuất"
                  rows={3}
                  maxLength={200}
                />
              </section>
            </div>

            <button type="button" className="primary-action survey-submit" onClick={submit} disabled={!canSubmit || saving}>
              <Send size={16} aria-hidden="true" />
              <span>{saving ? 'Saving…' : 'Send feedback'}</span>
            </button>
          </>
        )}
      </section>
    </div>
  )
}

function formatOpenFeedback(navigationDetails: string, additionalFeedback: string) {
  const entries = [
    navigationDetails.trim() ? `Navigation detail: ${navigationDetails.trim()}` : '',
    additionalFeedback.trim() ? `Additional feedback: ${additionalFeedback.trim()}` : '',
  ].filter(Boolean)

  return entries.length ? entries.join('\n\n') : undefined
}

function SurveyScaleQuestion({
  number,
  label,
  labelVi,
  value,
  leftLabel,
  leftLabelVi,
  rightLabel,
  rightLabelVi,
  onChange,
}: {
  number: string
  label: string
  labelVi: string
  value: string
  leftLabel: string
  leftLabelVi: string
  rightLabel: string
  rightLabelVi: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="survey-question">
      <legend><span>{number}</span><span>{label}<span className="vi-note">{labelVi}</span></span><b aria-label="Required">*</b></legend>
      <div className="survey-scale">
        <div className="survey-scale-numbers" aria-hidden="true">
          {scaleOptions.map((option) => <span key={option}>{option}</span>)}
        </div>
        <div className="survey-scale-row">
          <div className="survey-scale-options">
            {scaleOptions.map((option) => (
              <label className={value === option ? 'survey-scale-option selected' : 'survey-scale-option'} key={option}>
                <input type="radio" name={`survey-${number}`} value={option} checked={value === option} onChange={() => onChange(option)} required />
                <span aria-hidden="true" />
              </label>
            ))}
          </div>
          <div className="survey-scale-endpoints">
            <span className="survey-scale-anchor survey-scale-anchor-left">{leftLabel}<span className="vi-note">{leftLabelVi}</span></span>
            <span className="survey-scale-anchor survey-scale-anchor-right">{rightLabel}<span className="vi-note">{rightLabelVi}</span></span>
          </div>
        </div>
      </div>
    </fieldset>
  )
}

function SurveyQuestion({ number, label, labelVi, value, options, onChange }: {
  number: string
  label: string
  labelVi: string
  value: string
  options: Array<{ value: string; en: string; vi: string }>
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="survey-question">
      <legend><span>{number}</span><span>{label}<span className="vi-note">{labelVi}</span></span><b aria-label="Required">*</b></legend>
      <div className="survey-options">
        {options.map((option) => (
          <label className={value === option.value ? 'survey-option selected' : 'survey-option'} key={option.value}>
            <input type="radio" name={`survey-${number}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} required />
            <span>{option.en}<span className="vi-note">{option.vi}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
