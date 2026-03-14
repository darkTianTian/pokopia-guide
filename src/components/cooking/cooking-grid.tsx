"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { WishlistButton } from "@/components/ui/wishlist-button"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"
import koTranslations from "@/i18n/ko.json"
import zhHansTranslations from "@/i18n/zh-Hans.json"
import esTranslations from "@/i18n/es.json"
import type { CookingCategory } from "@/lib/cooking"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  "zh-Hans": zhHansTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  es: esTranslations,
}

const CATEGORY_ORDER: CookingCategory[] = [
  "salad",
  "soup",
  "bread",
  "hamburger-steak",
]

const FLAVOR_COLORS: Record<string, string> = {
  sweet: "bg-pink-100 text-pink-700 ring-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:ring-pink-800/40",
  sour: "bg-yellow-100 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:ring-yellow-800/40",
  spicy: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/40",
  bitter: "bg-green-100 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-800/40",
  dry: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-800/40",
}

const FLAVOR_GLOWS: Record<string, string> = {
  sweet: "bg-pink-400/20 group-hover:bg-pink-400/30 dark:bg-pink-500/10 dark:group-hover:bg-pink-500/20",
  sour: "bg-yellow-400/20 group-hover:bg-yellow-400/30 dark:bg-yellow-500/10 dark:group-hover:bg-yellow-500/20",
  spicy: "bg-red-400/20 group-hover:bg-red-400/30 dark:bg-red-500/10 dark:group-hover:bg-red-500/20",
  bitter: "bg-green-400/20 group-hover:bg-green-400/30 dark:bg-green-500/10 dark:group-hover:bg-green-500/20",
  dry: "bg-orange-400/20 group-hover:bg-orange-400/30 dark:bg-orange-500/10 dark:group-hover:bg-orange-500/20",
}

export interface CookingIngredientItem {
  name: string
  slug: string
  isWildcard: boolean
}

export interface CookingRecipeItem {
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
  specialIngredients: CookingIngredientItem[]
  requiredSpecialty: string | null
  requiredSpecialtyLabel: string | null
  price: number
  enhanced: boolean
}

interface CookingGridProps {
  recipes: CookingRecipeItem[]
  locale: Locale
}

