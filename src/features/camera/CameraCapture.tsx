import { Camera, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toAppError, type AppErrorCode } from '../../lib/errors'
import { measureFrameQuality } from './frameQuality'

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => Promise<boolean>
  onCancel: () => void
  onError: (code: AppErrorCode) => void
}

const QUALITY_SAMPLE_SIZE = 64
const CAPTURE_MAX_EDGE = 1600
const CAMERA_START_TIMEOUT_MS = Number(import.meta.env.VITE_CAMERA_START_TIMEOUT_MS ?? 12_000)

type CaptureState = 'preview' | 'needs-retake' | 'processing'

interface CapturedFrame {
  dataUrl: string
  qualitySample: Uint8ClampedArray
}

export function CameraCapture({ onCapture, onCancel, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const [facingMode] = useState<'environment' | 'user'>(() =>
    window.matchMedia('(max-width: 860px)').matches ? 'environment' : 'user',
  )
  const [status, setStatus] = useState('Starting camera...')
  const [statusVi, setStatusVi] = useState('Đang khởi động camera...')
  const [captureState, setCaptureState] = useState<CaptureState>('preview')
  const [capturedImage, setCapturedImage] = useState<string>()
  const isFrontCamera = facingMode === 'user'

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    function stopCamera() {
      stopStream(streamRef)
    }

    async function startCamera() {
      setStatus('Starting camera...')
      setStatusVi('Đang khởi động camera...')
      setCaptureState('preview')
      setCapturedImage(undefined)

      if (!navigator.mediaDevices?.getUserMedia) {
        onError('CAMERA_NOT_AVAILABLE')
        return
      }

      try {
        stopCamera()
        const stream = await getUserMediaWithTimeout({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        void enableContinuousFocus(stream)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        if (!cancelled) {
          setStatus('Point the camera at the item, then take a photo.')
          setStatusVi('Đưa camera vào vật cần quét rồi chụp ảnh.')
        }
      } catch (error) {
        const appError = toAppError(
          error,
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'CAMERA_PERMISSION_DENIED'
            : 'CAMERA_NOT_AVAILABLE',
        )
        onError(appError.code)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    void startCamera()

    return () => {
      cancelled = true
      mountedRef.current = false
      window.removeEventListener('keydown', handleKeyDown)
      stopCamera()
    }
  }, [facingMode, onCancel, onError])

  async function handleCapture() {
    const video = videoRef.current
    if (captureState === 'processing') return

    if (captureState === 'needs-retake') {
      setCapturedImage(undefined)
      setCaptureState('preview')
      setStatus('Point the camera at the item, then take a photo.')
      setStatusVi('Đưa camera vào vật cần quét rồi chụp ảnh.')
      try {
        await video?.play()
      } catch {
        onError('CAMERA_NOT_AVAILABLE')
      }
      return
    }

    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      onError('IMAGE_INVALID')
      return
    }

    const frame = captureFrame(video, isFrontCamera)
    if (!frame) {
      onError('IMAGE_INVALID')
      return
    }

    video.pause()
    setCapturedImage(frame.dataUrl)
    const quality = measureFrameQuality(frame.qualitySample, QUALITY_SAMPLE_SIZE)
    if (!quality.good) {
      setCaptureState('needs-retake')
      setStatus(`${quality.message} Retake the photo.`)
      setStatusVi('Ảnh chưa đủ rõ. Hãy điều chỉnh ánh sáng hoặc giữ máy ổn định rồi chụp lại.')
      return
    }

    setCaptureState('processing')
    setStatus('Identifying item...')
    setStatusVi('Đang nhận diện vật thể...')
    stopStream(streamRef)
    const recognised = await onCapture(frame.dataUrl)
    if (!mountedRef.current) return

    if (!recognised) {
      setStatus('No confident match. Opening the feedback form...')
      setStatusVi('Chưa có kết quả đủ chắc chắn. Đang mở biểu mẫu phản hồi...')
    }
  }

  return (
    <div className="camera-stage">
      <div className="camera-card" aria-live="polite">
        <div className={isFrontCamera ? 'camera-frame user-facing' : 'camera-frame'}>
          <video ref={videoRef} playsInline muted aria-label="Camera preview" />
          {capturedImage ? <img src={capturedImage} alt="Captured item" className="captured-camera-frame" /> : null}
        </div>
      </div>
      <p className="status-line" role="status">{status}<span className="vi-note">{statusVi}</span></p>
      <div className="camera-controls">
        <button type="button" className="camera-cancel-button" onClick={onCancel} aria-label="Close camera">
          <X size={20} aria-hidden="true" />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          className={captureState === 'needs-retake' ? 'camera-retake-button' : 'camera-shutter-button'}
          onClick={() => void handleCapture()}
          disabled={captureState === 'processing'}
          aria-label={captureState === 'needs-retake' ? 'Retake photo' : 'Take photo'}
          title={captureState === 'needs-retake' ? 'Retake photo' : 'Take photo'}
        >
          {captureState === 'needs-retake'
            ? <><RotateCcw size={21} aria-hidden="true" /><span>Retake</span></>
            : <Camera size={25} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function captureFrame(video: HTMLVideoElement, mirror: boolean): CapturedFrame | undefined {
  if (!video.videoWidth || !video.videoHeight) return undefined

  const scale = Math.min(1, CAPTURE_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return undefined

  if (mirror) {
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = QUALITY_SAMPLE_SIZE
  sampleCanvas.height = QUALITY_SAMPLE_SIZE
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true })
  if (!sampleContext) return undefined
  sampleContext.drawImage(canvas, 0, 0, QUALITY_SAMPLE_SIZE, QUALITY_SAMPLE_SIZE)

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    qualitySample: sampleContext.getImageData(0, 0, QUALITY_SAMPLE_SIZE, QUALITY_SAMPLE_SIZE).data,
  }
}

async function getUserMediaWithTimeout(constraints: MediaStreamConstraints) {
  let timedOut = false
  let timeoutId: number | undefined
  const mediaRequest = navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    if (timedOut) {
      stream.getTracks().forEach((track) => track.stop())
      throw new DOMException('Camera startup timed out.', 'NotReadableError')
    }
    return stream
  })
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      timedOut = true
      reject(new DOMException('Camera startup timed out.', 'NotReadableError'))
    }, CAMERA_START_TIMEOUT_MS)
  })

  try {
    return await Promise.race([mediaRequest, timeout])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

function stopStream(streamRef: { current: MediaStream | null }) {
  streamRef.current?.getTracks().forEach((track) => track.stop())
  streamRef.current = null
}

async function enableContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0]
  if (!track?.getCapabilities) return

  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[] }
    if (!capabilities.focusMode?.includes('continuous')) return
    await track.applyConstraints({
      advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
    })
  } catch {
    // Browsers without camera focus controls keep their native autofocus.
  }
}
