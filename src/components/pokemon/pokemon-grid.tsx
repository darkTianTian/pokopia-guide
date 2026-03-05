"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { PokemonCard } from "./pokemon-card"
import { Button } from "@/components/ui/button"
import { POKEMON_TYPES, type PokemonType, type Pokemon } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const TYPE_COLORS: Record<PokemonType, string> = {
  normal: "bg-gray-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400 text-black",
  grass: "bg-green-500",
  ice: "bg-cyan-300 text-black",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-300 text-black",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-700",
  ghost: "bg-purple-700",
  dragon: "bg-violet-600",
  dark: "bg-gray-700",
  steel: "bg-gray-400",
  fairy: "bg-pink-300 text-black",
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
  const [selectedTypes, setSelectedTypes] = useState<Set<PokemonType>>(new Set())
  const [selectedSpecs, setSelectedSpecs] = useState<Set<string>>(new Set())
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showSpecFilter, setShowSpecFilter] = useState(false)

  // Collect all specialties from data
  const allSpecialties = useMemo(() => {
    const set = new Set<string>()
    for (const p of pokemon) {
      if (p.pokopia?.specialties) {
        for (const s of p.pokopia.specialties) {
          if ((tr.specialties as Record<string, string>)[s]) set.add(s)
        }
      }
    }
    return [...set].sort()
  }, [pokemon, tr.specialties])

  const filtered = useMemo(() => {
    return pokemon.filter((p) => {
      // Search
      if (query) {
        const q = query.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchId = String(p.id).includes(q) || String(p.id).padStart(3, "0").includes(q)
        if (!matchName && !matchId) return false
      }
      // Type filter
      if (selectedTypes.size > 0) {
        if (!p.types.some((t) => selectedTypes.has(t))) return false
      }
      // Specialty filter
      if (selectedSpecs.size > 0) {
        if (!p.pokopia?.specialties?.some((s) => selectedSpecs.has(s))) return false
      }
      return true
    })
  }, [pokemon, query, selectedTypes, selectedSpecs])

  const hasFilters = query || selectedTypes.size > 0 || selectedSpecs.size > 0

  function toggleType(type: PokemonType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function toggleSpec(spec: string) {
    setSelectedSpecs((prev) => {
      const next = new Set(prev)
      if (next.has(spec)) next.delete(spec)
      else next.add(spec)
      return next
    })
  }

  function clearFilters() {
    setQuery("")
    setSelectedTypes(new Set())
    setSelectedSpecs(new Set())
  }

  return (
    <>
      {/* Search + Filter bar */}
      <div className="mb-6 space-y-3">
        {/* Search input */}
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

        {/* Filter toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showTypeFilter ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowTypeFilter((v) => !v); setShowSpecFilter(false) }}
          >
            {tr.pokedex.filterType}
            {selectedTypes.size > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                {selectedTypes.size}
              </span>
            )}
          </Button>
          <Button
            variant={showSpecFilter ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowSpecFilter((v) => !v); setShowTypeFilter(false) }}
          >
            {tr.pokedex.filterSpecialty}
            {selectedSpecs.size > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                {selectedSpecs.size}
              </span>
            )}
          </Button>
          {hasFilters && (
            <>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {tr.pokedex.clearFilters}
              </Button>
              <span className="text-xs text-muted-foreground">
                {tr.pokedex.showingCount.replace("{{count}}", String(filtered.length))}
              </span>
            </>
          )}
        </div>

        {/* Type filter panel */}
        {showTypeFilter && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border p-3">
            {POKEMON_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white transition-opacity ${TYPE_COLORS[type]} ${
                  selectedTypes.size > 0 && !selectedTypes.has(type) ? "opacity-30" : "opacity-100"
                }`}
              >
                <Image
                  src={`/images/types/${type}.svg`}
                  alt={type}
                  width={14}
                  height={14}
                  className="shrink-0"
                />
                {(tr.types as Record<string, string>)[type]}
              </button>
            ))}
          </div>
        )}

        {/* Specialty filter panel */}
        {showSpecFilter && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border p-3">
            {allSpecialties.map((s) => (
              <button
                key={s}
                onClick={() => toggleSpec(s)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium transition-opacity ${
                  selectedSpecs.size > 0 && !selectedSpecs.has(s) ? "opacity-30" : "opacity-100"
                }`}
              >
                <Image
                  src={`/images/specialties/${s.replace(/ /g, "-")}.png`}
                  alt={(tr.specialties as Record<string, string>)[s] ?? s}
                  width={18}
                  height={18}
                  className="shrink-0"
                />
                {(tr.specialties as Record<string, string>)[s] ?? s}
              </button>
            ))}
          </div>
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
