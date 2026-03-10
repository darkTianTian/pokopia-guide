"use client"

import { useMemo } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import type { RecipeItem } from "./crafting-grid"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

interface CraftingCalculatorProps {
  recipes: RecipeItem[]
  locale: Locale
  selected: Map<string, number>
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, delta: number) => void
  onClearAll: () => void
}

export function CraftingCalculator({
  recipes,
  locale,
  selected,
  onRemove,
  onUpdateQuantity,
  onClearAll,
}: CraftingCalculatorProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]

  const materialTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const [recipeId, qty] of selected) {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe) continue
      for (const mat of recipe.materials) {
        totals.set(mat.name, (totals.get(mat.name) ?? 0) + mat.quantity * qty)
      }
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  }, [selected, recipes])

  const selectedEntries = useMemo(
    () =>
      Array.from(selected.entries())
        .map(([id, qty]) => {
          const recipe = recipes.find((r) => r.id === id)
          return recipe ? { recipe, quantity: qty } : null
        })
        .filter(Boolean) as { recipe: RecipeItem; quantity: number }[],
    [selected, recipes]
  )

  return (
    <div className="space-y-8">
      {/* Crafting List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-bold tracking-tight">
            {tr.crafting.craftingList}
            {selectedEntries.length > 0 && (
              <span className="ml-3 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-muted/50 px-2 text-[13px] font-bold text-muted-foreground">
                {selectedEntries.length}
              </span>
            )}
          </h3>
          {selectedEntries.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-destructive transition-colors hover:text-destructive/80"
            >
              {tr.crafting.clearAll}
            </button>
          )}
        </div>

        {selectedEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
            {tr.crafting.emptyCalculator}
          </p>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 backdrop-blur-xl">
            {selectedEntries.map(({ recipe, quantity }, i) => (
              <div
                key={recipe.id}
                className={`flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/20 ${i > 0 ? "border-t border-border/30" : ""
                  }`}
              >
                <span className="text-sm font-semibold">{recipe.name}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(recipe.id, -1)}
                    disabled={quantity === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-[15px] font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(recipe.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(recipe.id)}
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 text-muted-foreground ring-1 ring-inset ring-border/50 transition-colors hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Materials Summary */}
      {materialTotals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">
              {tr.crafting.materialSummary}
            </h3>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              {tr.crafting.materialTypes.replace(
                "{{count}}",
                String(materialTotals.length)
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {materialTotals.map(([name, total]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-[1.25rem] border border-border/40 bg-background/50 px-5 py-4 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-sm font-bold text-foreground/90">{name}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[13px] font-bold tabular-nums text-primary/90 ring-1 ring-inset ring-primary/20 shadow-sm">
                  {tr.crafting.totalQuantity.replace("{{count}}", String(total))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
