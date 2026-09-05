import { describe, expect, it } from 'vitest'
import {
  disposableCutlerySafetyPolicy,
  resolveCutlerySafetyDecision,
} from '../providers/vision/visionSafety'

describe('disposable cutlery safety decision', () => {
  it('routes a food scene to organic when both broad models agree', () => {
    expect(resolveCutlerySafetyDecision({
      candidateConfidence: 0.94,
      candidateMargin: 0.7,
      destination: { code: 'organic', confidence: 0.9 },
      material: { code: 'organic', confidence: 0.8 },
    })).toBe('organic')
  })

  it('keeps a strong standalone cutlery result without organic evidence', () => {
    expect(resolveCutlerySafetyDecision({
      candidateConfidence: 0.95,
      candidateMargin: 0.8,
      destination: { code: 'landfill', confidence: 0.9 },
      material: { code: 'plastic', confidence: 0.8 },
    })).toBe('cutlery')
  })

  it('abstains from a weak cutlery guess', () => {
    expect(resolveCutlerySafetyDecision({
      candidateConfidence: disposableCutlerySafetyPolicy.minimumConfidence - 0.01,
      candidateMargin: 0.7,
    })).toBe('abstain')
  })
})
