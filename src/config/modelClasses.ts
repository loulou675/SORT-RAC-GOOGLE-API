import { wasteItems } from '../data/referenceData'

/** Keep correction feedback aligned with every active item in the catalogue. */
export const trainingTargetClassCodes = wasteItems
  .filter((item) => item.isActive)
  .map((item) => item.code)
