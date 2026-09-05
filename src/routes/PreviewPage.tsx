import { Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFlow } from '../app/useFlow'
import { EmptyState } from '../components/EmptyState'
import { StatusBlock } from '../components/StatusBlock'
import { createVisionProvider, resetVisionProvider } from '../providers/vision'
import { AppError, toAppError } from '../lib/errors'

export function PreviewPage() {
  const navigate = useNavigate()
  const { state, setErrorCode, setPredictedItem, setImagePreview } = useFlow()
  const [status, setStatus] = useState<string | null>(null)

  if (!state.imagePreview) {
    return (
      <EmptyState title="No image selected / Chưa chọn ảnh">
        Return to scanning and capture or upload one item. / Hãy quay lại để chụp hoặc tải lên ảnh của một vật thể.
      </EmptyState>
    )
  }

  async function processImage() {
    if (!state.imagePreview) return

    try {
      setStatus('Preparing image...')
      await wait(180)
      setStatus('Identifying item...')
      let provider = await createVisionProvider(state.mockItemCode)
      let result
      try {
        result = await provider.identify(state.imagePreview)
      } catch (error) {
        const appError = error instanceof AppError ? error : toAppError(error, 'INFERENCE_FAILED')
        if (appError.code !== 'MODEL_LOAD_FAILED') throw error

        setStatus('Retrying the AI model...')
        resetVisionProvider()
        provider = await createVisionProvider(state.mockItemCode)
        result = await provider.identify(state.imagePreview)
      }
      setStatus('Checking disposal guidance...')
      await wait(180)
      if (result.kind === 'material') {
        navigate(`/?material=${result.materialCode}&source=vision`)
      } else {
        setPredictedItem(result.itemCode)
        navigate('/confirm')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      setErrorCode(toAppError(error, 'INFERENCE_FAILED').code)
      navigate('/scan/error')
    }
  }

  return (
    <section className="flow-layout">
      <div className="preview-frame">
        <img src={state.imagePreview} alt="Captured waste item preview" />
      </div>
      {status ? <StatusBlock message={status} /> : null}
      <div className="button-row full">
        <button type="button" className="primary-action" onClick={processImage} disabled={Boolean(status)}>
          <Check size={17} aria-hidden="true" />
          <span>Use photo</span>
        </button>
        <button type="button" className="secondary-action" onClick={() => navigate('/scan')} disabled={Boolean(status)}>
          <RotateCcw size={17} aria-hidden="true" />
          <span>Retake</span>
        </button>
        <button
          type="button"
          className="ghost-action"
          onClick={() => {
            setImagePreview(undefined)
            navigate('/')
          }}
          disabled={Boolean(status)}
        >
          <X size={17} aria-hidden="true" />
          <span>Cancel</span>
        </button>
      </div>
    </section>
  )
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
