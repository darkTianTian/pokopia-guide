"use client"

import { useMemo, useState } from "react"
import { Heart, Trash2 } from "lucide-react"
import { useWishlist } from "@/hooks/use-wishlist"
import { PokemonGrid } from "@/components/pokemon/pokemon-grid"
import { CraftingGrid, type RecipeItem } from "@/components/crafting/crafting-grid"
import { HabitatGrid } from "@/components/habitat/habitat-grid"
import { MaterialsGrid } from "@/components/habitat/materials-grid"
import type { Pokemon } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

type TabKey = "pokemon" | "recipes" | "habitats" | "materials"

interface HabitatItem {
  id: number
  slug: string
  name: string
  image: string
  materials: string | null
  pokemon: {
    rarity: string
    pokemon: { id: number; slug: string; name: string; image: string }
  }[]
}

interface MaterialItem {
  slug: string
  name: string
  totalUsage: number
  habitats: {
    habitatId: number
    habitatName: string
    habitatImage: string
  }[]
}

interface WishlistContentProps {
  pokemon: Pokemon[]
  recipes: RecipeItem[]
  habitats: HabitatItem[]
  materials: MaterialItem[]
  locale: Locale
}

export function WishlistContent({
  pokemon,
  recipes,
  habitats,
  materials,
  locale,
}: WishlistContentProps) {
  const { items, clear, mounted } = useWishlist()
  const tr = TRANSLATIONS_BY_LOCALE[locale]

  const filteredPokemon = useMemo(
    () => pokemon.filter((p) => items.has(`pokemon:${p.slug}`)),
    [pokemon, items]
  )

  const filteredRecipes = useMemo(
    () => recipes.filter((r) => items.has(`recipe:${r.id}`)),
    [recipes, items]
  )

  const filteredHabitats = useMemo(
    () => habitats.filter((h) => items.has(`habitat:${h.id}`)),
    [habitats, items]
  )

  const filteredMaterials = useMemo(
    () => materials.filter((m) => items.has(`material:${m.slug}`)),
    [materials, items]
  )

  const tabs = useMemo(() => {
    const all: { key: TabKey; label: string; count: number }[] = [
      { key: "pokemon", label: tr.wishlist.pokemon, count: filteredPokemon.length },
      { key: "recipes", label: tr.wishlist.recipes, count: filteredRecipes.length },
      { key: "habitats", label: tr.wishlist.habitats, count: filteredHabitats.length },
      { key: "materials", label: tr.wishlist.materials, count: filteredMaterials.length },
    ]
    return all.filter((t) => t.count > 0)
  }, [tr, filteredPokemon.length, filteredRecipes.length, filteredHabitats.length, filteredMaterials.length])

  const [activeTab, setActiveTab] = useState<TabKey>("pokemon")

  // If current tab becomes empty (user removed all items), switch to first available
  const resolvedTab = tabs.find((t) => t.key === activeTab) ? activeTab : tabs[0]?.key

  if (!mounted) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const totalCount =
    filteredPokemon.length +
    filteredRecipes.length +
    filteredHabitats.length +
    filteredMaterials.length

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Heart className="h-16 w-16 text-muted-foreground/30" />
        <p className="max-w-md text-lg text-muted-foreground">
          {tr.wishlist.empty}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Total count badge + clear button */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full bg-pink-500/10 px-5 py-2 ring-1 ring-inset ring-pink-500/20">
          <span className="text-sm font-bold uppercase tracking-wider text-pink-500">
            {tr.wishlist.itemCount.replace("{{count}}", String(totalCount))}
          </span>
        </div>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive ring-1 ring-inset ring-destructive/20 transition-colors hover:bg-destructive/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {tr.wishlist.clearAll}
        </button>
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={resolvedTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              resolvedTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-sm ring-2 ring-background ${
              resolvedTab === tab.key
                ? "bg-pink-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" id={`${resolvedTab}-panel`}>
        {resolvedTab === "pokemon" && (
          <PokemonGrid
            pokemon={filteredPokemon}
            locale={locale}
            headingLevel="h3"
          />
        )}

        {resolvedTab === "recipes" && (
          <CraftingGrid recipes={filteredRecipes} locale={locale} />
        )}

        {resolvedTab === "habitats" && (
          <HabitatGrid habitats={filteredHabitats} locale={locale} />
        )}

        {resolvedTab === "materials" && (
          <MaterialsGrid materials={filteredMaterials} locale={locale} />
        )}
      </div>
    </div>
  )
}
