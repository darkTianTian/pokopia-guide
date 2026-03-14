import type { Locale } from "@/i18n/config"
import itemsData from "@/../content/items.json"
import mappingEn from "@/../content/item-name-mapping-en.json"
import mappingZh from "@/../content/item-name-mapping-zh.json"
import obtainMappingEn from "@/../content/item-obtain-mapping-en.json"
import obtainMappingZh from "@/../content/item-obtain-mapping-zh.json"
import recipeMappingEn from "@/../content/item-recipe-mapping-en.json"
import recipeMappingZh from "@/../content/item-recipe-mapping-zh.json"
import descMappingEn from "@/../content/item-desc-mapping-en.json"
import descMappingZh from "@/../content/item-desc-mapping-zh.json"
import mappingKo from "@/../content/item-name-mapping-ko.json"
import obtainMappingKo from "@/../content/item-obtain-mapping-ko.json"
import recipeMappingKo from "@/../content/item-recipe-mapping-ko.json"
import descMappingKo from "@/../content/item-desc-mapping-ko.json"

interface RawMaterial {
  id: string
  nameJa: string
  count: number
}

interface RawItem {
  id: string
  nameJa: string
  category: string
  imageId: string
  description?: string
  obtain?: string[]
  recipe?: string[]
  materials?: RawMaterial[]
}

export interface ItemMaterial {
  id: string
  name: string
  count: number
  imageUrl: string
}

export interface Item {
  id: string
  nameJa: string
  name: string
  category: string
  categoryKey: string
  imageUrl: string
  description: string
  obtain: string[]
  recipe: string[]
  materials: ItemMaterial[]
}

const NAME_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: mappingEn as Record<string, string>,
  zh: mappingZh as Record<string, string>,
  ja: {},
  ko: mappingKo as Record<string, string>,
}

const OBTAIN_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: obtainMappingEn as Record<string, string>,
  zh: obtainMappingZh as Record<string, string>,
  ja: {},
  ko: obtainMappingKo as Record<string, string>,
}

const RECIPE_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: recipeMappingEn as Record<string, string>,
  zh: recipeMappingZh as Record<string, string>,
  ja: {},
  ko: recipeMappingKo as Record<string, string>,
}

const DESC_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: descMappingEn as Record<string, string>,
  zh: descMappingZh as Record<string, string>,
  ja: {},
  ko: descMappingKo as Record<string, string>,
}

function translateText(text: string, mapping: Record<string, string>): string {
  return mapping[text] || text
}

function translateTexts(texts: string[], mapping: Record<string, string>): string[] {
  return texts.map((t) => mapping[t] || t)
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  "家具": "furniture",
  "ざっか": "goods",
  "自然": "nature",
  "食べもの": "food",
  "たてもの": "building",
  "べんり": "utility",
  "ブロック": "block",
  "おくがい": "outdoor",
  "材料": "material",
  "その他": "other",
  "キット": "kit",
  "大切なもの": "key-item",
  "コレクション外": "uncollectable",
  "": "other",
}

const CATEGORY_ORDER = [
  "furniture",
  "goods",
  "nature",
  "food",
  "building",
  "utility",
  "block",
  "outdoor",
  "material",
  "kit",
  "key-item",
  "other",
  "uncollectable",
]

function getItemName(nameJa: string, locale: Locale): string {
  if (locale === "ja") return nameJa
  return NAME_MAPPINGS[locale][nameJa] || nameJa
}

function getCategoryKey(categoryJa: string): string {
  return CATEGORY_KEY_MAP[categoryJa] || "other"
}

function buildItems(locale: Locale): Item[] {
  return (itemsData as RawItem[]).map((raw) => ({
    id: raw.id,
    nameJa: raw.nameJa,
    name: getItemName(raw.nameJa, locale),
    category: getCategoryKey(raw.category),
    categoryKey: getCategoryKey(raw.category),
    imageUrl: `/images/items/item-${raw.id}.png`,
    description: raw.description
      ? (locale === "ja" ? raw.description : translateText(raw.description, DESC_MAPPINGS[locale]))
      : "",
    obtain: translateTexts(raw.obtain || [], locale === "ja" ? {} : OBTAIN_MAPPINGS[locale]),
    recipe: translateTexts(raw.recipe || [], locale === "ja" ? {} : RECIPE_MAPPINGS[locale]),
    materials: (raw.materials || []).map((m) => ({
      id: m.id,
      name: getItemName(m.nameJa, locale),
      count: m.count,
      imageUrl: `/images/items/item-${m.id}.png`,
    })),
  }))
}

const itemCache = new Map<Locale, Item[]>()

function getItemIndex(locale: Locale): Item[] {
  const cached = itemCache.get(locale)
  if (cached) return cached
  const items = buildItems(locale)
  itemCache.set(locale, items)
  return items
}

export function getAllItems(locale: Locale): Item[] {
  return getItemIndex(locale)
}

export interface ItemCategory {
  key: string
  count: number
}

export function getItemCategories(locale: Locale): ItemCategory[] {
  const items = getAllItems(locale)
  const counts = new Map<string, number>()

  for (const item of items) {
    counts.set(item.categoryKey, (counts.get(item.categoryKey) || 0) + 1)
  }

  return CATEGORY_ORDER
    .filter((key) => counts.has(key))
    .map((key) => ({
      key,
      count: counts.get(key) || 0,
    }))
}

export { CATEGORY_ORDER }
