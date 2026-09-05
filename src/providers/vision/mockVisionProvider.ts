import { AppError } from '../../lib/errors'
import type { VisionProvider, VisionResult } from './types'
import type { BroadMaterialCode, RecognitionDetails } from '../../types/domain'

export class MockVisionProvider implements VisionProvider {
  private readonly itemCode: string

  constructor(itemCode: string) {
    this.itemCode = itemCode
  }

  async identify(): Promise<VisionResult> {
    if (!import.meta.env.VITE_USE_MOCK_VISION || import.meta.env.VITE_USE_MOCK_VISION !== 'true') {
      throw new AppError('MODEL_NOT_CONFIGURED', 'Mock vision is disabled')
    }

    const selectedItem = sessionStorage.getItem('sot-rac-mock-item') ?? this.itemCode

    if (selectedItem === 'force_error') {
      throw new AppError('ITEM_NOT_RECOGNISED', 'Forced mock failure')
    }

    if (selectedItem.startsWith('material_')) {
      return {
        kind: 'material',
        materialCode: selectedItem.slice('material_'.length) as BroadMaterialCode,
        confidence: 0.86,
        details: mockDetails(selectedItem.slice('material_'.length)),
      }
    }

    return { kind: 'item', itemCode: selectedItem, details: mockDetails(selectedItem) }
  }
}

function mockDetails(label: string): RecognitionDetails {
  return {
    observedLabel: label.replaceAll('_', ' '),
    materialLabel: 'Demo material',
    condition: 'unknown',
    parts: [],
    confidence: 0.86,
    reason: 'Development mock result.',
  }
}
