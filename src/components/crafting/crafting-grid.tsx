"use client"

import { useMemo, useState } from "react"
import { Check, Plus, Search, X } from "lucide-react"
import { QuantityDots } from "@/components/ui/quantity-dots"
import { WishlistButton } from "@/components/ui/wishlist-button"
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

export interface RecipeMaterial {
  name: string
  quantity: number
}

export interface RecipeItem {
  id: string
  name: string
  category: string
  materials: RecipeMaterial[]
  obtainMethod: string
}

interface CraftingGridProps {
  recipes: RecipeItem[]
  locale: Locale
  selectedIds?: Map<string, number>
  onToggleRecipe?: (id: string) => void
}

export function CraftingGrid({
  recipes,
  locale,
  selectedIds,
  onToggleRecipe,
}: CraftingGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")
  const [justClickedId, setJustClickedId] = useState<string | null>(null)

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
                        itemId={`recipe:${recipe.id}`}
                        className="absolute right-4 top-4 z-20"
                      />

                      {onToggleRecipe && (
                        <button
                          onClick={() => {
                            onToggleRecipe(recipe.id)
                            setJustClickedId(recipe.id)
                          }}
                          onPointerLeave={() => {
                            if (justClickedId === recipe.id) {
                              setJustClickedId(null)
                            }
                          }}
                          className={`group/btn absolute right-5 bottom-5 z-20 flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset shadow-lg transition-all ${selectedIds?.has(recipe.id)
                            ? justClickedId === recipe.id
                              ? "bg-primary text-primary-foreground ring-primary" // keep primary state if finger/mouse hasn't left
                              : "bg-primary text-primary-foreground ring-primary hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive"
                            : "bg-primary/10 text-primary ring-primary/20 hover:bg-primary hover:text-primary-foreground hover:ring-primary"
                            }`}
                          aria-label={
                            selectedIds?.has(recipe.id)
                              ? tr.crafting.removeRecipe || "Remove recipe"
                              : tr.crafting.addRecipe
                          }
                        >
                          {selectedIds?.has(recipe.id) ? (
                            <>
                              <Check
                                className={`h-5 w-5 transition-transform ${justClickedId === recipe.id
                                  ? "" // keep showing check if just clicked
                                  : "group-hover/btn:hidden"
                                  }`}
                              />
                              <X
                                className={`h-5 w-5 transition-transform ${justClickedId === recipe.id
                                  ? "hidden" // keep hiding X if just clicked
                                  : "hidden group-hover/btn:block group-hover/btn:scale-110"
                                  }`}
                              />
                            </>
                          ) : (
                            <Plus className="h-5 w-5 transition-transform group-hover/btn:rotate-90" />
                          )}
                        </button>
                      )}

                      <div className="relative flex flex-1 flex-col z-10">
                        <h4 className="pr-10 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {recipe.name}
                        </h4>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {recipe.materials.map((m) => (
                            <span
                              key={m.name}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10 transition-colors group-hover:bg-primary/15"
                            >
                              {m.name}
                              <QuantityDots count={m.quantity} className="ml-1" />
                            </span>
                          ))}
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
          {tr.crafting.noResults}
        </p>
      )}
    </>
  )
}
