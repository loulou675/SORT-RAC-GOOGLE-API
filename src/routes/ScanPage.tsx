import { Camera, ImageUp, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFlow } from '../app/useFlow'
import { CameraCapture } from '../features/camera/CameraCapture'
import { fileToDataUrl } from '../features/camera/fileInput'
import { toAppError } from '../lib/errors'
import { wasteItems } from '../data/referenceData'

export function ScanPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const { state, setImagePreview, setErrorCode, setMockItemCode } = useFlow()
  const mockEnabled = import.meta.env.VITE_USE_MOCK_VISION === 'true'

  async function handleFile(file?: File) {
    if (!file) return

    try {
      const dataUrl = await fileToDataUrl(file)
      setImagePreview(dataUrl, 'upload')
      navigate('/scan/preview')
    } catch (error) {
      setErrorCode(toAppError(error, 'IMAGE_INVALID').code)
      navigate('/scan/error')
    }
  }

  if (cameraOpen) {
    return (
      <CameraCapture
        onCapture={async (dataUrl) => {
          setImagePreview(dataUrl, 'camera')
          navigate('/scan/preview')
          return true
        }}
        onCancel={() => setCameraOpen(false)}
        onError={(code) => {
          setErrorCode(code)
          navigate('/scan/error')
        }}
      />
    )
  }

  return (
    <section className="flow-layout narrow">
      <div className="page-heading">
        <p className="eyebrow">Scan one item</p>
        <h1>Place one item clearly in view.</h1>
        <p>Camera access starts only after you choose the camera option.<span className="vi-note">Camera chỉ bật sau khi bạn chọn chức năng quét.</span></p>
      </div>

      {mockEnabled ? (
        <label className="mock-panel">
          <span>Development Mock Mode</span>
          <select value={state.mockItemCode} onChange={(event) => setMockItemCode(event.target.value)}>
            {wasteItems
              .filter((item) => item.code !== 'unknown')
              .slice(0, 18)
              .map((item) => (
                <option value={item.code} key={item.code}>
                  {item.nameEn}
                </option>
              ))}
            <option value="force_error">Force unclear result</option>
          </select>
        </label>
      ) : null}

      <div className="action-stack">
        <button type="button" className="primary-action large" onClick={() => setCameraOpen(true)}>
          <Camera size={19} aria-hidden="true" />
          <span>Scan an item</span>
        </button>
        <button type="button" className="secondary-action large" onClick={() => inputRef.current?.click()}>
          <ImageUp size={19} aria-hidden="true" />
          <span>Upload image</span>
        </button>
        <button type="button" className="ghost-action large" onClick={() => navigate('/search')}>
          <Search size={19} aria-hidden="true" />
          <span>Search manually</span>
        </button>
      </div>

      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </section>
  )
}
