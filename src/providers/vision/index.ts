import type { VisionProvider } from './types'

let googleProviderPromise: Promise<VisionProvider> | undefined

export async function createVisionProvider(mockItemCode?: string): Promise<VisionProvider> {
  if (import.meta.env.VITE_USE_MOCK_VISION === 'true') {
    const { MockVisionProvider } = await import('./mockVisionProvider')
    return new MockVisionProvider(mockItemCode ?? 'plastic_takeaway_cup')
  }

  googleProviderPromise ??= import('./googleVisionProvider').then(({ GoogleVisionProvider }) => new GoogleVisionProvider())
  return googleProviderPromise
}

/** Clears the cached provider so a failed request can be retried cleanly. */
export function resetVisionProvider() {
  googleProviderPromise = undefined
}

export type { VisionProvider, VisionResult } from './types'
