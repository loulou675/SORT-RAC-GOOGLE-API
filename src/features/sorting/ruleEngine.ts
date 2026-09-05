import { ecoTipMatchesItem, ecoTips } from '../../data/ecoTips'
import { bins, conditionQuestions, disposalRules, siteProfiles, wasteItems } from '../../data/referenceData'
import { AppError } from '../../lib/errors'
import type {
  BinCode,
  BroadMaterialCode,
  ConditionKey,
  Locale,
  MaterialCode,
  RecognitionCondition,
  RuleEngineInput,
  RuleEngineResult,
} from '../../types/domain'

const acceptedRuleStatuses = new Set(['BASED_ON_LOCAL_GUIDANCE', 'VERIFIED_GUIDANCE'])

export function getItem(itemCode: string) {
  return wasteItems.find((item) => item.code === itemCode && item.isActive)
}

export function getBin(binCode: string) {
  return bins.find((bin) => bin.code === binCode && bin.isActive)
}

export function getQuestionForItem(itemCode: string) {
  return conditionQuestions.find((question) => question.itemCode === itemCode && question.isActive)
}

export function getDefaultConditionForItem(itemCode: string): ConditionKey {
  const question = getQuestionForItem(itemCode)
  return question?.options[0]?.value ?? 'default'
}

export function hasConditionQuestion(itemCode: string) {
  return Boolean(getQuestionForItem(itemCode))
}

export function evaluateDisposal(input: RuleEngineInput): RuleEngineResult {
  const locale: Locale = input.locale ?? 'en'
  const site = siteProfiles.find((profile) => profile.code === input.siteCode && profile.isActive)

  if (!site) {
    throw new AppError('DATABASE_UNAVAILABLE', `Unknown site: ${input.siteCode}`)
  }

  const item = getItem(input.itemCode)

  if (!item) {
    throw new AppError('ITEM_NOT_RECOGNISED', `Unknown item: ${input.itemCode}`)
  }

  const conditionKey = resolveConditionKey(item.code, input.conditionAnswers, input.detectedComponents, input.detectedCondition)
  const selectedRule = disposalRules
    .filter((rule) => {
      const matchesItem = rule.itemCode === item.code
      const matchesSite = rule.siteCode === site.code
      const matchesCondition = rule.conditionKey === conditionKey || rule.conditionKey === 'default'
      const isVerified = acceptedRuleStatuses.has(rule.verificationStatus)
      return matchesItem && matchesSite && matchesCondition && rule.isActive && isVerified
    })
    .sort((left, right) => {
      const conditionPriority = Number(right.conditionKey === conditionKey) - Number(left.conditionKey === conditionKey)
      return conditionPriority || right.priority - left.priority
    })[0]

  if (!selectedRule) {
    throw new AppError('RULE_NOT_FOUND', `No verified rule exists for ${item.code}`)
  }

  const destinationBin = getBin(selectedRule.destinationBinCode)

  if (!destinationBin) {
    throw new AppError('RULE_NOT_FOUND', `Rule destination is missing for ${item.code}`)
  }

  const componentActions = selectedRule.componentActions.map((action) => {
    const destination = getBin(action.destinationBinCode)
    if (!destination) {
      throw new AppError('RULE_NOT_FOUND', `Component destination is missing for ${item.code}`)
    }
    return { ...action, destinationBin: destination }
  })

  const preparationSteps = locale === 'vi' ? selectedRule.preparationStepsVi : selectedRule.preparationStepsEn
  const preparationActions = preparationSteps.map((text, index) => {
    const codes = selectedRule.preparationComponentCodes[index] ?? []
    return {
      text,
      textVi: selectedRule.preparationStepsVi[index] ?? text,
      components: componentActions.filter((component) => codes.includes(component.code)),
    }
  })

  return {
    item,
    destinationBin,
    mainInstruction: locale === 'vi' ? selectedRule.instructionShortVi : selectedRule.instructionShortEn,
    detailedInstruction: locale === 'vi' ? selectedRule.instructionDetailedVi : selectedRule.instructionDetailedEn,
    whyCategory:
      (locale === 'vi' ? selectedRule.whyCategoryVi : selectedRule.whyCategoryEn) ??
      (locale === 'vi' ? selectedRule.instructionDetailedVi : selectedRule.instructionDetailedEn),
    mainInstructionVi: selectedRule.instructionShortVi,
    detailedInstructionVi: selectedRule.instructionDetailedVi,
    whyCategoryVi: selectedRule.whyCategoryVi ?? selectedRule.instructionDetailedVi,
    preparationSteps,
    preparationStepsVi: selectedRule.preparationStepsVi,
    preparationActions,
    componentActions,
    warning: locale === 'vi' ? selectedRule.warningVi : selectedRule.warningEn,
    warningVi: selectedRule.warningVi,
    reuseSuggestions: filterReuseSuggestions(item.code, item.primaryMaterialCode, conditionKey).slice(0, 2),
    specialHandling: item.specialHandling || selectedRule.destinationBinCode === 'special_handling',
  }
}

