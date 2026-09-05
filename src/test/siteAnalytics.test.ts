import { describe, expect, it } from 'vitest'
import { formatDuration, humanizeFeatureCode, normalizeStatsPath } from '../services/siteAnalytics'

describe('site analytics helpers', () => {
  it('formats active time without implying false precision', () => {
    expect(formatDuration(42)).toBe('42s')
    expect(formatDuration(120)).toBe('2m')
    expect(formatDuration(3725)).toBe('1h 2m')
  })

  it('normalizes app routes for aggregate reporting', () => {
    expect(normalizeStatsPath('/S-RT-R-C/', '#/history?source=nav')).toBe('/S-RT-R-C/#/history')
    expect(normalizeStatsPath('/', '#/')).toBe('/#')
  })

  it('turns feature codes into readable labels', () => {
    expect(humanizeFeatureCode('feedback_confirmation')).toBe('Feedback Confirmation')
  })
})
