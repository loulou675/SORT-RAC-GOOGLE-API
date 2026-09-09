import { wasteItems } from '../../data/referenceData'
import { AppError } from '../../lib/errors'
import type { BroadMaterialCode, RecognitionCondition, RecognitionDetails, RecognizedPart } from '../../types/domain'
import type { VisionProvider, VisionResult } from './types'

interface GoogleResponse {
  kind: 'item' | 'material' | 'multiple'
  itemCode?: string
  materialCode?: BroadMaterialCode
  confidence?: number
  observedLabel?: string
  materialLabel?: string
  condition?: RecognitionCondition
  parts?: RecognizedPart[]
  reason?: string
}

export class GoogleVisionProvider implements VisionProvider {
  async identify(image: Blob | string | HTMLCanvasElement): Promise<VisionResult> {
    const imageDataUrl = await toDataUrl(image)
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl,
        catalogue: wasteItems
          .filter((item) => item.isActive && item.code !== 'unknown')
          .map((item) => ({
            code: item.code,
            name: item.nameEn,
            material: item.primaryMaterialCode,
            category: item.category,
            aliases: item.aliasesEn.slice(0, 5),
          })),
      }),
    })

    const payload = await response.json().catch(() => ({})) as GoogleResponse & { error?: string, code?: string }
    if (!response.ok) {
      throw new AppError(errorCodeForStatus(response.status, payload.code), payload.error ?? 'Google recognition failed')
    }

    if (payload.kind === 'item' && payload.itemCode) {
      return { kind: 'item', itemCode: payload.itemCode, details: normalizeDetails(payload) }
    }

    if (payload.kind === 'multiple') {
      const details = normalizeDetails(payload)
      const itemCodes = details.parts.map((part) => part.itemCode).filter((itemCode): itemCode is string => Boolean(itemCode))
      if (itemCodes.length >= 2 && itemCodes.length === details.parts.length) {
        return { kind: 'multiple', itemCodes, details }
      }
      throw new AppError('MULTIPLE_ITEMS_DETECTED', 'Every object must be recognised before sorting multiple objects')
    }

    if (payload.kind === 'material' && payload.materialCode) {
      return {
        kind: 'material',
        materialCode: payload.materialCode,
        confidence: payload.confidence ?? 0,
        details: normalizeDetails(payload),
      }
    }

    throw new AppError('ITEM_AMBIGUOUS', 'Google recognition did not return a safe sorting result')
  }
}

async function toDataUrl(image: Blob | string | HTMLCanvasElement) {
  if (typeof image === 'string') return image
  if (image instanceof HTMLCanvasElement) return image.toDataURL('image/jpeg', 0.82)

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new AppError('IMAGE_DECODE_FAILED', 'Could not read the image'))
    reader.readAsDataURL(image)
  })
}

function errorCodeForStatus(status: number, payloadCode?: string) {
  if (payloadCode === 'MULTIPLE_ITEMS_DETECTED') return 'MULTIPLE_ITEMS_DETECTED' as const
  if (payloadCode === 'ITEM_AMBIGUOUS') return 'ITEM_AMBIGUOUS' as const
  if (status === 413) return 'IMAGE_TOO_LARGE' as const
  if (status === 408 || status === 504) return 'INFERENCE_TIMEOUT' as const
  if (status === 503) return 'MODEL_NOT_CONFIGURED' as const
  return 'INFERENCE_FAILED' as const
}

function normalizeDetails(payload: GoogleResponse): RecognitionDetails {
  const condition = normalizeCondition(payload.condition)
  const parts = Array.isArray(payload.parts)
    ? payload.parts
      .filter((part) => part && typeof part.name === 'string')
      .slice(0, 8)
      .map((part) => ({
        name: cleanText(part.name, 'Visible part'),
        itemCode: typeof part.itemCode === 'string' ? part.itemCode : undefined,
        material: cleanText(part.material, 'Unknown material'),
        condition: normalizeCondition(part.condition),
        confidence: clamp(Number(part.confidence)),
      }))
    : []

  return {
    observedLabel: cleanText(payload.observedLabel, 'Unknown item'),
    materialLabel: cleanText(payload.materialLabel, payload.materialCode ?? 'Unknown material'),
    condition,
    parts: ensureContentsPart(parts, condition),
    confidence: clamp(Number(payload.confidence)),
    reason: cleanText(payload.reason, 'The image was analysed using Google Gemini.'),
  }
}

export function ensureContentsPart(parts: RecognizedPart[], condition: RecognitionCondition) {
  if (condition !== 'contains_food_or_liquid' || parts.some((part) => /food|liquid/i.test(part.name))) {
    return parts
  }

  return [
    ...parts.slice(0, 7),
    {
      name: 'Food or liquid',
      material: 'organic',
      condition,
      confidence: 1,
    },
  ]
}

function normalizeCondition(value: unknown): RecognitionCondition {
  const allowed: RecognitionCondition[] = ['clean', 'dirty', 'wet', 'contains_food_or_liquid', 'empty', 'unknown']
  return typeof value === 'string' && allowed.includes(value as RecognitionCondition)
    ? value as RecognitionCondition
    : 'unknown'
}

function cleanText(value: unknown, fallback: string) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text ? text.slice(0, 180) : fallback
}

function clamp(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}