const materialFallbackGuidance: Record<BroadMaterialCode, {
  name: string
  nameVi: string
  materialCode: MaterialCode
  destinationBinCode: BinCode
  why: string
  whyVi: string
  steps: string[]
  stepsVi: string[]
  warning?: string
  warningVi?: string
}> = {
  plastic: {
    name: 'Likely plastic material',
    nameVi: 'Có thể là vật liệu nhựa',
    materialCode: 'mixed_plastic',
    destinationBinCode: 'clean_plastic',
    why: 'The exact item was not identified, but the material model detected plastic. At this station, plastic belongs in Clean Plastic only when it is empty and free of food or liquid.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình đã phát hiện vật liệu nhựa. Nhựa chỉ thuộc Clean Plastic khi đã rỗng và không dính thức ăn hoặc chất lỏng.',
    steps: ['Remove food or liquid.', 'Rinse the plastic if needed.', 'Let it dry, then place it in Clean Plastic.'],
    stepsVi: ['Loại bỏ thức ăn hoặc chất lỏng.', 'Rửa vật nhựa nếu cần.', 'Để khô rồi cho vào Clean Plastic.'],
    warning: 'This is a material-only result. Search the exact item if it is dirty, multilayered, medical, or chemical packaging.',
    warningVi: 'Đây chỉ là kết quả dựa trên vật liệu. Hãy tìm đúng tên vật nếu vật bị bẩn, nhiều lớp, thuộc y tế hoặc là bao bì hóa chất.',
  },
  metal: {
    name: 'Likely metal material',
    nameVi: 'Có thể là vật liệu kim loại',
    materialCode: 'steel',
    destinationBinCode: 'bottle_can',
    why: 'The exact item was not identified, but the material model detected metal. Empty metal packaging is handled with bottles and cans at this station.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình đã phát hiện kim loại. Bao bì kim loại rỗng được phân loại cùng chai và lon.',
    steps: ['Make sure it is empty.', 'Remove food or liquid.', 'Place accepted metal packaging in Bottle & Can.'],
    stepsVi: ['Đảm bảo vật đã rỗng.', 'Loại bỏ thức ăn hoặc chất lỏng.', 'Cho bao bì kim loại phù hợp vào Bottle & Can.'],
    warning: 'This is a material-only result. Search the exact item if it is sharp, pressurised, electronic, or not packaging.',
    warningVi: 'Đây chỉ là kết quả dựa trên vật liệu. Hãy tìm đúng tên vật nếu vật sắc nhọn, có áp suất, có linh kiện điện tử hoặc không phải bao bì.',
  },
  paper_cardboard: {
    name: 'Likely paper or cardboard',
    nameVi: 'Có thể là giấy hoặc bìa carton',
    materialCode: 'paper',
    destinationBinCode: 'paper_cardboard',
    why: 'The exact item was not identified, but the material model detected paper or cardboard. This stream only accepts material that is clean and dry.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình đã phát hiện giấy hoặc bìa carton. Nhóm này chỉ nhận vật liệu sạch và khô.',
    steps: ['Remove food or other contents.', 'Keep the material clean and dry.', 'Place it in Paper & Cardboard.'],
    stepsVi: ['Loại bỏ thức ăn hoặc đồ còn bên trong.', 'Giữ vật liệu sạch và khô.', 'Cho vào Paper & Cardboard.'],
    warning: 'Wet, greasy, coated, or heavily contaminated paper may need a different destination.',
    warningVi: 'Giấy ướt, dính dầu mỡ, có lớp phủ hoặc bẩn nhiều có thể cần được xử lý ở nhóm khác.',
  },
  organic: {
    name: 'Likely organic material',
    nameVi: 'Có thể là chất hữu cơ',
    materialCode: 'organic',
    destinationBinCode: 'organic',
    why: 'The exact item was not identified, but the material model detected food or plant-based organic material.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình đã phát hiện thức ăn hoặc vật liệu hữu cơ có nguồn gốc thực vật.',
    steps: ['Remove any packaging.', 'Keep non-food materials separate.', 'Place the organic material in Organic Waste.'],
    stepsVi: ['Tháo bỏ bao bì.', 'Tách riêng các vật liệu không phải thức ăn.', 'Cho phần hữu cơ vào Organic Waste.'],
  },
  glass: {
    name: 'Likely glass material',
    nameVi: 'Có thể là vật liệu thủy tinh',
    materialCode: 'glass',
    destinationBinCode: 'bottle_can',
    why: 'The exact item was not identified, but the material model detected glass. Accepted empty glass drink containers use the Bottle & Can stream at this station.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình đã phát hiện thủy tinh. Chai đồ uống thủy tinh rỗng phù hợp được phân loại vào Bottle & Can.',
    steps: ['Make sure it is empty.', 'Keep broken glass separate and ask staff.', 'Place accepted glass containers in Bottle & Can.'],
    stepsVi: ['Đảm bảo chai đã rỗng.', 'Tách riêng thủy tinh vỡ và hỏi nhân viên.', 'Cho chai thủy tinh phù hợp vào Bottle & Can.'],
    warning: 'This is a material-only result. Do not use this bin for broken glass, bulbs, mirrors, or laboratory glass.',
    warningVi: 'Đây chỉ là kết quả dựa trên vật liệu. Không dùng thùng này cho thủy tinh vỡ, bóng đèn, gương hoặc thủy tinh phòng thí nghiệm.',
  },
  electronic_battery: {
    name: 'Likely electronic or battery item',
    nameVi: 'Có thể là thiết bị điện tử hoặc pin',
    materialCode: 'electronic',
    destinationBinCode: 'special_handling',
    why: 'The exact item was not identified, but the material model detected an electronic or battery-like object that may require approved collection.',
    whyVi: 'Chưa xác định được chính xác vật thể, nhưng mô hình phát hiện vật giống thiết bị điện tử hoặc pin và cần điểm thu gom phù hợp.',
    steps: ['Do not place it in a regular bin.', 'Keep damaged or swollen batteries away from heat.', 'Use an approved electronics or battery collection point.'],
    stepsVi: ['Không cho vào thùng rác thông thường.', 'Giữ pin hỏng hoặc phồng tránh xa nguồn nhiệt.', 'Mang đến điểm thu gom điện tử hoặc pin được chấp thuận.'],
    warning: 'Do not open, crush, puncture, or burn the item.',
    warningVi: 'Không mở, nghiền, đâm thủng hoặc đốt vật này.',
  },
  landfill: {
    name: 'Likely general landfill item',
    nameVi: 'Có thể là rác thải thông thường',
    materialCode: 'mixed_material',
    destinationBinCode: 'landfill',
    why: 'The exact item was approximate, but the reviewed destination router identified it as a general mixed-material household item for Landfill.',
    whyVi: 'Tên vật thể chỉ là ước đoán, nhưng bộ phân loại đích đã xác định đây là đồ gia dụng nhiều vật liệu thuộc Landfill.',
    steps: ['Remove any battery or electronic part.', 'Keep liquids and recyclable parts separate.', 'Place the remaining item in Landfill.'],
    stepsVi: ['Tháo pin hoặc linh kiện điện tử nếu có.', 'Tách riêng chất lỏng và các phần có thể tái chế.', 'Cho phần còn lại vào Landfill.'],
    warning: 'This is a destination-level assumption. Use Special Handling instead if the item contains electronics, batteries, chemicals, or sharp hazardous parts.',
    warningVi: 'Đây là kết quả ước đoán theo nhóm. Hãy dùng điểm thu gom đặc biệt nếu vật có điện tử, pin, hóa chất hoặc bộ phận sắc nhọn nguy hiểm.',
  },
  mixed_uncertain: {
    name: 'Mixed or uncertain material',
    nameVi: 'Vật liệu hỗn hợp hoặc chưa chắc chắn',
    materialCode: 'mixed_material',
    destinationBinCode: 'mixed_uncertain',
    why: 'The exact item and a reliable single material could not be identified, so the app is not choosing a disposal bin.',
    whyVi: 'Không thể xác định chính xác vật thể hoặc một vật liệu đáng tin cậy, vì vậy ứng dụng chưa chọn thùng rác.',
    steps: ['Check the item label or packaging.', 'Search for the exact item in the app.', 'Ask staff before placing it in a recycling bin.'],
    stepsVi: ['Kiểm tra nhãn hoặc bao bì của vật.', 'Tìm đúng tên vật trong ứng dụng.', 'Hỏi nhân viên trước khi cho vào thùng tái chế.'],
    warning: 'Do not guess based only on colour or appearance.',
    warningVi: 'Không nên đoán chỉ dựa vào màu sắc hoặc hình dáng.',
  },
}

