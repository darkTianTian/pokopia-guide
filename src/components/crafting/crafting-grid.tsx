"use client"

import { useMemo, useState } from "react"
import { Check, Plus, Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
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

const CATEGORY_GLOWS: Record<string, string> = {
  furniture: "bg-orange-400/20 group-hover:bg-orange-400/30 dark:bg-orange-500/10 dark:group-hover:bg-orange-500/20",
  decor: "bg-yellow-400/20 group-hover:bg-yellow-400/30 dark:bg-yellow-500/10 dark:group-hover:bg-yellow-500/20",
  outdoor: "bg-green-400/20 group-hover:bg-green-400/30 dark:bg-green-500/10 dark:group-hover:bg-green-500/20",
  "cooking-tool": "bg-red-400/20 group-hover:bg-red-400/30 dark:bg-red-500/10 dark:group-hover:bg-red-500/20",
  building: "bg-blue-400/20 group-hover:bg-blue-400/30 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20",
  blocks: "bg-stone-400/20 group-hover:bg-stone-400/30 dark:bg-stone-500/10 dark:group-hover:bg-stone-500/20",
  lighting: "bg-amber-400/20 group-hover:bg-amber-400/30 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20",
  transport: "bg-indigo-400/20 group-hover:bg-indigo-400/30 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20",
  special: "bg-fuchsia-400/20 group-hover:bg-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:group-hover:bg-fuchsia-500/20",
}

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
                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/50 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl"
                    >
                      {/* Decorative Background Blob mapped to category */}
                      <div className={`absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${CATEGORY_GLOWS[recipe.category] || "bg-primary/20"}`} />

                      <WishlistButton
                        itemId={`recipe:${recipe.id}`}
                        className="absolute right-4 top-4 z-20"
                      />

                      <div className="relative flex flex-1 flex-col z-10">
                        <div className="flex items-start gap-4 pr-10">
                          <div className="relative shrink-0 transition-transform duration-500 group-hover:scale-105">
                            <SafeImage
                              src={`/images/crafting/${recipe.id}.png`}
                              alt={recipe.name}
                              width={72}
                              height={72}
                              className="rounded-xl drop-shadow-md"
                            />
                          </div>
                          <h4 className="text-xl font-extrabold tracking-tight text-foreground line-clamp-2 pt-1 transition-colors group-hover:text-primary">
                            {recipe.name}
                          </h4>
                        </div>

                        {/* Ingredients Bento Box Formula */}
                        <div className="mt-6 rounded-[1.25rem] bg-black/5 dark:bg-white/5 pl-4 pr-3 py-3 flex flex-wrap items-center gap-2 ring-1 ring-inset ring-black/5 dark:ring-white/10 flex-1 content-start">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            {recipe.materials.map((m, idx) => (
                              <div key={m.name} className="flex items-center gap-1 z-10">
                                {idx > 0 && <span className="text-muted-foreground/40 text-sm font-black mx-0.5">+</span>}
                                <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-sm font-bold shadow-sm ring-1 ring-inset ring-border/50 backdrop-blur-md text-foreground">
                                  {m.name}
                                  <QuantityDots count={m.quantity} className="ml-1" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Calculator Button repositioned inline to the right of the bento box */}
                          {onToggleRecipe && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleRecipe(recipe.id)
                                setJustClickedId(recipe.id)
                              }}
                              onPointerLeave={() => {
                                if (justClickedId === recipe.id) {
                                  setJustClickedId(null)
                                }
                              }}
                              className={`group/btn ml-auto shrink-0 flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset shadow-md transition-all ${selectedIds?.has(recipe.id)
                                ? justClickedId === recipe.id
                                  ? "bg-primary text-primary-foreground ring-primary"
                                  : "bg-primary text-primary-foreground ring-primary hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive"
                                : "bg-primary/20 text-primary ring-primary/30 hover:bg-primary hover:text-primary-foreground hover:ring-primary backdrop-blur-sm"
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
                                    className={`h-4 w-4 transition-transform ${justClickedId === recipe.id ? "" : "group-hover/btn:hidden"}`}
                                  />
                                  <X
                                    className={`h-4 w-4 transition-transform ${justClickedId === recipe.id ? "hidden" : "hidden group-hover/btn:block group-hover/btn:scale-110"}`}
                                  />
                                </>
                              ) : (
                                <Plus className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
                              )}
                            </button>
                          )}
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
