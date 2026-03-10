"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { QuantityDots } from "@/components/ui/quantity-dots"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { getLocalePath } from "@/i18n/config"
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
  materialsEn: string | null
  pokemon: {
    rarity: string
    pokemon: { id: number; slug: string; name: string; image: string }
  }[]
}

interface HabitatGridProps {
  habitats: HabitatItem[]
  locale: Locale
}

function parseMaterials(materials: string): { name: string; quantity: number }[] {
  return materials.split(/,\s*/).filter(Boolean).map((part) => {
    const match = part.match(/^(.+?)\s*x(\d+)$/)
    if (match) {
      return { name: match[1].trimEnd(), quantity: parseInt(match[2], 10) }
    }
    return { name: part, quantity: 1 }
  })
}

function toItemSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function getMaterialSlugs(materialsEn: string | null): string[] {
  if (!materialsEn) return []
  return parseMaterials(materialsEn).map((m) => toItemSlug(m.name))
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
              <article
                key={habitat.id}
                role="link"
                tabIndex={0}
                onClick={() => {
                  window.location.href = getLocalePath(locale, `/habitat/${habitat.slug}`)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = getLocalePath(locale, `/habitat/${habitat.slug}`)
                  }
                }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-border/80 hover:bg-background/60 hover:shadow-xl"
              >
                <span className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex px-4 py-1 items-center justify-center rounded-full bg-muted/60 font-mono text-sm font-bold tracking-widest text-muted-foreground backdrop-blur-md ring-1 ring-border/50">
                  #{String(habitat.id).padStart(3, "0")}
                </span>
                <WishlistButton
                  itemId={`habitat:${habitat.id}`}
                  className="absolute right-4 top-4 z-20"
                />

                <div className="absolute left-1/2 top-28 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-60 dark:opacity-20 dark:group-hover:opacity-50">
                  <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="relative mb-6 mt-6 flex h-[160px] items-center justify-center">
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
                    <h3 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {habitat.name}
                    </h3>
                    {habitat.materials && (() => {
                      const mats = parseMaterials(habitat.materials)
                      const slugs = getMaterialSlugs(habitat.materialsEn)
                      return (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          {mats.map((mat, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10"
                            >
                              {slugs[i] && (
                                <SafeImage
                                  src={`/images/items/${slugs[i]}.png`}
                                  alt={mat.name}
                                  width={20}
                                  height={20}
                                  className="inline-block shrink-0"
                                />
                              )}
                              {mat.name}
                              <QuantityDots count={mat.quantity} className="ml-1" />
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50 z-10">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {habitat.pokemon.map(({ pokemon }) => (
                        <Link
                          key={pokemon.id}
                          href={getLocalePath(locale, `/pokedex/${pokemon.slug}`)}
                          className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-background drop-shadow-sm transition-transform hover:scale-125 hover:z-20 border border-border/20"
                          title={pokemon.name}
                        >
                          <SafeImage
                            src={pokemon.image}
                            alt={pokemon.name}
                            fill
                            className="bg-background object-contain p-1"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
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
