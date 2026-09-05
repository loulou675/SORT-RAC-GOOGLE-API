import { ImageUp, RotateCcw, Search, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFlow } from '../app/useFlow'
import { TrainingFeedbackPanel } from '../components/TrainingFeedbackPanel'
import { messageForError, messageForErrorVi } from '../lib/errors'

export function ErrorPage() {
  const navigate = useNavigate()
  const { state, resetFlow } = useFlow()

  return (
    <section className="flow-layout narrow">
      <div className="error-panel">
        <p className="eyebrow">Try again</p>
        <h1>{messageForError(state.errorCode)}<span className="vi-note">{messageForErrorVi(state.errorCode)}</span></h1>
      </div>
      <TrainingFeedbackPanel imagePreview={state.imagePreview} predictedItemCode={state.predictedItemCode} errorCode={state.errorCode} inputMethod={state.inputMethod} />
      <div className="action-stack">
        <button type="button" className="primary-action large" onClick={() => navigate('/scan')}>
          <RotateCcw size={19} aria-hidden="true" />
          <span>Retake photo</span>
        </button>
        <button type="button" className="secondary-action large" onClick={() => navigate('/scan')}>
          <ImageUp size={19} aria-hidden="true" />
          <span>Upload another image</span>
        </button>
        <button type="button" className="ghost-action large" onClick={() => navigate('/search')}>
          <Search size={19} aria-hidden="true" />
          <span>Search manually</span>
        </button>
        <button
          type="button"
          className="ghost-action large"
          onClick={() => {
            resetFlow()
            navigate('/')
          }}
        >
          <Home size={19} aria-hidden="true" />
          <span>Return home</span>
        </button>
      </div>
    </section>
  )
}
