import { Sparkles, TriangleAlert, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ReactNode } from 'react'
import { getEcoTip } from '../data/ecoTips'
import type { Bin, RecognitionDetails, RuleEngineResult } from '../types/domain'
import { EcoTipCard } from './EcoTipCard'

interface BinPanelProps {
  bin: Bin
  result?: RuleEngineResult
  recognitionDetails?: RecognitionDetails
  compact?: boolean
  resultPanel?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onClose?: () => void
  footer?: ReactNode
}

export function BinPanel({ bin, result, recognitionDetails, compact = false, resultPanel = false, collapsed = false, onToggleCollapsed, onClose, footer }: BinPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ startY: number; startOffset: number; currentOffset: number; lastY: number; lastTime: number; velocity: number } | null>(null)
  const suppressClickRef = useRef(false)
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const className = ['bin-panel', compact ? 'compact' : '', resultPanel ? 'result-panel' : '', collapsed ? 'collapsed' : '', dragging ? 'dragging' : '']
    .filter(Boolean)
    .join(' ')
  const heading = result?.specialHandling ? 'Hazardous' : bin.nameEn
  const panelInk = bin.code === 'special_handling' ? '#171411' : '#fffaf4'
  const featuredTip = getEcoTip(result?.reuseSuggestions[0]?.code)

  function collapsedOffset() {
    const panel = panelRef.current
    const panelHeight = panel?.getBoundingClientRect().height ?? window.innerHeight
    const peekHeight = panel
      ? Number.parseFloat(window.getComputedStyle(panel).getPropertyValue('--sheet-peek-height')) || 144
      : 144
    return Math.max(0, panelHeight - peekHeight)
  }

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!onToggleCollapsed || event.pointerType === 'mouse' && event.button !== 0) return

    const startOffset = collapsed ? collapsedOffset() : 0
    dragRef.current = {
      startY: event.clientY,
      startOffset,
      currentOffset: startOffset,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
    }
    setDragOffset(startOffset)
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag) return

    const now = performance.now()
    const elapsed = Math.max(1, now - drag.lastTime)
    drag.velocity = (event.clientY - drag.lastY) / elapsed
    drag.lastY = event.clientY
    drag.lastTime = now

    const nextOffset = Math.min(collapsedOffset(), Math.max(0, drag.startOffset + event.clientY - drag.startY))
    drag.currentOffset = nextOffset
    setDragOffset(nextOffset)
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag) return

    const finalOffset = drag.currentOffset
    const maxOffset = collapsedOffset()
    const shouldCollapse = drag.velocity > 0.35
      ? true
      : drag.velocity < -0.35
        ? false
        : finalOffset > maxOffset * 0.42

    dragRef.current = null
    suppressClickRef.current = Math.abs(event.clientY - drag.startY) > 5
    setDragging(false)
    setDragOffset(null)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (shouldCollapse !== collapsed) onToggleCollapsed?.()
  }

  return (
    <aside
      ref={panelRef}
      className={className}
      style={{
        '--bin-color': bin.colorHex,
        '--bin-ink': panelInk,
        ...(dragOffset === null ? {} : { '--sheet-drag-y': `${dragOffset}px` }),
      } as CSSProperties}
    >
      {resultPanel ? (
        <>
          <button
            type="button"
            className="sheet-handle"
            aria-label={collapsed ? 'Expand result panel' : 'Collapse result panel'}
            aria-expanded={!collapsed}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false
                return
              }
              onToggleCollapsed?.()
            }}
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span />
          </button>
          {onClose ? (
            <button type="button" className="result-panel-close" aria-label="Close result panel" onClick={onClose}>
              <X size={19} aria-hidden="true" />
            </button>
          ) : null}
        </>
      ) : null}
      <div className="result-panel-body" aria-hidden={resultPanel && collapsed ? true : undefined}>
        <div className="result-heading">
          <p className="eyebrow">
            {result?.matchLevel === 'material' ? 'Material-based result' : 'This object belongs to'}
          </p>
          <h2>{heading}</h2>
          <p className="object-name">
            {result?.item.nameEn ?? 'Object name'}
            <span className="vi-note">{result?.item.nameVi ?? 'Tên vật thể'}</span>
          </p>
          {result?.specialHandling ? (
            <p className="special-note">Special handling required</p>
          ) : null}
          {!resultPanel ? <p className="bin-color">{bin.colorName} Bin</p> : null}
        </div>

        {result ? (
          <div className="panel-card-stack steps-only">
            {recognitionDetails ? (
              <RecognitionSummary
                details={recognitionDetails}
                fallbackBin={bin}
                componentActions={result.componentActions}
              />
            ) : null}
            {result.matchLevel === 'material' ? (
              <section className="material-result-note" aria-label="Material result notice">
                <strong>Exact item not identified<span className="vi-note">Chưa xác định chính xác vật thể</span></strong>
                <p>This guidance comes from a separate broad-material model.<span className="vi-note">Hướng dẫn này dựa trên mô hình nhận diện nhóm vật liệu.</span></p>
              </section>
            ) : null}
            <section className="why-bin-section" aria-labelledby="why-bin-heading">
              <h3 id="why-bin-heading">Why this bin?</h3>
              <p>{result.whyCategory}<span className="vi-note">{result.whyCategoryVi}</span></p>
            </section>
            {result.matchLevel === 'material' && result.warning ? (
              <section className="material-result-warning" aria-label="Important material guidance">
                <span className="material-warning-icon" aria-hidden="true">
                  <TriangleAlert size={21} strokeWidth={2.25} />
                </span>
                <div>
                  <strong>Important</strong>
                  <p>{result.warning}<span className="vi-note">{result.warningVi}</span></p>
                </div>
              </section>
            ) : null}
            {featuredTip ? (
              <section className="result-eco-tip" aria-labelledby="result-eco-tip-heading">
                <div className="result-section-heading">
                  <h3 id="result-eco-tip-heading">Ways to recycle</h3>
                </div>
                <EcoTipCard tip={featuredTip} compact />
              </section>
            ) : null}
          </div>
        ) : (
          <div className="instruction-card">
            <strong>Preparation steps:</strong>
            <ol>
              <li>Identify one item.<span className="vi-note">Nhận diện một vật thể.</span></li>
              <li>Answer only relevant questions.<span className="vi-note">Chỉ trả lời câu hỏi liên quan.</span></li>
              <li>Follow the recommended bin guidance.<span className="vi-note">Làm theo hướng dẫn phân loại được đề xuất.</span></li>
            </ol>
          </div>
        )}
        {footer}
      </div>
    </aside>
  )
}

