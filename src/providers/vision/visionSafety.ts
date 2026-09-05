import type { BinCode, BroadMaterialCode } from '../../types/domain'

export const disposableCutlerySafetyPolicy = {
  minimumConfidence: 0.8982371521949768,
  minimumMargin: 0.15,
  organicRouterConfidence: 0.78,
  organicMaterialConfidence: 0.55,
}

interface CutlerySafetyEvidence {
  candidateConfidence: number
  candidateMargin: number
  destination?: { code: BinCode; confidence: number }
  material?: { code: BroadMaterialCode; confidence: number }
}

export function resolveCutlerySafetyDecision(
  evidence: CutlerySafetyEvidence,
): 'organic' | 'cutlery' | 'abstain' {
  const organicEvidence = evidence.destination?.code === 'organic'
    && evidence.destination.confidence >= disposableCutlerySafetyPolicy.organicRouterConfidence
    && evidence.material?.code === 'organic'
    && evidence.material.confidence >= disposableCutlerySafetyPolicy.organicMaterialConfidence

  if (organicEvidence) return 'organic'

  if (
    evidence.candidateConfidence >= disposableCutlerySafetyPolicy.minimumConfidence
    && evidence.candidateMargin >= disposableCutlerySafetyPolicy.minimumMargin
  ) return 'cutlery'

  return 'abstain'
}
