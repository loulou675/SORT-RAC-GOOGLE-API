export type Locale = 'en' | 'vi'

export type VerificationStatus =
  | 'BASED_ON_LOCAL_GUIDANCE'
  | 'PENDING_CONFIRMATION'
  | 'VERIFIED_GUIDANCE'
  | 'SUSPENDED'

export type BinCode =
  | 'bottle_can'
  | 'organic'
  | 'clean_plastic'
  | 'paper_cardboard'
  | 'landfill'
  | 'special_handling'
  | 'mixed_uncertain'

export type BroadMaterialCode =
  | 'plastic'
  | 'metal'
  | 'paper_cardboard'
  | 'organic'
  | 'glass'
  | 'electronic_battery'
  | 'landfill'
  | 'mixed_uncertain'

export type MaterialCode =
  | 'pet_plastic'
  | 'rigid_plastic'
  | 'soft_plastic'
  | 'mixed_plastic'
  | 'aluminium'
  | 'steel'
  | 'glass'
  | 'paper'
  | 'cardboard'
  | 'organic'
  | 'mixed_material'
  | 'wood'
  | 'electronic'
  | 'hazardous'
  | 'unknown'

export type ConditionKey =
  | 'default'
  | 'empty'
  | 'contains_liquid'
  | 'clean_empty'
  | 'contains_food_liquid'
  | 'empty_dirty_cleanable'
  | 'cannot_clean'
  | 'clean_dry'
  | 'wet'
  | 'greasy'
  | 'partly_greasy'
  | 'clean'
  | 'dirty'
  | 'unbroken_clean'

export type InputMethod = 'camera' | 'upload' | 'manual'

export type RecognitionCondition =
  | 'clean'
  | 'dirty'
  | 'wet'
  | 'contains_food_or_liquid'
  | 'empty'
  | 'unknown'

export interface RecognizedPart {
  name: string
  material: string
  condition: RecognitionCondition
  confidence: number
}

export interface RecognitionDetails {
  observedLabel: string
  materialLabel: string
  condition: RecognitionCondition
  parts: RecognizedPart[]
  confidence: number
  reason: string
}

export interface SiteProfile {
  code: string
  nameVi: string
  nameEn: string
  country: string
  city: string
  descriptionVi: string
  descriptionEn: string
  isActive: boolean
}

export interface Bin {
  code: BinCode
  nameVi: string
  nameEn: string
  colorName: string
  colorHex: string
  iconKey: string
  descriptionVi: string
  descriptionEn: string
  sortOrder: number
  isActive: boolean
}

export interface Material {
  code: MaterialCode
  nameVi: string
  nameEn: string
  descriptionVi: string
  descriptionEn: string
}

export interface WasteItem {
  code: string
  nameVi: string
  nameEn: string
  primaryMaterialCode: MaterialCode
  objectType: string
  category: string
  hazardFlag: boolean
  specialHandling: boolean
  imageKey: string
  aliasesVi: string[]
  aliasesEn: string[]
  isActive: boolean
  verificationStatus: VerificationStatus
}

export interface ConditionOption {
  value: ConditionKey
  labelVi: string
  labelEn: string
}

export interface ConditionQuestion {
  itemCode: string
  questionKey: string
  questionVi: string
  questionEn: string
  options: ConditionOption[]
  sortOrder: number
  isActive: boolean
}

export interface ComponentAction {
  code: string
  componentVi: string
  componentEn: string
  materialVi?: string
  materialEn?: string
  disposalNoteVi?: string
  disposalNoteEn?: string
  destinationBinCode: BinCode
}

export interface DetectedComponent {
  code: string
  confidence: number
  areaRatio: number
}

export interface DisposalRule {
  siteCode: string
  itemCode: string
  conditionKey: ConditionKey
  destinationBinCode: BinCode
  instructionShortVi: string
  instructionShortEn: string
  instructionDetailedVi: string
  instructionDetailedEn: string
  whyCategoryVi?: string
  whyCategoryEn?: string
  preparationStepsVi: string[]
  preparationStepsEn: string[]
  preparationComponentCodes: string[][]
  warningVi?: string
  warningEn?: string
  componentActions: ComponentAction[]
  priority: number
  verificationStatus: VerificationStatus
  sourceReference: string
  isActive: boolean
}

export interface ReuseSuggestion {
  code: string
  itemCode?: string
  materialCode?: MaterialCode
  titleVi: string
  titleEn: string
  summaryVi: string
  summaryEn: string
  requiredCondition?: ConditionKey[]
  prohibitedCondition?: ConditionKey[]
  stepsVi: string[]
  stepsEn: string[]
  safetyNoteVi: string
  safetyNoteEn: string
  difficulty: 'Easy' | 'Medium'
  estimatedMinutes: number
  priority: number
  verificationStatus: VerificationStatus
  isActive: boolean
}

export interface RuleEngineInput {
  siteCode: string
  itemCode: string
  conditionAnswers: Record<string, ConditionKey>
  locale?: Locale
  detectedComponents?: DetectedComponent[]
  detectedCondition?: ConditionKey
}

export interface PreparationStepResult {
  text: string
  textVi: string
  components: Array<ComponentAction & { destinationBin: Bin }>
}

export interface RuleEngineResult {
  item: WasteItem
  destinationBin: Bin
  mainInstruction: string
  detailedInstruction: string
  whyCategory: string
  mainInstructionVi: string
  detailedInstructionVi: string
  whyCategoryVi: string
  preparationSteps: string[]
  preparationStepsVi: string[]
  preparationActions: PreparationStepResult[]
  componentActions: Array<ComponentAction & { destinationBin: Bin }>
  warning?: string
  warningVi?: string
  reuseSuggestions: ReuseSuggestion[]
  specialHandling: boolean
  matchLevel?: 'item' | 'material'
  materialCode?: BroadMaterialCode
}
