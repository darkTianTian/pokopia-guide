import type { Locale } from "@/i18n/config"
import habitatMappingEn from "@/../content/habitat-mapping-en.json"
import habitatMappingZh from "@/../content/habitat-mapping-zh.json"
import habitatMappingJa from "@/../content/habitat-mapping.json"
import habitatMappingKo from "@/../content/habitat-mapping-ko.json"
import habitatMappingZhHans from "@/../content/habitat-mapping-zh-Hans.json"
import habitatMappingEs from "@/../content/habitat-mapping-es.json"
import _habitatMaterialsEn from "@/../content/habitat-materials-en.json"
import _materialSources from "@/../content/material-sources.json"
import _sourceTranslations from "@/../content/material-source-translations.json"
import _materialNameMapping from "@/../content/material-name-mapping.json"

const habitatMaterialsEn = _habitatMaterialsEn as Record<string, string>
const materialSources = _materialSources as Record<
  string,
  { nameJa: string; sources: string[]; screenshots?: string[] }
>
const sourceTranslations = _sourceTranslations as Record<
  string,
  { en: string; zh: string; "zh-Hans"?: string; ko?: string; es?: string }
>
const materialNameMapping = _materialNameMapping as Record<
  string,
  { zh: string | null; "zh-Hans"?: string | null; ja: string | null }
>

function translateSources(sources: string[], locale: Locale): string[] {
  if (locale === "ja") return sources
  return sources.map((s) => sourceTranslations[s]?.[locale] ?? sourceTranslations[s]?.en ?? s)
}

const HABITAT_NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  en: habitatMappingEn,
  zh: habitatMappingZh,
  "zh-Hans": habitatMappingZhHans,
  ja: habitatMappingJa,
  ko: habitatMappingKo,
  es: habitatMappingEs,
}

export interface MaterialUsage {
  habitatId: number
  habitatName: string
  habitatImage: string
  quantity: number
}

export interface Material {
  slug: string
  name: string
  sources: string[]
  screenshots: string[]
  habitats: MaterialUsage[]
  totalUsage: number
}

interface ParsedItem {
  name: string
  quantity: number
}

function parseMaterialString(str: string): ParsedItem[] {
  return str
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.+?)\s*x(\d+)$/)
      if (match) {
        return { name: match[1].trim(), quantity: Number(match[2]) }
      }
      return { name: part.trim(), quantity: 1 }
    })
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Build a mapping from English slug to locale-specific material name
 * using the pre-computed mapping file (generated via constraint propagation).
 */
function buildSlugToLocaleName(locale: Locale): Map<string, string> {
  if (locale === "en") return new Map()

  const mapping = new Map<string, string>()
  for (const [slug, names] of Object.entries(materialNameMapping)) {
    const name = (names as Record<string, string | null>)[locale] ?? null
    if (name) mapping.set(slug, name)
  }
  return mapping
}

function buildMaterialIndex(locale: Locale): Material[] {
  const habitatNames = HABITAT_NAMES_BY_LOCALE[locale]
  const slugToLocaleName = buildSlugToLocaleName(locale)

  // Always build from English materials for consistent slugs
  const index = new Map<string, { name: string; habitats: MaterialUsage[] }>()

  for (const [idStr, materialStr] of Object.entries(habitatMaterialsEn)) {
    if (!materialStr) continue
    const habitatId = Number(idStr)
    const habitatName = habitatNames[idStr] ?? `Habitat ${idStr}`
    const habitatImage = `/images/habitats/habitat_${habitatId}.png`

    const items = parseMaterialString(materialStr)
    for (const item of items) {
      const slug = toSlug(item.name)
      const displayName = slugToLocaleName.get(slug) ?? item.name
      const existing = index.get(slug)
      if (existing) {
        existing.habitats.push({
          habitatId,
          habitatName,
          habitatImage,
          quantity: item.quantity,
        })
      } else {
        index.set(slug, {
          name: displayName,
          habitats: [
            {
              habitatId,
              habitatName,
              habitatImage,
              quantity: item.quantity,
            },
          ],
        })
      }
    }
  }

  return Array.from(index.entries())
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      sources: translateSources(materialSources[slug]?.sources ?? [], locale),
      screenshots: materialSources[slug]?.screenshots ?? [],
      habitats: data.habitats.sort((a, b) => a.habitatId - b.habitatId),
      totalUsage: data.habitats.length,
    }))
    .sort((a, b) => b.totalUsage - a.totalUsage)
}

const materialCache = new Map<Locale, Material[]>()

function getMaterialIndex(locale: Locale): Material[] {
  const cached = materialCache.get(locale)
  if (cached) return cached
  const index = buildMaterialIndex(locale)
  materialCache.set(locale, index)
  return index
}

export function getAllMaterials(locale: Locale): Material[] {
  return getMaterialIndex(locale)
}

export function getMaterialBySlug(
  slug: string,
  locale: Locale
): Material | undefined {
  return getMaterialIndex(locale).find((m) => m.slug === slug)
}

export function getAllMaterialSlugs(locale: Locale): string[] {
  return getMaterialIndex(locale).map((m) => m.slug)
}

export interface MaterialItem {
  slug: string
  name: string
  quantity: number
}

export function getMaterialItems(
  materialsEn: string | null,
  locale: Locale
): MaterialItem[] {
  if (!materialsEn) return []
  const enItems = parseMaterialString(materialsEn)
  const index = getMaterialIndex(locale)
  const slugToName = new Map(index.map((m) => [m.slug, m.name]))

  return enItems.map((item) => {
    const slug = toSlug(item.name)
    return {
      slug,
      name: slugToName.get(slug) ?? item.name,
      quantity: item.quantity,
    }
  })
}
