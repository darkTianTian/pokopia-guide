"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Check, Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { PokemonCard } from "./pokemon-card"
import { useCollection } from "@/hooks/use-collection"
import type { Pokemon, PokemonType } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const TYPE_BG: Record<PokemonType, string> = {
  normal: "bg-gray-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-700",
  ghost: "bg-purple-700",
  dragon: "bg-violet-600",
  dark: "bg-gray-700",
  steel: "bg-gray-400",
  fairy: "bg-pink-300",
}

interface PokemonGridProps {
  pokemon: Pokemon[]
  locale: Locale
  headingLevel?: "h2" | "h3"
  types?: readonly PokemonType[]
  specialties?: string[]
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }, [])

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors -ml-2 p-2 rounded-lg hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-expanded={isOpen}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

export function PokemonGrid({
  pokemon,
  locale,
  headingLevel,
  types,
  specialties,
}: PokemonGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const { items: collectionItems, mounted: collectionMounted } = useCollection()
  const [query, setQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<Set<PokemonType>>(new Set())
  const [selectedSpecs, setSelectedSpecs] = useState<Set<string>>(new Set())
  const [collectionFilter, setCollectionFilter] = useState<"all" | "caught" | "uncaught">("all")

  const filtered = useMemo(() => {
    return pokemon.filter((p) => {
      if (query) {
        const q = query.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchId = String(p.id).includes(q) || String(p.id).padStart(3, "0").includes(q)
        if (!matchName && !matchId) return false
      }
      if (selectedTypes.size > 0) {
        if (!p.types.some((t) => selectedTypes.has(t))) return false
      }
      if (selectedSpecs.size > 0) {
        if (!p.pokopia?.specialties?.some((s) => selectedSpecs.has(s))) return false
      }
      if (collectionFilter === "caught" && !collectionItems.has(p.slug)) return false
      if (collectionFilter === "uncaught" && collectionItems.has(p.slug)) return false
      return true
    })
  }, [pokemon, query, selectedTypes, selectedSpecs, collectionFilter, collectionItems])

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

  const hasFilters = query || selectedTypes.size > 0 || selectedSpecs.size > 0 || collectionFilter !== "all"

  const BATCH_SIZE = 24
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [query, selectedTypes, selectedSpecs, collectionFilter])

  const visiblePokemon = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length))
  }, [filtered.length])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  function clearFilters() {
    setQuery("")
    setSelectedTypes(new Set())
    setSelectedSpecs(new Set())
    setCollectionFilter("all")
  }

  return (
    <>
      {/* Browse by Type */}
      {types && types.length > 0 && (
        <div className="mb-4 flex flex-col gap-0">
          <CollapsibleSection title={tr.pokedex.browseByType}>
            <div className="flex flex-wrap gap-2 pb-0">
              {types.map((type) => {
                const isActive = selectedTypes.has(type)
                const typeName = tr.types[type] || type
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${isActive
                      ? `${TYPE_BG[type]} text-white shadow-lg ring-2 ring-white/50`
                      : `border border-border/50 bg-background/50 text-foreground hover:bg-background/80 ${selectedTypes.size > 0 ? "opacity-40" : ""}`
                      }`}
                  >
                    <Image
                      src={`/images/types/${type}.png`}
                      alt={typeName}
                      width={18}
                      height={18}
                      className="shrink-0"
                    />
                    {typeName}
                  </button>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* Browse by Specialty */}
          {specialties && specialties.length > 0 && (
            <CollapsibleSection title={tr.pokedex.browseBySpecialty}>
              <div className="flex flex-wrap gap-2 pb-0">
                {specialties.map((spec) => {
                  const isActive = selectedSpecs.has(spec)
                  const specKey = spec as keyof typeof tr.specialties
                  const specName = tr.specialties[specKey] || spec
                  return (
                    <button
                      key={spec}
                      onClick={() => toggleSpec(spec)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${isActive
                        ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                        : `border border-border/50 bg-background/50 text-foreground hover:bg-background/80 ${selectedSpecs.size > 0 ? "opacity-40" : ""}`
                        }`}
                    >
                      <SafeImage
                        src={`/images/specialties/${spec.replace(/ /g, "-")}.png`}
                        alt={specName}
                        width={18}
                        height={18}
                        className="shrink-0"
                      />
                      {specName}
                    </button>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}

      {/* Collection filter */}
      {collectionMounted && collectionItems.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "caught", "uncaught"] as const).map((value) => {
            const isActive = collectionFilter === value
            const label = value === "all"
              ? tr.crafting.allCategories
              : value === "caught"
                ? tr.collection.caught
                : tr.collection.uncaught
            return (
              <button
                key={value}
                onClick={() => setCollectionFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/50"
                    : `border border-border/50 bg-background/50 text-foreground hover:bg-background/80 ${collectionFilter !== "all" ? "opacity-40" : ""}`
                }`}
              >
                {value !== "all" && <Check className="h-3.5 w-3.5" />}
                {label}
              </button>
            )
          })}
        </div>
      )}

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
        {hasFilters && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {tr.pokedex.showingCount.replace("{{count}}", String(filtered.length))}
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/20 hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {tr.pokedex.clearFilters}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {visiblePokemon.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePokemon.map((p) => (
              <PokemonCard key={p.slug} pokemon={p} locale={locale} headingLevel={headingLevel} />
            ))}
          </div>
          {hasMore && <div ref={loaderRef} className="h-10" />}
        </>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tr.pokedex.noResults}
        </p>
      )}
    </>
  )
}
