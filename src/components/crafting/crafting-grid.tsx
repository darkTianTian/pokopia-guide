"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const CATEGORY_COLORS: Record<string, string> = {
  furniture: "bg-blue-500/10 text-blue-600 ring-blue-500/30 dark:text-blue-400",
  decor: "bg-pink-500/10 text-pink-600 ring-pink-500/30 dark:text-pink-400",
  outdoor: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  "cooking-tool": "bg-orange-500/10 text-orange-600 ring-orange-500/30 dark:text-orange-400",
  building: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  blocks: "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-400",
  lighting: "bg-yellow-500/10 text-yellow-600 ring-yellow-500/30 dark:text-yellow-400",
  transport: "bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-400",
  special: "bg-red-500/10 text-red-600 ring-red-500/30 dark:text-red-400",
}

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of recipes) {
      counts.set(r.category, (counts.get(r.category) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [recipes])

  const filtered = useMemo(() => {
    let result = recipes
    if (activeCategory) {
      result = result.filter((r) => r.category === activeCategory)
    }
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.materials.some((m) => m.name.toLowerCase().includes(q))
      )
    }
    return result
  }, [recipes, query, activeCategory])

  return (
    <>
      <div className="mb-6 space-y-4">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === null
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tr.crafting.allCategories}
          </button>
          {categories.map(([cat, count]) => {
            const categoryLabel =
              (tr.craftingCategories as Record<string, string>)[cat] ?? cat
            return (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {categoryLabel} ({count})
              </button>
            )
          })}
        </div>

        {(query || activeCategory) && (
          <p className="text-xs text-muted-foreground">
            {tr.crafting.showingCount.replace(
              "{{count}}",
              String(filtered.length)
            )}
          </p>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => {
            const colorClass =
              CATEGORY_COLORS[recipe.category] ?? CATEGORY_COLORS.furniture
            const categoryLabel =
              (tr.craftingCategories as Record<string, string>)[
                recipe.category
              ] ?? recipe.category
            const obtainLabel =
              (tr.craftingObtain as Record<string, string>)[
                recipe.obtainMethod
              ] ?? recipe.obtainMethod

            return (
              <article
                key={recipe.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {recipe.name}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${colorClass}`}
                  >
                    {categoryLabel}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.materials.map((m) => (
                    <span
                      key={m.name}
                      className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-primary/20"
                    >
                      {m.name}
                      <span className="ml-1 font-bold text-primary">
                        x{m.quantity}
                      </span>
                    </span>
                  ))}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-medium text-muted-foreground/70">
                    {obtainLabel}
                  </span>
                </div>
              </article>
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
