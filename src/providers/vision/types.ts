import type { BinCode, BroadMaterialCode, DetectedComponent, RecognitionDetails } from '../../types/domain'

export interface ItemVisionResult {
  kind: 'item'
  itemCode: string
  binCode?: BinCode
  components?: DetectedComponent[]
  details: RecognitionDetails
}

export interface MaterialVisionResult {
  kind: 'material'
  materialCode: BroadMaterialCode
  confidence: number
  details: RecognitionDetails
}

export interface MultipleVisionResult {
  kind: 'multiple'
  itemCodes: string[]
  details: RecognitionDetails
}

export type VisionResult = ItemVisionResult | MaterialVisionResult | MultipleVisionResult

export interface VisionProvider {
  identify(image: Blob | string | HTMLCanvasElement): Promise<VisionResult>
  identifyComponents?: (
    image: Blob | string | HTMLCanvasElement,
    itemCode: string,
  ) => Promise<DetectedComponent[] | undefined>
  prepare?: () => Promise<void>
}
