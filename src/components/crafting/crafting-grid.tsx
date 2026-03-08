"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { QuantityDots } from "@/components/ui/quantity-dots"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const CATEGORY_ORDER = [
  "furniture",
  "decor",
  "outdoor",
  "cooking-tool",
  "building",
  "blocks",
  "lighting",
  "transport",
  "special",
]

interface RecipeMaterial {
  name: string
  quantity: number
}

interface RecipeItem {
  id: string
  name: string
  category: string
  materials: RecipeMaterial[]
  obtainMethod: string
}

interface CraftingGridProps {
  recipes: RecipeItem[]
  locale: Locale
}

export function CraftingGrid({ recipes, locale }: CraftingGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return recipes
    const q = query.toLowerCase()
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.materials.some((m) => m.name.toLowerCase().includes(q))
    )
  }, [recipes, query])

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, RecipeItem[]>()
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
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }, [filtered])

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.crafting.searchRecipe}
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
            {tr.crafting.showingCount.replace(
              "{{count}}",
              String(filtered.length)
            )}
          </p>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-12">
          {groupedByCategory.map(([category, categoryRecipes]) => {
            const categoryLabel =
              (tr.craftingCategories as Record<string, string>)[category] ??
              category

            return (
              <section key={category}>
                <h3 className="mb-5 text-xl font-bold text-foreground">
                  {categoryLabel}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({categoryRecipes.length})
                  </span>
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryRecipes.map((recipe) => (
                    <article
                      key={recipe.id}
                      className="relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-xl"
                    >
                      <h4 className="text-lg font-bold tracking-tight text-foreground">
                        {recipe.name}
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {recipe.materials.map((m) => (
                          <span
                            key={m.name}
                            className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-primary/20"
                          >
                            {m.name}
                            <QuantityDots count={m.quantity} className="ml-0.5" />
                          </span>
                        ))}
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
          {tr.crafting.noResults}
        </p>
      )}
    </>
  )
}