export function evaluateMaterialFallback(materialCode: BroadMaterialCode, detectedCondition: RecognitionCondition = 'unknown'): RuleEngineResult {
  const guidance = materialFallbackGuidance[materialCode]
  const contaminatedRecyclable = ['plastic', 'paper_cardboard'].includes(materialCode)
    && ['dirty', 'wet', 'contains_food_or_liquid'].includes(detectedCondition)
  const destinationBinCode = contaminatedRecyclable ? 'landfill' : guidance.destinationBinCode
  const destinationBin = getBin(destinationBinCode)
  if (!destinationBin) throw new AppError('RULE_NOT_FOUND', `No material guidance exists for ${materialCode}`)

  const conditionNote = contaminatedRecyclable
    ? materialCode === 'paper_cardboard'
      ? {
          why: 'The image appears to show paper or cardboard, but it is wet or contaminated. This station keeps contaminated paper out of the Paper & Cardboard stream.',
          whyVi: 'Ảnh cho thấy giấy hoặc bìa carton nhưng vật đang ướt hoặc bị nhiễm bẩn. Trạm này không nhận giấy bẩn trong luồng Giấy & Bìa Carton.',
          steps: ['Keep the contaminated paper separate from clean paper.', 'Place it in Landfill.'],
          stepsVi: ['Tách giấy bẩn khỏi giấy sạch.', 'Cho vào Chất Thải Chôn Lấp.'],
        }
      : {
          why: 'The image appears to show plastic, but food, liquid or dirt is visible. Do not place contaminated plastic in Clean Plastic.',
          whyVi: 'Ảnh cho thấy nhựa nhưng có thức ăn, chất lỏng hoặc bụi bẩn. Không cho nhựa nhiễm bẩn vào Nhựa Sạch.',
          steps: ['Remove any contents if safe.', 'Do not place contaminated plastic in Clean Plastic.', 'Place it in Landfill.'],
          stepsVi: ['Lấy phần bên trong ra nếu an toàn.', 'Không cho nhựa nhiễm bẩn vào Nhựa Sạch.', 'Cho vào Chất Thải Chôn Lấp.'],
        }
    : undefined

  const item = {
    code: `material_${materialCode}`,
    nameVi: guidance.nameVi,
    nameEn: guidance.name,
    primaryMaterialCode: guidance.materialCode,
    objectType: 'material',
    category: 'Material-based result',
    hazardFlag: materialCode === 'electronic_battery',
    specialHandling: materialCode === 'electronic_battery',
    imageKey: `material_${materialCode}`,
    aliasesVi: [],
    aliasesEn: [],
    isActive: true,
    verificationStatus: 'PENDING_CONFIRMATION' as const,
  }
  return {
    item,
    destinationBin,
    mainInstruction: conditionNote?.steps.at(-1) ?? guidance.steps.at(-1) ?? guidance.why,
    detailedInstruction: conditionNote?.why ?? guidance.why,
    whyCategory: conditionNote?.why ?? guidance.why,
    mainInstructionVi: conditionNote?.stepsVi.at(-1) ?? guidance.stepsVi.at(-1) ?? guidance.whyVi,
    detailedInstructionVi: conditionNote?.whyVi ?? guidance.whyVi,
    whyCategoryVi: conditionNote?.whyVi ?? guidance.whyVi,
    preparationSteps: conditionNote?.steps ?? guidance.steps,
    preparationStepsVi: conditionNote?.stepsVi ?? guidance.stepsVi,
    preparationActions: (conditionNote?.steps ?? guidance.steps).map((text, index) => ({
      text,
      textVi: (conditionNote?.stepsVi ?? guidance.stepsVi)[index] ?? text,
      components: [],
    })),
    componentActions: [],
    warning: guidance.warning,
    warningVi: guidance.warningVi,
    reuseSuggestions: [],
    specialHandling: materialCode === 'electronic_battery',
    matchLevel: 'material',
    materialCode,
  }
}

