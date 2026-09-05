import { Check, RotateCcw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFlow } from '../app/useFlow'
import { EmptyState } from '../components/EmptyState'
import { ItemGlyph } from '../components/ItemGlyph'
import { TrainingFeedbackPanel } from '../components/TrainingFeedbackPanel'
import { getItem, hasConditionQuestion } from '../features/sorting/ruleEngine'

export function ConfirmPage() {
  const navigate = useNavigate()
  const { state, setConfirmedItem } = useFlow()
  const item = state.predictedItemCode ? getItem(state.predictedItemCode) : undefined

  if (!item) {
    return (
      <EmptyState title="No item identified / Chưa nhận diện được vật thể">
        Scan again or use manual search to continue. / Hãy quét lại hoặc tìm kiếm thủ công để tiếp tục.
      </EmptyState>
    )
  }

  function continueFlow() {
    if (!item) return
    setConfirmedItem(item.code)
    if (hasConditionQuestion(item.code)) {
      navigate(`/condition?item=${item.code}`)
    } else {
      navigate(`/result?item=${item.code}&condition=default`)
    }
  }

  return (
    <section className="flow-layout narrow">
      <div className="identified-card">
        <ItemGlyph objectType={item.objectType} />
        <p>We identified this as:<span className="vi-note">Vật thể được nhận diện là:</span></p>
        <h1>{item.nameEn}</h1>
        <span>{item.nameVi}</span>
      </div>
      <TrainingFeedbackPanel imagePreview={state.imagePreview} predictedItemCode={state.predictedItemCode} inputMethod={state.inputMethod} />

      <div className="action-stack">
        <button type="button" className="primary-action large" onClick={continueFlow}>
          <Check size={19} aria-hidden="true" />
          <span>Yes, continue</span>
        </button>
        <button type="button" className="secondary-action large" onClick={() => navigate('/search')}>
          <Search size={19} aria-hidden="true" />
          <span>This is not correct</span>
        </button>
        <button type="button" className="ghost-action large" onClick={() => navigate('/scan')}>
          <RotateCcw size={19} aria-hidden="true" />
          <span>Retake photo</span>
        </button>
      </div>
    </section>
  )
}
