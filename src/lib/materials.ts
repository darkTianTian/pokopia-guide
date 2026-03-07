import type { Locale } from "@/i18n/config"
import habitatMappingEn from "@/../content/habitat-mapping-en.json"
import habitatMappingZh from "@/../content/habitat-mapping-zh.json"
import habitatMappingJa from "@/../content/habitat-mapping.json"
import _habitatMaterialsEn from "@/../content/habitat-materials-en.json"
import _habitatMaterialsZh from "@/../content/habitat-materials-zh.json"
import _habitatMaterialsJa from "@/../content/habitat-materials.json"

const habitatMaterialsEn = _habitatMaterialsEn as Record<string, string>
const habitatMaterialsZh = _habitatMaterialsZh as Record<string, string>
const habitatMaterialsJa = _habitatMaterialsJa as Record<string, string>

const HABITAT_NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  en: habitatMappingEn,
  zh: habitatMappingZh,
  ja: habitatMappingJa,
}

const HABITAT_MATERIALS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  en: habitatMaterialsEn,
  zh: habitatMaterialsZh,
  ja: habitatMaterialsJa,
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
      const match = part.match(/^(.+?)\s+x(\d+)$/)
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
 * Build a mapping from English slug to locale-specific material name.
 * For each habitat, we parse both English and locale materials by position index
 * to correlate English slugs with locale-specific names.
 */
function buildSlugToLocaleName(locale: Locale): Map<string, string> {
  if (locale === "en") return new Map()

  const localeMap = HABITAT_MATERIALS_BY_LOCALE[locale]
  const mapping = new Map<string, string>()

  for (const [idStr, enStr] of Object.entries(habitatMaterialsEn)) {
    const localeStr = localeMap[idStr]
    if (!localeStr) continue

    const enItems = parseMaterialString(enStr)
    const localeItems = parseMaterialString(localeStr)

    for (let i = 0; i < enItems.length && i < localeItems.length; i++) {
      const slug = toSlug(enItems[i].name)
      if (!mapping.has(slug)) {
        mapping.set(slug, localeItems[i].name)
      }
    }
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
