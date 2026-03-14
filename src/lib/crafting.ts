import type { Locale } from "@/i18n/config"
import recipesData from "@/../content/crafting-recipes.json"
import mappingEn from "@/../content/crafting-name-mapping-en.json"
import mappingZh from "@/../content/crafting-name-mapping-zh.json"
import mappingKo from "@/../content/crafting-name-mapping-ko.json"
import mappingZhHans from "@/../content/crafting-name-mapping-zh-Hans.json"
import mappingEs from "@/../content/crafting-name-mapping-es.json"

interface RawRecipe {
  id: string
  nameJa: string
  category: string
  materials: { nameJa: string; quantity: number }[]
  obtainMethod: string
}

export interface RecipeIngredient {
  name: string
  slug: string
  quantity: number
}

export interface CraftingRecipe {
  id: string
  name: string
  category: string
  materials: RecipeIngredient[]
  obtainMethod: string
}

const RECIPE_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: mappingEn.recipes,
  zh: mappingZh.recipes,
  "zh-Hans": mappingZhHans.recipes,
  ja: {},
  ko: mappingKo.recipes,
  es: mappingEs.recipes,
}

const MATERIAL_MAPPINGS: Record<Locale, Record<string, string>> = {
  en: mappingEn.materials,
  zh: mappingZh.materials,
  "zh-Hans": mappingZhHans.materials,
  ja: {},
  ko: mappingKo.materials,
  es: mappingEs.materials,
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function getRecipeName(nameJa: string, locale: Locale): string {
  if (locale === "ja") return nameJa
  return RECIPE_MAPPINGS[locale][nameJa] || nameJa
}

function getMaterialName(nameJa: string, locale: Locale): string {
  if (locale === "ja") return nameJa
  return MATERIAL_MAPPINGS[locale][nameJa] || nameJa
}

function getMaterialSlug(nameJa: string): string {
  const enName = MATERIAL_MAPPINGS.en[nameJa]
  return enName ? toSlug(enName) : toSlug(nameJa)
}

function buildRecipes(locale: Locale): CraftingRecipe[] {
  return (recipesData as RawRecipe[]).map((raw) => ({
    id: raw.id,
    name: getRecipeName(raw.nameJa, locale),
    category: raw.category,
    materials: raw.materials.map((m) => ({
      name: getMaterialName(m.nameJa, locale),
      slug: getMaterialSlug(m.nameJa),
      quantity: m.quantity,
    })),
    obtainMethod: raw.obtainMethod,
  }))
}

const recipeCache = new Map<Locale, CraftingRecipe[]>()

function getRecipeIndex(locale: Locale): CraftingRecipe[] {
  const cached = recipeCache.get(locale)
  if (cached) return cached
  const recipes = buildRecipes(locale)
  recipeCache.set(locale, recipes)
  return recipes
}

export function getAllRecipes(locale: Locale): CraftingRecipe[] {
  return getRecipeIndex(locale)
}

export const RECIPE_CATEGORIES = [
  "furniture",
  "decor",
  "outdoor",
  "cooking-tool",
  "building",
  "blocks",
  "lighting",
  "transport",
  "special",
] as const

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]
