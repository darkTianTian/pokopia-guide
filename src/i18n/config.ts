export const LOCALES = ["en", "cn", "jp"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  cn: "中文",
  jp: "日本語",
}

export const LOCALE_LANG: Record<Locale, string> = {
  en: "en",
  cn: "zh-CN",
  jp: "ja",
}

export function getLocalePath(locale: Locale, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) {
    return normalizedPath
  }
  return `/${locale}${normalizedPath}`
}

const SITE_URL = "https://pokopiaguide.com"

export function getPageAlternates(locale: Locale, path: string) {
  return {
    canonical: `${SITE_URL}${getLocalePath(locale, path)}`,
    languages: Object.fromEntries(
      LOCALES.map((loc) => [LOCALE_LANG[loc], `${SITE_URL}${getLocalePath(loc, path)}`])
    ),
  }
}

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale)
}

type TranslationDict = Record<string, string | Record<string, string>>

const translationCache = new Map<Locale, TranslationDict>()

export async function getTranslations(locale: Locale): Promise<TranslationDict> {
  const cached = translationCache.get(locale)
  if (cached) return cached

  const translations = (await import(`./${locale}.json`)).default as TranslationDict
  translationCache.set(locale, translations)
  return translations
}

export function t(
  translations: TranslationDict,
  key: string
): string {
  const parts = key.split(".")
  if (parts.length === 2) {
    const section = translations[parts[0]]
    if (typeof section === "object" && section !== null) {
      return section[parts[1]] ?? key
    }
  }
  const value = translations[key]
  if (typeof value === "string") return value
  return key
}
