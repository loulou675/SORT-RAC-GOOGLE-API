import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from '../lib/normalization'
import { searchWasteItems } from '../features/search/searchEngine'

describe('search', () => {
  it('normalizes Vietnamese accents and đ', () => {
    expect(normalizeSearchText('Chất thải hữu cơ ĐẶC BIỆT')).toBe('chat thai huu co dac biet')
  })

  it('matches Vietnamese aliases without accents', () => {
    const [result] = searchWasteItems('chai nuoc')

    expect(result.item.code).toBe('plastic_water_bottle')
  })

  it('matches English partial names', () => {
    const [result] = searchWasteItems('pizza')

    expect(result.item.code).toBe('pizza_box')
  })

  it('maps cigarette packs to paperboard packaging for search and feedback', () => {
    const [result] = searchWasteItems('cigarette pack')

    expect(result.item.code).toBe('paperboard_packaging')
  })

  it('handles small typos where reasonable', () => {
    const [result] = searchWasteItems('baterny')

    expect(result.item.code).toBe('battery')
  })

  it('returns no result for unsupported names', () => {
    expect(searchWasteItems('galaxy laser umbrella')).toEqual([])
  })
})
