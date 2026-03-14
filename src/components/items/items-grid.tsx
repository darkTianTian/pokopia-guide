"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import type { Locale } from "@/i18n/config"
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

const CATEGORY_GLOWS: Record<string, string> = {
  furniture:
    "bg-orange-400/20 group-hover:bg-orange-400/30 dark:bg-orange-500/10 dark:group-hover:bg-orange-500/20",
  goods:
    "bg-yellow-400/20 group-hover:bg-yellow-400/30 dark:bg-yellow-500/10 dark:group-hover:bg-yellow-500/20",
  nature:
    "bg-green-400/20 group-hover:bg-green-400/30 dark:bg-green-500/10 dark:group-hover:bg-green-500/20",
  food: "bg-red-400/20 group-hover:bg-red-400/30 dark:bg-red-500/10 dark:group-hover:bg-red-500/20",
  building:
    "bg-blue-400/20 group-hover:bg-blue-400/30 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20",
  utility:
    "bg-cyan-400/20 group-hover:bg-cyan-400/30 dark:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20",
  block:
    "bg-stone-400/20 group-hover:bg-stone-400/30 dark:bg-stone-500/10 dark:group-hover:bg-stone-500/20",
  outdoor:
    "bg-emerald-400/20 group-hover:bg-emerald-400/30 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20",
  material:
    "bg-amber-400/20 group-hover:bg-amber-400/30 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20",
  kit: "bg-indigo-400/20 group-hover:bg-indigo-400/30 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20",
  "key-item":
    "bg-purple-400/20 group-hover:bg-purple-400/30 dark:bg-purple-500/10 dark:group-hover:bg-purple-500/20",
  other:
    "bg-gray-400/20 group-hover:bg-gray-400/30 dark:bg-gray-500/10 dark:group-hover:bg-gray-500/20",
  uncollectable:
    "bg-fuchsia-400/20 group-hover:bg-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:group-hover:bg-fuchsia-500/20",
}

const CATEGORY_PILL_COLORS: Record<string, string> = {
  furniture: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  goods: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  nature: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  food: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  building: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  utility: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  block: "bg-stone-100 text-stone-700 dark:bg-stone-800/30 dark:text-stone-300",
  outdoor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  material: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  kit: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "key-item": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
  uncollectable: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
}

export interface ItemMaterialData {
  id: string
  name: string
  count: number
  imageUrl: string
}

export interface ItemCardData {
  id: string
  name: string
  categoryKey: string
  imageUrl: string
  description: string
  obtain: string[]
  recipe: string[]
  materials: ItemMaterialData[]
}

interface ItemsGridProps {
  items: ItemCardData[]
  categories: { key: string; count: number }[]
  locale: Locale
}

const BATCH_SIZE = 60

export function ItemsGrid({ items, categories, locale }: ItemsGridProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.categoryKey !== selectedCategory) return false
      if (query) {
        const q = query.toLowerCase()
        if (!item.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, query, selectedCategory])

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  const hasMore = visibleCount < filtered.length

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [query, selectedCategory])

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

  const hasFilters = query || selectedCategory

  return (
    <>
      {/* Category filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            !selectedCategory
              ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
              : "border border-border/50 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground"
          }`}
        >
          {tr.items.allCategories}
        </button>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key
          const label =
            (tr.itemCategories as Record<string, string>)[cat.key] ?? cat.key
          return (
            <button
              key={cat.key}
              onClick={() =>
                setSelectedCategory(isActive ? null : cat.key)
              }
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                  : "border border-border/50 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">{cat.count}</span>
            </button>
          )
        })}
      </div>

      {/* Search bar */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.items.searchPlaceholder}
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
          <p className="text-xs text-muted-foreground">
            {tr.items.showingCount.replace(
              "{{count}}",
              String(filtered.length)
            )}
          </p>
        )}
      </div>

      {/* Item grid */}
      {visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const categoryLabel =
                (tr.itemCategories as Record<string, string>)[
                  item.categoryKey
                ] ?? item.categoryKey
              const hasDetails =
                item.description ||
                item.obtain.length > 0 ||
                item.recipe.length > 0 ||
                item.materials.length > 0
              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/50 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl"
                >
                  <div
                    className={`absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${
                      CATEGORY_GLOWS[item.categoryKey] || "bg-primary/20"
                    }`}
                  />

                  {/* Header: icon + name + category */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0 transition-transform duration-500 group-hover:scale-110">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-xl drop-shadow-md"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                        {item.name}
                      </h3>
                      <span
                        className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          CATEGORY_PILL_COLORS[item.categoryKey] ||
                          "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300"
                        }`}
                      >
                        {categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {hasDetails && (
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      {/* Description */}
                      {item.description && (
                        <p className="line-clamp-2">{item.description}</p>
                      )}

                      {/* Materials */}
                      {item.materials.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 rounded-[1.25rem] bg-black/5 p-3 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:ring-white/10">
                          {item.materials.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-background/80 py-0.5 pl-1 pr-2.5 text-xs font-medium shadow-sm dark:bg-background/40"
                            >
                              <SafeImage
                                src={m.imageUrl}
                                alt={m.name}
                                width={20}
                                height={20}
                                className="rounded-sm"
                              />
                              {m.name}
                              <span className="text-muted-foreground/60">
                                x{m.count}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Obtain method */}
                      {item.obtain.length > 0 && (
                        <div className="space-y-0.5">
                          {item.obtain.map((o, i) => (
                            <p key={i} className="line-clamp-1">
                              {o}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Recipe/unlock */}
                      {item.recipe.length > 0 && item.obtain.length === 0 && (
                        <div className="space-y-0.5">
                          {item.recipe.map((r, i) => (
                            <p key={i} className="line-clamp-1">
                              {r}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
          {hasMore && <div ref={loaderRef} className="h-10" />}
        </>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tr.items.noResults}
        </p>
      )}
    </>
  )
}
