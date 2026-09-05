import { Check, Move, RotateCcw, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

interface CropEditorProps {
  source: string
  onApply: (dataUrl: string) => void
  onCancel: () => void
  onRetake: () => void
}

interface ImageInfo {
  width: number
  height: number
}

interface ImageLayout {
  scale: number
  width: number
  height: number
  left: number
  top: number
}

const OUTPUT_SIZE = 960

export function CropEditor({ source, onApply, onCancel, onRetake }: CropEditorProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [viewportSize, setViewportSize] = useState(0)
  const [imageInfo, setImageInfo] = useState<ImageInfo>()
  const [zoom, setZoom] = useState(1)
  const [layout, setLayout] = useState<ImageLayout>()
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateSize = () => setViewportSize(viewport.clientWidth)
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!imageInfo || !viewportSize) return

    const scale = Math.max(viewportSize / imageInfo.width, viewportSize / imageInfo.height) * zoom
    const width = imageInfo.width * scale
    const height = imageInfo.height * scale
    const previousCenter = layout
      ? { x: layout.left + layout.width / 2, y: layout.top + layout.height / 2 }
      : { x: viewportSize / 2, y: viewportSize / 2 }

    setLayout({
      scale,
      width,
      height,
      left: clampPosition(previousCenter.x - width / 2, width, viewportSize),
      top: clampPosition(previousCenter.y - height / 2, height, viewportSize),
    })
    // Layout changes are driven by image size, viewport size, or zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageInfo, viewportSize, zoom])

  function handleImageLoad() {
    const image = imageRef.current
    if (!image) return
    setImageInfo({ width: image.naturalWidth, height: image.naturalHeight })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!layout) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, left: layout.left, top: layout.top }
    setDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || !layout || !viewportSize) return

    setLayout({
      ...layout,
      left: clampPosition(drag.left + event.clientX - drag.x, layout.width, viewportSize),
      top: clampPosition(drag.top + event.clientY - drag.y, layout.height, viewportSize),
    })
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(false)
  }

  function applyCrop() {
    const image = imageRef.current
    if (!image || !layout || !viewportSize) return

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    if (!context) return

    context.fillStyle = '#f4f1e8'
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const outputScale = OUTPUT_SIZE / viewportSize
    context.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      layout.left * outputScale,
      layout.top * outputScale,
      layout.width * outputScale,
      layout.height * outputScale,
    )
    onApply(canvas.toDataURL('image/jpeg', 0.92))
  }

  return (
    <div className="crop-editor" aria-live="polite">
      <div
        ref={viewportRef}
        className={dragging ? 'crop-viewport is-dragging' : 'crop-viewport'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        role="application"
        aria-label="Crop image to the focus frame. Drag to reposition the item."
      >
        <img
          ref={imageRef}
          src={source}
          alt="Image being cropped"
          className="crop-image"
          style={layout ? { width: layout.width, height: layout.height, left: layout.left, top: layout.top } : undefined}
          onLoad={handleImageLoad}
          draggable={false}
        />
        <div className="crop-frame" aria-hidden="true" />
      </div>
      <p className="crop-hint">
        <Move size={15} aria-hidden="true" />
        <span>Drag to reposition. Zoom in or out to fit the item.<span className="vi-note">Kéo để căn lại. Phóng to hoặc thu nhỏ để vật thể vừa khung.</span></span>
      </p>
      <label className="crop-zoom">
        <span><ZoomIn size={15} aria-hidden="true" /> Zoom in / out</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.01"
          value={zoom}
          aria-label="Zoom image"
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      <div className="button-row full crop-actions">
        <button type="button" className="primary-action" onClick={applyCrop} disabled={!layout}>
          <Check size={17} aria-hidden="true" />
          <span>Use crop</span>
        </button>
        <button type="button" className="secondary-action" onClick={onRetake}>
          <RotateCcw size={17} aria-hidden="true" />
          <span>Retake</span>
        </button>
        <button type="button" className="ghost-action" onClick={onCancel}>
          <X size={17} aria-hidden="true" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}

function clampPosition(value: number, imageSize: number, viewportSize: number) {
  if (imageSize <= viewportSize) {
    return (viewportSize - imageSize) / 2
  }

  return Math.min(Math.max(value, viewportSize - imageSize), 0)
}