export function CookingGrid({ recipes, locale }: CookingGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return recipes
    const q = query.toLowerCase()
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.baseIngredient.toLowerCase().includes(q) ||
        r.specialIngredients.some((si) => si.name.toLowerCase().includes(q))
    )
  }, [recipes, query])

  const groupedByCategory = useMemo(() => {
    const groups = new Map<CookingCategory, CookingRecipeItem[]>()
    for (const r of filtered) {
      const existing = groups.get(r.category)
      if (existing) {
        existing.push(r)
      } else {
        groups.set(r.category, [r])
      }
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a[0])
      const bi = CATEGORY_ORDER.indexOf(b[0])
      return ai - bi
    })
  }, [filtered])

  const cookingTr = tr.cooking as Record<string, string>
  const categoryTr = tr.cookingCategories as Record<string, string>
  const specialtyTr = tr.specialties as Record<string, string>

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={cookingTr.searchRecipe}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {query && (
          <p className="text-xs text-muted-foreground">
            {cookingTr.showingCount.replace(
              "{{count}}",
              String(filtered.length)
            )}
          </p>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-12">
          {groupedByCategory.map(([category, categoryRecipes]) => {
            const categoryLabel = categoryTr[category] ?? category

            return (
              <section key={category}>
                <h3 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground">
                  {categoryLabel}
                  <span className="ml-3 inline-flex items-center justify-center rounded-full bg-muted px-3 py-1 text-sm font-semibold tracking-wide text-muted-foreground ring-1 ring-inset ring-border/50">
                    {categoryRecipes.length}
                  </span>
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryRecipes.map((recipe) => (
                    <article
                      key={recipe.id}
                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/50 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl"
                    >
                      {/* Decorative Background Blob mapped to flavor */}
                      <div className={`absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${recipe.flavor ? FLAVOR_GLOWS[recipe.flavor] || "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/5 dark:group-hover:bg-primary/10"}`} />

                      <WishlistButton
                        itemId={`cooking:${recipe.id}`}
                        className="absolute right-4 top-4 z-20"
                      />

                      <div className="relative flex flex-1 flex-col z-10">
                        {/* Header: Icon + Name + Price */}
                        <div className="flex items-start gap-4 pr-10">
                          <div className="relative shrink-0 transition-transform duration-500 group-hover:scale-105">
                            <SafeImage
                              src={`/images/cooking/recipes/${recipe.id}.png`}
                              alt={recipe.name}
                              width={72}
                              height={72}
                              className="rounded-xl drop-shadow-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-xl font-extrabold tracking-tight text-foreground line-clamp-2">
                                {recipe.name}
                              </h4>

                              {/* Required specialty directly under name */}
                              {recipe.requiredSpecialty && (
                                <div
                                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80 cursor-help"
                                  title={cookingTr.specialtyHint}
                                >
                                  <Image
                                    src={`/images/specialties/${recipe.requiredSpecialty}.png`}
                                    alt={specialtyTr[recipe.requiredSpecialty] || recipe.requiredSpecialty}
                                    width={16}
                                    height={16}
                                    className="rounded-sm opacity-80"
                                  />
                                  <span>{specialtyTr[recipe.requiredSpecialty] || recipe.requiredSpecialty}</span>
                                </div>
                              )}
                            </div>

                            {/* Badges row: flavor + enhanced */}
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {recipe.flavorLabel && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset shadow-sm ${FLAVOR_COLORS[recipe.flavor!] || "bg-muted text-muted-foreground ring-border"}`}
                                >
                                  {recipe.flavorLabel}
                                </span>
                              )}
                              {recipe.enhanced && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200/50 shadow-sm dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/40">
                                  {cookingTr.enhanced}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-bold text-secondary-foreground shadow-sm ring-1 ring-inset ring-border/50 backdrop-blur-sm">
                                <Image
                                  src="/images/cooking/life-coin.png"
                                  alt="Life Coin"
                                  width={14}
                                  height={14}
                                  className="inline-block"
                                />
                                {recipe.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ingredients Bento Box Formula */}
                        <div className="mt-6 rounded-[1.25rem] bg-black/5 dark:bg-white/5 p-3 flex flex-wrap items-center gap-2 ring-1 ring-inset ring-black/5 dark:ring-white/10 flex-1 content-start">
                          {/* Base ingredient */}
                          <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-sm font-bold text-foreground shadow-sm ring-1 ring-inset ring-border/50 backdrop-blur-md">
                            <SafeImage
                              src={`/images/cooking/ingredients/${recipe.baseIngredientId}.png`}
                              alt={recipe.baseIngredient}
                              width={20}
                              height={20}
                              className="rounded-sm"
                            />
                            {recipe.baseIngredient}
                          </div>

                          {/* Plus sign if there are special ingredients */}
                          {recipe.specialIngredients.length > 0 && (
                            <span className="text-muted-foreground/40 text-sm font-black mx-0.5">+</span>
                          )}

                          {/* Special ingredients */}
                          {recipe.specialIngredients.map((si, idx) => (
                            <div key={si.name} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-muted-foreground/40 text-sm font-black mx-0.5">+</span>}
                              <div
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold shadow-sm ring-1 ring-inset backdrop-blur-md ${si.isWildcard
                                  ? "bg-violet-100/80 text-violet-700 ring-violet-200/50 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800/40"
                                  : "bg-background/80 text-foreground ring-border/50"
                                  }`}
                              >
                                {!si.isWildcard && (
                                  <SafeImage
                                    src={`/images/cooking/ingredients/${si.slug}.png`}
                                    alt={si.name}
                                    width={20}
                                    height={20}
                                    className="rounded-sm"
                                  />
                                )}
                                {si.name}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Structured Footer: Tool + Powers up */}
                        <div className="-mx-6 -mb-6 mt-6 border-t border-border/40 bg-muted/30 px-6 py-4 flex items-center justify-between text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors group-hover:bg-muted/50">
                          <span className="inline-flex items-center gap-2">
                            <SafeImage
                              src={`/images/cooking/tools/${recipe.toolId}.png`}
                              alt={recipe.tool}
                              width={24}
                              height={24}
                              className="rounded bg-background/50 ring-1 ring-border/50 p-0.5"
                            />
                            <span className="text-foreground/90">{recipe.tool}</span>
                          </span>
                          <span className="inline-flex items-center gap-2" title={cookingTr.powersUp}>
                            <Image
                              src="/images/cooking/power-up.png"
                              alt="Power Up"
                              width={16}
                              height={16}
                            />
                            <SafeImage
                              src={`/images/cooking/moves/${recipe.powersUpId}.png`}
                              alt={recipe.powersUp}
                              width={32}
                              height={32}
                              className="rounded-full shadow-sm"
                            />
                            <span className="text-foreground">{recipe.powersUp}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {cookingTr.noResults}
        </p>
      )}
    </>
  )
}
