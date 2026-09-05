import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultState, FlowContext, storageKey, type FlowContextValue, type FlowState } from './flowStore'

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(() => loadState())

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // The active flow remains usable when private browsing rejects storage.
    }
  }, [state])

  const value = useMemo<FlowContextValue>(
    () => ({
      state,
      setImagePreview: (imagePreview, inputMethod) =>
        setState((current) => ({ ...current, imagePreview, inputMethod, errorCode: undefined })),
      setPredictedItem: (predictedItemCode) => setState((current) => ({ ...current, predictedItemCode })),
      setConfirmedItem: (confirmedItemCode) => setState((current) => ({ ...current, confirmedItemCode })),
      setSelectedCondition: (selectedCondition) => setState((current) => ({ ...current, selectedCondition })),
      setErrorCode: (errorCode) => setState((current) => ({ ...current, errorCode })),
      setMockItemCode: (mockItemCode) => setState((current) => ({ ...current, mockItemCode })),
      resetFlow: () => setState(defaultState),
    }),
    [state],
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

function loadState(): FlowState {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) return defaultState
    return { ...defaultState, ...JSON.parse(stored) }
  } catch {
    return defaultState
  }
}
