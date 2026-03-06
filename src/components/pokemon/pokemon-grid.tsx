"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { PokemonCard } from "./pokemon-card"
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

interface PokemonGridProps {
  pokemon: Pokemon[]
  locale: Locale
}

export function PokemonGrid({
  pokemon,
  locale,
}: PokemonGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return pokemon
    const q = query.toLowerCase()
    return pokemon.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q)
      const matchId = String(p.id).includes(q) || String(p.id).padStart(3, "0").includes(q)
      return matchName || matchId
    })
  }, [pokemon, query])

  return (
    <>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.pokedex.searchPlaceholder}
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
          <p className="mt-2 text-xs text-muted-foreground">
            {tr.pokedex.showingCount.replace("{{count}}", String(filtered.length))}
          </p>
        )}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PokemonCard key={p.slug} pokemon={p} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tr.pokedex.noResults}
        </p>
      )}
    </>
  )
}
