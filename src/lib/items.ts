import type { Locale } from "@/i18n/config"
import itemsData from "@/../content/items.json"
import mappingEn from "@/../content/item-name-mapping-en.json"
import mappingZh from "@/../content/item-name-mapping-zh.json"

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
    description: raw.description || "",
    obtain: raw.obtain || [],
    recipe: raw.recipe || [],
    materials: (raw.materials || []).map((m) => ({
      id: m.id,
      name: getItemName(m.nameJa, locale),
      count: m.count,
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
