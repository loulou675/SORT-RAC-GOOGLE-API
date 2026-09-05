import { wasteItems } from '../../data/referenceData'
import { levenshteinDistance, normalizeSearchText } from '../../lib/normalization'
import type { WasteItem } from '../../types/domain'

export interface SearchResult {
  item: WasteItem
  score: number
  matchedBy: string
}

export function searchWasteItems(query: string, limit = 8): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  return wasteItems
    .filter((item) => item.isActive && item.code !== 'unknown')
    .map((item) => scoreItem(item, normalizedQuery))
    .filter((result): result is SearchResult => result !== null)
    .sort((left, right) => right.score - left.score || left.item.nameEn.localeCompare(right.item.nameEn))
    .slice(0, limit)
}

export function commonSearchItems() {
  return [
    'Plastic takeaway cup',
    'Paper cup',
    'Pizza box',
    'Battery',
    'Fruit peel',
    'Plastic water bottle',
  ]
}

function scoreItem(item: WasteItem, normalizedQuery: string): SearchResult | null {
  const candidates = [item.nameEn, item.nameVi, ...item.aliasesEn, ...item.aliasesVi].map((value) => ({
    raw: value,
    normalized: normalizeSearchText(value),
  }))

  let best: SearchResult | null = null

  for (const candidate of candidates) {
    const score = scoreCandidate(normalizedQuery, candidate.normalized)

    if (score > 0 && (!best || score > best.score)) {
      best = { item, score, matchedBy: candidate.raw }
    }
  }

  return best
}

function scoreCandidate(query: string, candidate: string) {
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 92
  if (candidate.includes(query)) return 82
  if (query.includes(candidate)) return 76

  const queryWords = query.split(' ')
  const candidateWords = candidate.split(' ')

  let wordScore = 0

  for (const queryWord of queryWords) {
    const bestDistance = Math.min(...candidateWords.map((candidateWord) => levenshteinDistance(queryWord, candidateWord)))
    const typoAllowed = queryWord.length <= 4 ? 1 : 2

    if (bestDistance <= typoAllowed) {
      wordScore += 20
    }
  }

  if (wordScore > 0 && wordScore >= queryWords.length * 14) {
    return Math.min(70, wordScore)
  }

  return 0
}
