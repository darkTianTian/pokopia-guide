"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { getLocalePath, type Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"
import koTranslations from "@/i18n/ko.json"
import zhHansTranslations from "@/i18n/zh-Hans.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  "zh-Hans": zhHansTranslations,
  ja: jaTranslations,
  ko: koTranslations,
}

const GRADIENTS = [
  "from-emerald-400 to-cyan-400",
  "from-pink-400 to-rose-400",
  "from-violet-400 to-fuchsia-400",
  "from-amber-400 to-orange-400",
  "from-blue-400 to-indigo-400",
  "from-lime-400 to-emerald-400",
]

interface MaterialHabitat {
  habitatId: number
  habitatName: string
  habitatImage: string
}

interface MaterialItem {
  slug: string
  name: string
  sources: string[]
  screenshots: string[]
  totalUsage: number
  habitats: MaterialHabitat[]
}

interface MaterialsGridProps {
  materials: MaterialItem[]
  locale: Locale
}

export function MaterialsGrid({ materials, locale }: MaterialsGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return materials
    const q = query.toLowerCase()
    return materials.filter((m) => m.name.toLowerCase().includes(q))
  }, [materials, query])

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.habitat.searchMaterial}
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
            {tr.habitat.showingMaterials.replace("{{count}}", String(filtered.length))}
          </p>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((material, index) => {
            const gradientClass = GRADIENTS[index % GRADIENTS.length]
            const displayedHabitats = material.habitats.slice(0, 5)
            const extraCount = material.habitats.length - 5

            return (
              <article
                key={material.slug}
                role="link"
                tabIndex={0}
                onClick={() => {
                  window.location.href = getLocalePath(locale, `/habitat/materials/${material.slug}`)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = getLocalePath(locale, `/habitat/materials/${material.slug}`)
                  }
                }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-border/80 hover:bg-background/60 hover:shadow-xl"
              >
                  <WishlistButton
                    itemId={`material:${material.slug}`}
                    className="absolute right-4 top-4 z-20"
                  />
                  <div className="absolute left-1/2 top-0 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-60 dark:opacity-20 dark:group-hover:opacity-40">
                    <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
                  </div>

                  <div className="flex flex-1 flex-col items-center text-center">
                    <SafeImage
                      src={`/images/items/${material.slug}.png`}
                      alt={material.name}
                      width={64}
                      height={64}
                      className="z-10 rounded-xl drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                    />
                    <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary z-10">
                      {material.name}
                    </h3>

                    {material.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5 z-10">
                        {material.sources.map((source) => (
                          <span
                            key={source}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex w-full flex-col items-center gap-4 rounded-[1.5rem] bg-muted/40 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/60 mt-6 z-10">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-primary drop-shadow-sm">
                            {material.totalUsage}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                            {tr.habitat.materialUsedInLabel}
                          </span>
                        </div>
                      </div>

                      {displayedHabitats.length > 0 && (
                        <div className="flex -space-x-3 mt-1 scale-110">
                          {displayedHabitats.map((h, i) => (
                            <div
                              key={`${h.habitatId}-${i}`}
                              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background shadow-sm ring-1 ring-border/50 transition-transform duration-300 hover:z-20 hover:-translate-y-1 hover:scale-110"
                              style={{ zIndex: 10 - i }}
                              title={h.habitatName}
                            >
                              <SafeImage
                                src={h.habitatImage}
                                alt={h.habitatName}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div
                              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-secondary text-[11px] font-bold text-secondary-foreground shadow-sm ring-1 ring-border/50 z-0"
                              title={`+${extraCount} more`}
                            >
                              +{extraCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tr.habitat.noMaterialResults}
        </p>
      )}
    </>
  )
}
