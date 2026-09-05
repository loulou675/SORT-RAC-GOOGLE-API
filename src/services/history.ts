import type { BroadMaterialCode, InputMethod, RuleEngineResult } from '../types/domain'

export interface ScanHistoryEntry {
  id: string
  itemCode: string
  itemName: string
  itemNameVi: string
  destinationName: string
  destinationColor: string
  destinationHex: string
  inputMethod: InputMethod
  createdAt: string
  materialCode?: BroadMaterialCode
}

const historyKey = 'sot-rac-history-v1'
const maxEntries = 30

export function saveScanHistory(result: RuleEngineResult, inputMethod: InputMethod) {
  const entry: ScanHistoryEntry = {
    id: `${Date.now()}-${result.item.code}`,
    itemCode: result.item.code,
    itemName: result.item.nameEn,
    itemNameVi: result.item.nameVi,
    destinationName: result.destinationBin.nameEn,
    destinationColor: result.destinationBin.colorName,
    destinationHex: result.destinationBin.colorHex,
    inputMethod,
    createdAt: new Date().toISOString(),
    materialCode: result.materialCode,
  }

  const current = readScanHistory()
  const deduped = current.filter((item) => item.itemCode !== entry.itemCode || item.destinationName !== entry.destinationName)
  try {
    localStorage.setItem(historyKey, JSON.stringify([entry, ...deduped].slice(0, maxEntries)))
  } catch {
    // Recognition should still complete when storage is disabled or full.
  }
}

export function readScanHistory(): ScanHistoryEntry[] {
  try {
    const stored = localStorage.getItem(historyKey)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearScanHistory() {
  try {
    localStorage.removeItem(historyKey)
  } catch {
    // Private browsing may expose Storage while rejecting writes.
  }
}
