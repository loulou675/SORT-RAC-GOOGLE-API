import { createContext } from 'react'
import type { AppErrorCode } from '../lib/errors'
import type { ConditionKey, InputMethod } from '../types/domain'

export interface FlowState {
  imagePreview?: string
  inputMethod?: InputMethod
  predictedItemCode?: string
  confirmedItemCode?: string
  selectedCondition?: ConditionKey
  errorCode?: AppErrorCode
  mockItemCode: string
}

export interface FlowContextValue {
  state: FlowState
  setImagePreview: (imagePreview: string | undefined, inputMethod?: InputMethod) => void
  setPredictedItem: (itemCode: string | undefined) => void
  setConfirmedItem: (itemCode: string | undefined) => void
  setSelectedCondition: (condition: ConditionKey | undefined) => void
  setErrorCode: (code: AppErrorCode | undefined) => void
  setMockItemCode: (itemCode: string) => void
  resetFlow: () => void
}

export const storageKey = 'sot-rac-flow-v1'

export const defaultState: FlowState = {
  mockItemCode: 'plastic_takeaway_cup',
}

export const FlowContext = createContext<FlowContextValue | null>(null)
