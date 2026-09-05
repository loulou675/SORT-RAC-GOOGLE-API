import { useContext } from 'react'
import { FlowContext } from './flowStore'

export function useFlow() {
  const value = useContext(FlowContext)

  if (!value) {
    throw new Error('useFlow must be used within FlowProvider')
  }

  return value
}
