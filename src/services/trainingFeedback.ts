import type { AppErrorCode } from '../lib/errors'
import { feedbackAutoUploadEnabled } from '../config/trainingMode'
import { supabase } from '../lib/supabase/client'
import type { InputMethod } from '../types/domain'

export interface TrainingFeedbackInput {
  imageDataUrl: string
  predictedItemCode?: string
  correctedItemCode: string
  inputMethod?: InputMethod
  errorCode?: AppErrorCode
  note?: string
  consentVersion: 'feedback-v1'
}

export interface TrainingFeedbackRecord extends TrainingFeedbackInput {
  id: string
  createdAt: string
  uploadedAt?: string
}

export interface TrainingFeedbackSaveResult {
  record: TrainingFeedbackRecord
  uploaded: boolean
}

const storageKey = 'sot-rac-training-feedback-v1'
const maxRecords = 20

/**
 * Save locally first, then send to the private review queue when available.
 */
export async function saveTrainingFeedback(input: TrainingFeedbackInput): Promise<TrainingFeedbackSaveResult> {
  const record: TrainingFeedbackRecord = {
    ...input,
    imageDataUrl: await compactImage(input.imageDataUrl),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  const records = readTrainingFeedback()
  writeTrainingFeedback([record, ...records].slice(0, maxRecords))

  const uploaded = await uploadTrainingFeedback(record).catch((error) => {
    if (import.meta.env.DEV) console.error('Training feedback upload failed', describeUploadError(error))
    return false
  })
  if (uploaded) markTrainingFeedbackUploaded(record.id)

  return { record, uploaded }
}

export function readTrainingFeedback(): TrainingFeedbackRecord[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Retry queued records at startup and whenever the browser comes back online. */
export function startTrainingFeedbackSync() {
  if (!feedbackAutoUploadEnabled || !supabase) return () => undefined

  const sync = () => {
    void syncPendingTrainingFeedback()
  }

  sync()
  window.addEventListener('online', sync)
  return () => window.removeEventListener('online', sync)
}

export async function syncPendingTrainingFeedback() {
  if (!feedbackAutoUploadEnabled || !supabase) return 0

  let uploadedCount = 0
  for (const record of readTrainingFeedback().filter((entry) => !entry.uploadedAt)) {
    const uploaded = await uploadTrainingFeedback(record).catch((error) => {
      if (import.meta.env.DEV) console.error('Queued training feedback upload failed', describeUploadError(error))
      return false
    })
    if (!uploaded) continue
    markTrainingFeedbackUploaded(record.id)
    uploadedCount += 1
  }
  return uploadedCount
}

export function automaticFeedbackUploadConfigured() {
  return feedbackAutoUploadEnabled && Boolean(supabase)
}

function writeTrainingFeedback(records: TrainingFeedbackRecord[]) {
  // Mobile browsers commonly cap localStorage around 5 MB. Keep trimming the
  // oldest queued images rather than failing the current feedback submission.
  for (let count = records.length; count >= 1; count -= 1) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records.slice(0, count)))
      return true
    } catch {
      // Try a smaller queue. Network upload below still runs if storage is off.
    }
  }
  return false
}

function markTrainingFeedbackUploaded(id: string) {
  const uploadedAt = new Date().toISOString()
  writeTrainingFeedback(readTrainingFeedback().map((record) => (
    record.id === id ? { ...record, uploadedAt } : record
  )))
}

async function uploadTrainingFeedback(record: TrainingFeedbackRecord) {
  if (!feedbackAutoUploadEnabled || !supabase) return false

  const day = record.createdAt.slice(0, 10)
  const imagePath = `pending/${day}/${record.id}.jpg`
  const { error: rowError } = await supabase.from('training_feedback').insert({
    client_record_id: record.id,
    image_path: imagePath,
    predicted_item_code: record.predictedItemCode ?? null,
    corrected_item_code: record.correctedItemCode,
    input_method: record.inputMethod ?? null,
    error_code: record.errorCode ?? null,
    note: record.note ?? null,
    consent_version: record.consentVersion,
    client_created_at: record.createdAt,
  })

  // A repeated client record means the database part of a previous attempt succeeded.
  if (rowError && rowError.code !== '23505') throw rowError

  const imageBlob = dataUrlToBlob(record.imageDataUrl)
  const { error: imageError } = await supabase.storage
    .from('training-feedback')
    .upload(imagePath, imageBlob, { contentType: 'image/jpeg', upsert: false })

  if (imageError && !isDuplicateUploadError(imageError)) throw imageError
  return true
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, encoded] = dataUrl.split(',')
  if (!metadata || !encoded) throw new Error('Feedback image is malformed')
  const mimeType = metadata.match(/^data:([^;]+);base64$/)?.[1] ?? 'image/jpeg'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

function isDuplicateUploadError(error: { message?: string; statusCode?: string | number }) {
  return String(error.statusCode) === '409' || error.message?.toLowerCase().includes('duplicate') === true
}

function describeUploadError(error: unknown) {
  if (!error || typeof error !== 'object') return String(error)
  const details = error as Record<string, unknown>
  return JSON.stringify({
    name: details.name,
    message: details.message,
    code: details.code,
    status: details.status,
    statusCode: details.statusCode,
    details: details.details,
    hint: details.hint,
  })
}

async function compactImage(source: string) {
  const image = new Image()
  image.src = source
  await image.decode()

  const maxSize = 640
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const scale = Math.min(1, maxSize / sourceSize)
  const canvas = document.createElement('canvas')
  const sourceX = (image.naturalWidth - sourceSize) / 2
  const sourceY = (image.naturalHeight - sourceSize) / 2
  const outputSize = Math.max(1, Math.round(sourceSize * scale))
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext('2d')
  if (!context) return source

  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize)
  return canvas.toDataURL('image/jpeg', 0.82)
}
