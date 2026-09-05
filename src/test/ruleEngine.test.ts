import { describe, expect, it } from 'vitest'
import { AppError } from '../lib/errors'
import { evaluateDisposal, evaluateMaterialFallback, getDefaultConditionForItem } from '../features/sorting/ruleEngine'
import { trainingTargetClassCodes } from '../config/modelClasses'
import { wasteItems } from '../data/referenceData'
import type { ConditionKey } from '../types/domain'

function answers(condition: ConditionKey) {
  return {
    default: condition,
    container_state: condition,
    plastic_cup_condition: condition,
    container_condition: condition,
    plastic_cleanliness: condition,
    paper_condition: condition,
  }
}

function evaluate(itemCode: string, condition: ConditionKey = 'default') {
  return evaluateDisposal({
    siteCode: 'default_station',
    itemCode,
    conditionAnswers: answers(condition),
    locale: 'en',
  })
}

describe('rule engine', () => {
  it('selects the exact condition rule before a generic rule', () => {
    const result = evaluate('plastic_water_bottle', 'contains_liquid')

    expect(result.destinationBin.code).toBe('bottle_can')
    expect(result.componentActions.map((action) => action.destinationBin.code)).toEqual([
      'organic',
      'bottle_can',
      'clean_plastic',
    ])
  })

  it('routes a plastic bottle with liquid through component sorting', () => {
    const result = evaluate('plastic_water_bottle', 'contains_liquid')

    expect(result.mainInstruction).toContain('Pour out the remaining liquid')
    expect(result.preparationSteps).toContain('Pour remaining liquid into Organic Waste.')
  })

  it('routes a clean plastic cup to Clean Plastic', () => {
    const result = evaluate('plastic_takeaway_cup', 'clean_empty')

    expect(result.destinationBin.code).toBe('clean_plastic')
    expect(result.specialHandling).toBe(false)
  })

  it('routes a dirty plastic cup that cannot be cleaned to Landfill', () => {
    const result = evaluate('plastic_takeaway_cup', 'cannot_clean')

    expect(result.destinationBin.code).toBe('landfill')
    expect(result.warning).toContain('food-contaminated plastic')
  })

  it('routes a cleanable dirty plastic cup to Clean Plastic after rinsing', () => {
    const result = evaluate('plastic_takeaway_cup', 'empty_dirty_cleanable')

    expect(result.destinationBin.code).toBe('clean_plastic')
    expect(result.preparationSteps.join(' ')).toContain('Rinse')
  })

  it('routes a plastic food container with food through Organic and Clean Plastic', () => {
    const result = evaluate('plastic_food_container', 'contains_food_liquid')

    expect(result.destinationBin.code).toBe('clean_plastic')
    expect(result.componentActions.map((action) => action.destinationBin.code)).toEqual(['organic', 'clean_plastic'])
  })

  it('routes cosmetic containers to Landfill regardless of the selected condition', () => {
    const result = evaluate('plastic_cosmetic_container', 'clean_empty')

    expect(result.destinationBin.code).toBe('landfill')
    expect(result.preparationSteps).toContain('Place the cosmetic container in Landfill.')
    expect(result.whyCategory).toContain('Cosmetic containers often retain product residue')
  })

  it('uses detected food to override the default clean-container condition', () => {
    const result = evaluateDisposal({
      siteCode: 'default_station',
      itemCode: 'plastic_food_container',
      conditionAnswers: answers('clean_empty'),
      locale: 'en',
      detectedComponents: [
        { code: 'container', confidence: 1, areaRatio: 0.65 },
        { code: 'remaining_liquid', confidence: 0.91, areaRatio: 0.35 },
      ],
    })

    expect(result.destinationBin.code).toBe('clean_plastic')
    expect(result.preparationSteps[0]).toContain('Empty leftover food')
    expect(result.componentActions.map((action) => action.destinationBin.code)).toEqual(['organic', 'clean_plastic'])
  })

  it('routes clean cardboard to Paper & Cardboard', () => {
    const result = evaluate('cardboard_box', 'clean_dry')

    expect(result.destinationBin.code).toBe('paper_cardboard')
  })

  it('routes greasy cardboard to Landfill', () => {
    const result = evaluate('cardboard_box', 'greasy')

    expect(result.destinationBin.code).toBe('landfill')
  })

  it('routes paper cups to Landfill with liquid separation', () => {
    const result = evaluate('paper_cup')

    expect(result.destinationBin.code).toBe('landfill')
    expect(result.componentActions.map((action) => action.destinationBin.code)).toEqual([
      'organic',
      'landfill',
      'clean_plastic',
      'landfill',
    ])
  })

  it('routes empty medicine packaging to Landfill', () => {
    const result = evaluate('medicine_blister_pack')

    expect(result.destinationBin.code).toBe('landfill')
    expect(result.specialHandling).toBe(false)
    expect(result.warning).toContain('medicine remains')
  })

  it('keeps the item destination as the main category when it detects separate parts', () => {
    const result = evaluateDisposal({
      siteCode: 'default_station',
      itemCode: 'drink_carton',
      conditionAnswers: answers('default'),
      locale: 'en',
      detectedComponents: [
        { code: 'plastic_cap', confidence: 0.91, areaRatio: 0.61 },
        { code: 'carton_body', confidence: 0.96, areaRatio: 0.39 },
      ],
    })

    expect(result.destinationBin.code).toBe('paper_cardboard')
    expect(result.componentActions.map((action) => action.code)).toEqual([
      'remaining_liquid',
      'carton_body',
      'plastic_cap',
    ])
  })

  it('keeps the main item destination regardless of detected part area', () => {
    const result = evaluateDisposal({
      siteCode: 'default_station',
      itemCode: 'drink_carton',
      conditionAnswers: answers('default'),
      locale: 'en',
      detectedComponents: [
        { code: 'carton_body', confidence: 0.95, areaRatio: 0.86 },
        { code: 'plastic_cap', confidence: 0.89, areaRatio: 0.14 },
      ],
    })

    expect(result.destinationBin.code).toBe('paper_cardboard')
  })

  it('routes food waste to Organic Waste', () => {
    const result = evaluate('food_waste')

    expect(result.destinationBin.code).toBe('organic')
  })

  it('routes cat waste to Landfill instead of Organic Waste', () => {
    const result = evaluate('cat_waste')

    expect(result.destinationBin.code).toBe('landfill')
  })

  it('routes healthcare packaging to Special Handling', () => {
    expect(evaluate('eye_drop_container').destinationBin.code).toBe('special_handling')
    expect(evaluate('topical_cream_container').destinationBin.code).toBe('special_handling')
    expect(evaluate('medicine_bottle').destinationBin.code).toBe('special_handling')
  })

  it('routes a glass jar to Bottle & Can when it is empty', () => {
    expect(evaluate('glass_jar', 'empty').destinationBin.code).toBe('bottle_can')
  })

  it('keeps batteries out of the five normal bins', () => {
    const result = evaluate('battery')

    expect(result.destinationBin.code).toBe('special_handling')
    expect(result.specialHandling).toBe(true)
  })

  it('keeps broken glass out of the five normal bins', () => {
    const result = evaluate('broken_glass')

    expect(result.destinationBin.code).toBe('special_handling')
    expect(result.specialHandling).toBe(true)
  })

  it('filters reuse suggestions by required and prohibited conditions', () => {
    const clean = evaluate('cardboard_box', 'clean_dry')
    const greasy = evaluate('cardboard_box', 'greasy')

    expect(clean.reuseSuggestions.map((suggestion) => suggestion.code)).toContain('cardboard_storage')
    expect(greasy.reuseSuggestions).toHaveLength(0)
  })

  it('offers a relevant Eco Tip for a clean recyclable item', () => {
    const result = evaluate('plastic_water_bottle', 'empty')

    expect(result.reuseSuggestions.map((suggestion) => suggestion.code)).toContain('plastic_bottle_planter')
  })

  it('throws when no verified rule exists', () => {
    expect(() => evaluate('unknown')).toThrow(AppError)
  })

  it('returns a special-handling result with safe text only', () => {
    const result = evaluate('chemical_container')

    expect(result.specialHandling).toBe(true)
    expect(result.mainInstruction).toContain('Special handling')
    expect(result.preparationSteps.join(' ')).not.toContain('dismantle')
  })

  it('has a usable default rule for every active reference item', () => {
    const activeCodes = wasteItems.filter((item) => item.isActive && item.code !== 'unknown').map((item) => item.code)

    expect(() => activeCodes.forEach((itemCode) => evaluate(itemCode, getDefaultConditionForItem(itemCode)))).not.toThrow()
  })

  it('keeps the expanded catalogue unique and above the original MVP baseline', () => {
    const activeCodes = wasteItems.filter((item) => item.isActive && item.code !== 'unknown').map((item) => item.code)

    expect(new Set(activeCodes).size).toBe(activeCodes.length)
    expect(activeCodes.length).toBeGreaterThan(100)
  })

  it('keeps every training class connected to an active reference item', () => {
    const activeCodes = new Set(wasteItems.filter((item) => item.isActive).map((item) => item.code))

    expect(trainingTargetClassCodes.filter((itemCode) => !activeCodes.has(itemCode))).toEqual([])
  })

  it('creates a normal result-panel payload for a broad plastic match', () => {
    const result = evaluateMaterialFallback('plastic')

    expect(result.matchLevel).toBe('material')
    expect(result.destinationBin.code).toBe('clean_plastic')
    expect(result.item.nameEn).toBe('Likely plastic material')
    expect(result.warning).toContain('material-only result')
  })

  it('routes contaminated broad plastic and paper results to Landfill', () => {
    expect(evaluateMaterialFallback('plastic', 'dirty').destinationBin.code).toBe('landfill')
    expect(evaluateMaterialFallback('paper_cardboard', 'wet').destinationBin.code).toBe('landfill')
  })

  it('does not select a disposal bin for a mixed or uncertain material', () => {
    const result = evaluateMaterialFallback('mixed_uncertain')

    expect(result.destinationBin.code).toBe('mixed_uncertain')
    expect(result.whyCategory).toContain('not choosing a disposal bin')
  })
})