function RecognitionSummary({
  details,
  fallbackBin,
  componentActions,
}: {
  details: RecognitionDetails
  fallbackBin: Bin
  componentActions: RuleEngineResult['componentActions']
}) {
  return (
    <section className="recognition-summary" aria-labelledby="recognition-summary-heading">
      <div className="recognition-summary-title">
        <span className="recognition-summary-icon" aria-hidden="true"><Sparkles size={18} /></span>
        <div>
          <p className="eyebrow">Image analysis</p>
          <p id="recognition-summary-heading" className="recognition-summary-description">
            {shortAnalysisDescription(details.reason, details.observedLabel)}
          </p>
        </div>
      </div>
      <div className="recognition-facts">
        <div>
          <span>Material</span>
          <strong>{details.materialLabel}</strong>
        </div>
        <div>
          <span>Condition</span>
          <strong className={`recognition-condition ${details.condition}`}>{conditionLabel(details.condition)}</strong>
        </div>
      </div>
      {details.parts.length ? (
        <div className="recognition-parts">
          <span>Visible parts</span>
          <ul>
            {details.parts.map((part, index) => (
              <li
                key={`${part.name}-${index}`}
                style={{ '--part-bin-color': findPartRoute(part.name, componentActions)?.destinationBin.colorHex ?? fallbackBin.colorHex } as CSSProperties}
              >
                <strong>{part.name}</strong>
                <small>{getPartInstruction(part.name, componentActions, fallbackBin)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function shortAnalysisDescription(reason: string, fallbackLabel: string) {
  const concise = reason
    .replace(/^the main object is\s+/i, '')
    .replace(/,?\s*clearly matching\b[^.!?]*[.!?]?/gi, '')
    .replace(/,?\s*matching\b[^.!?]*\bcatalogue item[.!?]?/gi, '')
    .trim()

  if (!concise) return fallbackLabel
  return concise.length > 120 ? `${concise.slice(0, 117).trimEnd()}...` : concise
}

function findPartRoute(partName: string, componentActions: RuleEngineResult['componentActions']) {
  const normalizedPartName = partName.trim().toLocaleLowerCase()
  return componentActions.find((component) => {
    const normalizedComponentName = component.componentEn.trim().toLocaleLowerCase()
    return normalizedPartName.includes(normalizedComponentName) || normalizedComponentName.includes(normalizedPartName)
  })
}

function getPartInstruction(partName: string, componentActions: RuleEngineResult['componentActions'], fallbackBin: Bin) {
  const route = findPartRoute(partName, componentActions)
  if (!route) return `Place in ${fallbackBin.nameEn}.`
  if (route.disposalNoteEn && route.disposalNoteEn !== route.destinationBin.nameEn) return route.disposalNoteEn
  return `Place in ${route.destinationBin.nameEn}.`
}

function conditionLabel(condition: RecognitionDetails['condition']) {
  switch (condition) {
    case 'clean': return 'Clean'
    case 'dirty': return 'Dirty'
    case 'wet': return 'Wet'
    case 'contains_food_or_liquid': return 'Food / liquid present'
    case 'empty': return 'Empty'
    default: return 'Unknown'
  }
}
