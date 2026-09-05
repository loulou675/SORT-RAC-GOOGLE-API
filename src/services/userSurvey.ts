import { supabase } from '../lib/supabase/client'
import type { InputMethod } from '../types/domain'

export type SurveyChoice = string

export interface UserSurveyInput {
  inputMethod: InputMethod
  predictedItemCode?: string
  destinationBinCode?: string
  scanningEase: SurveyChoice
  guidanceClarity: SurveyChoice
  resultTrust: SurveyChoice
  confusionPoint: SurveyChoice
  confusionDetails?: string
  improvementPriority: SurveyChoice
}

interface UserSurveyRecord extends UserSurveyInput {
  id: string
  surveyVersion: 'survey-v1'
  clientCreatedAt: string
  uploadedAt?: string
}

const storageKey = 'sot-rac-user-survey-v1'

export async function saveUserSurvey(input: UserSurveyInput) {
  const record: UserSurveyRecord = {
    ...input,
    id: crypto.randomUUID(),
    surveyVersion: 'survey-v1',
    clientCreatedAt: new Date().toISOString(),
  }

  writeRecords([record, ...readRecords()].slice(0, 100))
  const uploaded = await uploadRecord(record).catch(() => false)
  if (uploaded) markUploaded(record.id)
  return { uploaded }
}

export function startUserSurveySync() {
  if (!supabase) return () => undefined

  const sync = () => void syncPendingUserSurveys()
  sync()
  window.addEventListener('online', sync)
  return () => window.removeEventListener('online', sync)
}

async function syncPendingUserSurveys() {
  for (const record of readRecords().filter((entry) => !entry.uploadedAt)) {
    const uploaded = await uploadRecord(record).catch(() => false)
    if (uploaded) markUploaded(record.id)
  }
}

function readRecords(): UserSurveyRecord[] {
  try {
    const stored = localStorage.getItem(storageKey)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecords(records: UserSurveyRecord[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records))
  } catch {
    // The survey can still be uploaded when local storage is unavailable.
  }
}

function markUploaded(id: string) {
  writeRecords(readRecords().map((record) => (
    record.id === id ? { ...record, uploadedAt: new Date().toISOString() } : record
  )))
}

async function uploadRecord(record: UserSurveyRecord) {
  if (!supabase) return false

  const { error } = await supabase.from('user_surveys').insert({
    id: record.id,
    survey_version: record.surveyVersion,
    client_created_at: record.clientCreatedAt,
    input_method: record.inputMethod,
    predicted_item_code: record.predictedItemCode ?? null,
    destination_bin_code: record.destinationBinCode ?? null,
    scanning_ease: record.scanningEase,
    guidance_clarity: record.guidanceClarity,
    result_trust: record.resultTrust,
    confusion_point: record.confusionPoint,
    confusion_details: record.confusionDetails ?? null,
    improvement_priority: record.improvementPriority,
  })

  return !error || error.code === '23505'
}
