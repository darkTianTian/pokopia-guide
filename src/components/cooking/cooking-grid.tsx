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
import type { CookingCategory } from "@/lib/cooking"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
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
                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-border/80 hover:bg-background/60 hover:shadow-xl"
                    >
                      {/* Decorative Background Blob */}
                      <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20 dark:bg-primary/5 dark:group-hover:bg-primary/10" />

                      <WishlistButton
                        itemId={`cooking:${recipe.id}`}
                        className="absolute right-4 top-4 z-20"
                      />

                      <div className="relative flex flex-1 flex-col z-10">
                        {/* Header: Icon + Name + Price */}
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={`/images/cooking/recipes/${recipe.id}.png`}
                            alt={recipe.name}
                            width={56}
                            height={56}
                            className="shrink-0 rounded-xl"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                {recipe.name}
                              </h4>
                              <span className="shrink-0 inline-flex items-center gap-1 text-base font-bold text-amber-600 dark:text-amber-400">
                                <Image
                                  src="/images/cooking/life-coin.png"
                                  alt="Life Coin"
                                  width={18}
                                  height={18}
                                  className="inline-block"
                                />
                                {recipe.price}
                              </span>
                            </div>

                            {/* Badges row: flavor + enhanced */}
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {recipe.flavorLabel && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${FLAVOR_COLORS[recipe.flavor!] || "bg-muted text-muted-foreground ring-border"}`}
                                >
                                  {recipe.flavorLabel}
                                </span>
                              )}
                              {recipe.enhanced && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/40">
                                  {cookingTr.enhanced}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ingredients */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {/* Base ingredient */}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
                            <SafeImage
                              src={`/images/cooking/ingredients/${recipe.baseIngredientId}.png`}
                              alt={recipe.baseIngredient}
                              width={18}
                              height={18}
                              className="rounded-sm"
                            />
                            {recipe.baseIngredient}
                          </span>
                          {/* Special ingredients */}
                          {recipe.specialIngredients.map((si) => (
                            <span
                              key={si.name}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${
                                si.isWildcard
                                  ? "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/40"
                                  : "bg-primary/10 text-primary ring-primary/20 dark:bg-primary/5 dark:ring-primary/10"
                              }`}
                            >
                              {!si.isWildcard && (
                                <SafeImage
                                  src={`/images/cooking/ingredients/${si.slug}.png`}
                                  alt={si.name}
                                  width={18}
                                  height={18}
                                  className="rounded-sm"
                                />
                              )}
                              {si.name}
                            </span>
                          ))}
                        </div>

                        {/* Required specialty */}
                        {recipe.requiredSpecialty && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <Image
                              src={`/images/specialties/${recipe.requiredSpecialty}.png`}
                              alt={specialtyTr[recipe.requiredSpecialty] || recipe.requiredSpecialty}
                              width={24}
                              height={24}
                              className="rounded-md"
                            />
                            <span className="font-medium">
                              {cookingTr.requiredSpecialty}:{" "}
                              <span className="text-foreground">
                                {specialtyTr[recipe.requiredSpecialty] || recipe.requiredSpecialty}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Tool + Powers up */}
                        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <SafeImage
                              src={`/images/cooking/tools/${recipe.toolId}.png`}
                              alt={recipe.tool}
                              width={18}
                              height={18}
                              className="rounded-sm"
                            />
                            {recipe.tool}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            {cookingTr.powersUp}:
                            <SafeImage
                              src={`/images/cooking/moves/${recipe.powersUpId}.png`}
                              alt={recipe.powersUp}
                              width={18}
                              height={18}
                              className="rounded-sm"
                            />
                            {recipe.powersUp}
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
