"use client"

import { useCallback, useEffect, useState } from "react"
import { CraftingGrid, type RecipeItem } from "./crafting-grid"
import { CraftingCalculator } from "./crafting-calculator"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"
import koTranslations from "@/i18n/ko.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
  ko: koTranslations,
}

const STORAGE_KEY = "pokopia-crafting-calc"

interface StoredRecipe {
  id: string
  quantity: number
}

function loadFromStorage(): Map<string, number> {
  if (typeof window === "undefined") return new Map()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const parsed: StoredRecipe[] = JSON.parse(raw)
    return new Map(parsed.map((r) => [r.id, r.quantity]))
  } catch {
    return new Map()
  }
}

function saveToStorage(selected: Map<string, number>) {
  const data: StoredRecipe[] = Array.from(selected.entries()).map(
    ([id, quantity]) => ({ id, quantity })
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

interface CraftingTabsProps {
  recipes: RecipeItem[]
  locale: Locale
}

type Tab = "list" | "calculator"

export function CraftingTabs({ recipes, locale }: CraftingTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("list")
  const [selected, setSelected] = useState<Map<string, number>>(new Map())
  const [mounted, setMounted] = useState(false)
  const tr = TRANSLATIONS_BY_LOCALE[locale]

  useEffect(() => {
    setMounted(true)
    const stored = loadFromStorage()
    if (stored.size > 0) {
      setSelected(stored)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      saveToStorage(selected)
    }
  }, [selected, mounted])

  const toggleRecipe = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, 1)
      }
      return next
    })
  }, [])

  const removeRecipe = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setSelected((prev) => {
      const current = prev.get(id) ?? 1
      const newQty = Math.max(1, current + delta)
      if (newQty === current) return prev
      const next = new Map(prev)
      next.set(id, newQty)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setSelected(new Map())
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: "list", label: tr.crafting.recipeList },
    { key: "calculator", label: tr.crafting.calculator },
  ]

  return (
    <>
      <div className="mb-8 flex gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeTab === tab.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            {tab.label}
            {tab.key === "calculator" && mounted && selected.size > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-amber-950 shadow-sm ring-2 ring-background">
                {selected.size}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id={`${activeTab}-panel`} role="tabpanel">
        {activeTab === "list" ? (
          <CraftingGrid
            recipes={recipes}
            locale={locale}
            selectedIds={selected}
            onToggleRecipe={toggleRecipe}
          />
        ) : (
          <CraftingCalculator
            recipes={recipes}
            locale={locale}
            selected={selected}
            onRemove={removeRecipe}
            onUpdateQuantity={updateQuantity}
            onClearAll={clearAll}
          />
        )}
      </div>
    </>
  )
}
