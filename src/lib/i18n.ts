import type { Locale } from '../types/domain'

export const defaultLocale: Locale = 'en'

export function pickLocale<T extends { nameEn?: string; nameVi?: string }>(
  value: T,
  locale: Locale,
) {
  return locale === 'vi' ? value.nameVi : value.nameEn
}
