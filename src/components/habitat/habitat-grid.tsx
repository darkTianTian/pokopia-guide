"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

interface HabitatItem {
  id: number
  slug: string
  name: string
  image: string
  materials: string | null
  pokemon: {
    rarity: string
    pokemon: { id: number; name: string; image: string }
  }[]
  localePath: string
}

interface HabitatGridProps {
  habitats: HabitatItem[]
  locale: Locale
}

export function HabitatGrid({ habitats, locale }: HabitatGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return habitats
    const q = query.toLowerCase()
    return habitats.filter((h) => {
      const matchName = h.name.toLowerCase().includes(q)
      const matchId = String(h.id).includes(q) || String(h.id).padStart(3, "0").includes(q)
      const matchMaterials = h.materials?.toLowerCase().includes(q)
      return matchName || matchId || matchMaterials
    })
  }, [habitats, query])

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.habitat.searchHabitat}
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
            {tr.habitat.showingHabitats.replace("{{count}}", String(filtered.length))}
          </p>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((habitat) => {
            const sampleRarity = habitat.pokemon[0]?.rarity || "common"
            const ringColor =
              sampleRarity === "very-rare"
                ? "ring-purple-500/50 group-hover:ring-purple-500"
                : sampleRarity === "rare"
                  ? "ring-blue-500/50 group-hover:ring-blue-500"
                  : "ring-emerald-500/50 group-hover:ring-emerald-500"

            return (
              <Link
                key={habitat.id}
                href={habitat.localePath}
                className="group flex h-full flex-col outline-none"
              >
                <article className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5`}>
                  <span className="absolute top-6 right-6 z-20 flex px-4 py-1 items-center justify-center rounded-full bg-muted/60 font-mono text-sm font-bold tracking-widest text-muted-foreground backdrop-blur-md ring-1 ring-border/50">
                    #{String(habitat.id).padStart(3, "0")}
                  </span>

                  <div className="absolute left-1/2 top-28 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-60 dark:opacity-20 dark:group-hover:opacity-50">
                    <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="relative mb-6 mt-2 flex h-[160px] items-center justify-center">
                      <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110">
                        <SafeImage
                          src={habitat.image}
                          alt={habitat.name}
                          width={160}
                          height={160}
                          className="rounded-2xl object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="mb-4 text-center z-10">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {habitat.name}
                      </h2>
                      {habitat.materials && (
                        <p className="mt-1 text-sm font-medium text-muted-foreground/80">
                          {habitat.materials}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50 z-10">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex -space-x-3">
                          {habitat.pokemon.slice(0, 5).map(({ pokemon }) => (
                            <div key={pokemon.id} className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-background drop-shadow-sm transition-transform hover:scale-110 hover:z-20 border border-border/20">
                              <SafeImage
                                src={pokemon.image}
                                alt={pokemon.name}
                                fill
                                className="bg-background object-contain p-1"
                              />
                            </div>
                          ))}
                        </div>
                        {habitat.pokemon.length > 5 && (
                          <span className="flex h-10 items-center justify-center rounded-full bg-background px-3 text-xs font-semibold text-muted-foreground ring-2 ring-border/50">
                            +{habitat.pokemon.length - 5}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {tr.habitat.pokemonCount.replace("{{count}}", String(habitat.pokemon.length))}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tr.habitat.noHabitatResults}
        </p>
      )}
    </>
  )
}