function resolveConditionKey(
  itemCode: string,
  conditionAnswers: Record<string, ConditionKey>,
  detectedComponents?: RuleEngineInput['detectedComponents'],
  detectedCondition?: ConditionKey,
): ConditionKey {
  const containsFood = detectedComponents?.some((component) => component.code === 'remaining_liquid')
  if (containsFood) {
    if (['plastic_takeaway_cup', 'milk_tea_cup', 'plastic_food_container', 'plastic_takeaway_box'].includes(itemCode)) {
      return 'contains_food_liquid'
    }
    if (['plastic_water_bottle', 'plastic_soft_drink_bottle', 'aluminium_drink_can', 'glass_drink_bottle'].includes(itemCode)) {
      return 'contains_liquid'
    }
  }

  const question = getQuestionForItem(itemCode)

  if (!question) {
    return conditionAnswers.default ?? 'default'
  }

  if (detectedCondition) return detectedCondition

  return conditionAnswers[question.questionKey] ?? question.options[0]?.value ?? 'default'
}

function filterReuseSuggestions(itemCode: string, materialCode: string, conditionKey: ConditionKey) {
  return ecoTips
    .filter((suggestion) => {
      const matchesScope = ecoTipMatchesItem(suggestion, itemCode, materialCode as MaterialCode)
      const required = suggestion.requiredCondition
      const prohibited = suggestion.prohibitedCondition
      const passesRequired = !required?.length || required.includes(conditionKey)
      const passesProhibited = !prohibited?.includes(conditionKey)
      return suggestion.isActive && matchesScope && passesRequired && passesProhibited
    })
    .sort((left, right) => right.priority - left.priority)
}
