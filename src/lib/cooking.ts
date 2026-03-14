import type { Locale } from "@/i18n/config"
import recipesData from "@/../content/cooking-recipes.json"
import mappingEn from "@/../content/cooking-name-mapping-en.json"
import mappingZh from "@/../content/cooking-name-mapping-zh.json"
import mappingKo from "@/../content/cooking-name-mapping-ko.json"
import mappingZhHans from "@/../content/cooking-name-mapping-zh-Hans.json"
import mappingEs from "@/../content/cooking-name-mapping-es.json"

interface RawSpecialIngredient {
  nameJa: string
  wildcard?: string
}

interface RawCookingRecipe {
  id: string
  nameJa: string
  category: string
  flavor: string | null
  specialIngredients: RawSpecialIngredient[]
  requiredSpecialty: string | null
  price: number
  enhanced?: boolean
}

export interface CookingIngredient {
  name: string
  slug: string
  isWildcard: boolean
}

const INGREDIENT_SLUGS: Record<string, string> = {
  "リンゴのみ": "leppa-berry",
  "わかめ": "seaweed",
  "ゼロのみ": "rowap-berry",
  "りっぱなキノコ": "big-mushroom",
  "リリのみ": "lum-berry",
  "りっぱなニンジン": "ripe-carrot",
  "モモのみ": "pecha-berry",
  "トマト": "tomato",
  "ポテト": "potato",
  "メリのみ": "rawst-berry",
  "キーのみ": "aspear-berry",
  "はっぱ": "leaf",
  "まめ": "bean",
}

export interface CookingRecipe {
  id: string
  name: string
  category: CookingCategory
  flavor: string | null
  flavorLabel: string | null
  baseIngredient: string
  baseIngredientId: string
  tool: string
  toolId: string
  powersUp: string
  powersUpId: string
  specialIngredients: CookingIngredient[]
  requiredSpecialty: string | null
  requiredSpecialtyLabel: string | null
  price: number
  enhanced: boolean
}

export const COOKING_CATEGORIES = [
  "salad",
  "soup",
  "bread",
  "hamburger-steak",
] as const

export type CookingCategory = (typeof COOKING_CATEGORIES)[number]

const CATEGORY_META: Record<
  CookingCategory,
  {
    baseIngredientJa: string
    baseIngredientId: string
    toolId: string
    powersUpId: string
  }
> = {
  salad: {
    baseIngredientJa: "はっぱ",
    baseIngredientId: "leaf",
    toolId: "cutting-board",
    powersUpId: "leafage",
  },
  soup: {
    baseIngredientJa: "おいしいみず",
    baseIngredientId: "fresh-water",
    toolId: "cooking-pot",
    powersUpId: "water-gun",
  },
  bread: {
    baseIngredientJa: "こむぎ",
    baseIngredientId: "wheat",
    toolId: "bread-oven",
    powersUpId: "cut",
  },
  "hamburger-steak": {
    baseIngredientJa: "まめ",
    baseIngredientId: "bean",
    toolId: "frying-pan",
    powersUpId: "rock-smash",
  },
}

interface CookingMapping {
  recipes: Record<string, string>
  ingredients: Record<string, string>
  wildcards: Record<string, string>
  categories: Record<string, string>
  flavors: Record<string, string>
  tools: Record<string, string>
  moves: Record<string, string>
  baseIngredients: Record<string, string>
}

const MAPPINGS: Record<Locale, CookingMapping> = {
  en: mappingEn,
  zh: mappingZh,
  "zh-Hans": mappingZhHans,
  ko: mappingKo,
  es: mappingEs,
  ja: {
    recipes: {},
    ingredients: {},
    wildcards: {},
    categories: {
      salad: "サラダ",
      soup: "スープ",
      bread: "パン",
      "hamburger-steak": "ハンバーグ",
    },
    flavors: {
      sweet: "あまい",
      sour: "すっぱい",
      spicy: "からい",
      bitter: "にがい",
      dry: "しぶい",
    },
    tools: {
      "cutting-board": "まないた",
      "cooking-pot": "おなべ",
      "bread-oven": "パンがま",
      "frying-pan": "フライパン",
    },
    moves: {
      leafage: "このは",
      "water-gun": "みずでっぽう",
      cut: "いあいぎり",
      "rock-smash": "いわくだき",
    },
    baseIngredients: {
      leaf: "はっぱ",
      "fresh-water": "おいしいみず",
      wheat: "こむぎ",
      bean: "まめ",
    },
  },
}

function getRecipeName(nameJa: string, locale: Locale): string {
  if (locale === "ja") return nameJa
  return MAPPINGS[locale].recipes[nameJa] || nameJa
}

function getIngredientName(nameJa: string, locale: Locale): string {
  if (locale === "ja") return nameJa
  return MAPPINGS[locale].ingredients[nameJa] || nameJa
}

function getWildcardName(wildcard: string, locale: Locale): string {
  return MAPPINGS[locale].wildcards[wildcard] || wildcard
}

function buildRecipes(locale: Locale): CookingRecipe[] {
  const mapping = MAPPINGS[locale]

  return (recipesData as RawCookingRecipe[]).map((raw) => {
    const category = raw.category as CookingCategory
    const meta = CATEGORY_META[category]

    return {
      id: raw.id,
      name: getRecipeName(raw.nameJa, locale),
      category,
      flavor: raw.flavor,
      flavorLabel: raw.flavor ? (mapping.flavors[raw.flavor] || raw.flavor) : null,
      baseIngredient: mapping.baseIngredients[meta.baseIngredientId] || meta.baseIngredientJa,
      baseIngredientId: meta.baseIngredientId,
      tool: mapping.tools[meta.toolId] || meta.toolId,
      toolId: meta.toolId,
      powersUp: mapping.moves[meta.powersUpId] || meta.powersUpId,
      powersUpId: meta.powersUpId,
      specialIngredients: raw.specialIngredients.map((si) => ({
        name: si.wildcard
          ? getWildcardName(si.wildcard, locale)
          : getIngredientName(si.nameJa, locale),
        slug: si.wildcard ? si.wildcard : (INGREDIENT_SLUGS[si.nameJa] || si.nameJa),
        isWildcard: !!si.wildcard,
      })),
      requiredSpecialty: raw.requiredSpecialty,
      requiredSpecialtyLabel: raw.requiredSpecialty
        ? (mapping.flavors[raw.requiredSpecialty] || null)
        : null,
      price: raw.price,
      enhanced: raw.enhanced || false,
    }
  })
}

const recipeCache = new Map<Locale, CookingRecipe[]>()

function getRecipeIndex(locale: Locale): CookingRecipe[] {
  const cached = recipeCache.get(locale)
  if (cached) return cached
  const recipes = buildRecipes(locale)
  recipeCache.set(locale, recipes)
  return recipes
}

export function getAllCookingRecipes(locale: Locale): CookingRecipe[] {
  return getRecipeIndex(locale)
}
