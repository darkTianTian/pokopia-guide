import Link from "next/link"
import Image from "next/image"
import { SafeImage } from "@/components/ui/safe-image"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { CollectionButton } from "@/components/ui/collection-button"
import { TypeBadge } from "./type-badge"
import { MapPin, Sparkles, Trophy } from "lucide-react"
import type { Pokemon } from "@/lib/types"
import { getLocalePath, type Locale } from "@/i18n/config"
import { HabitatLink } from "@/components/habitat/habitat-link"
import { toHabitatSlug } from "@/lib/habitat-slug"
import _pokemonAreaRestrictions from "@/../content/pokemon-area-restrictions.json"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

type AreaRestriction = { habitatId: number; area: string; areaJa: string; areaZh: string }
const pokemonAreaRestrictions = _pokemonAreaRestrictions as Record<string, AreaRestriction[]>

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const TYPE_GRADIENTS: Record<string, string> = {
  normal: "from-gray-400 to-gray-200",
  fire: "from-orange-500 to-red-400",
  water: "from-blue-500 to-cyan-300",
  electric: "from-yellow-400 to-amber-300",
  grass: "from-green-500 to-emerald-300",
  ice: "from-cyan-300 to-blue-200",
  fighting: "from-red-600 to-orange-500",
  poison: "from-purple-500 to-fuchsia-400",
  ground: "from-amber-600 to-yellow-500",
  flying: "from-indigo-400 to-blue-300",
  psychic: "from-pink-500 to-rose-400",
  bug: "from-lime-500 to-green-400",
  rock: "from-stone-500 to-amber-700",
  ghost: "from-violet-600 to-purple-500",
  dragon: "from-indigo-600 to-blue-500",
  dark: "from-slate-700 to-neutral-600",
  steel: "from-slate-400 to-zinc-400",
  fairy: "from-pink-400 to-rose-300",
}

interface PokemonCardProps {
  pokemon: Pokemon
  locale: Locale
  compact?: boolean
  className?: string
  headingLevel?: "h2" | "h3"
}

export function PokemonCard({ pokemon, locale, compact, className, headingLevel = "h2" }: PokemonCardProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const pokopia = pokemon.pokopia

  const hasSpecialties = pokopia && pokopia.specialties.length > 0
  const hasTime = pokopia?.timeOfDay && pokopia.timeOfDay.length > 0
  const hasWeather = pokopia?.weather && pokopia.weather.length > 0
  const hasHabitats = pokopia?.habitats && pokopia.habitats.length > 0

  const primaryType = pokemon.types[0] || "normal"
  const gradientClass = TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.normal

  const isLegendary = pokopia?.category === "legendary"
  const isMythical = pokopia?.category === "mythical"
  const isEvent = pokopia?.category === "event"
  const isSpecial = isLegendary || isMythical

  // If no className is provided, use the default border styles
  const computedClassName = isSpecial
    ? "golden-card-base"
    : className ?? "border border-border/40 hover:border-border/80"

  const blobClassName = isMythical
    ? "bg-pink-500/20 dark:bg-pink-500/10"
    : isLegendary
      ? "bg-amber-400/20 group-hover:bg-amber-400/30"
      : "opacity-40 group-hover:opacity-70 dark:opacity-30 dark:group-hover:opacity-50"

  return (
    <Link href={getLocalePath(locale, `/pokedex/${pokemon.slug}`)} className="group block h-full outline-none">
      <article className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-background/40 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5 ${computedClassName}`}>
        {isSpecial && (
          <>
            <div className={`premium-metallic-border ${isLegendary ? 'legendary-metallic-gradient' : 'mythical-metallic-gradient'}`} />
            <div className="shimmer-layer" />
            <div className="sparkle" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
            <div className="sparkle" style={{ top: '65%', left: '85%', animationDelay: '0.5s' }} />
            <div className="sparkle" style={{ top: '40%', left: '15%', animationDelay: '1.2s' }} />
            <div className="sparkle" style={{ top: '80%', left: '30%', animationDelay: '0.8s' }} />
          </>
        )}
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 ${isSpecial ? "badge-float" : ""}`}>
          <span className="flex px-4 py-1 items-center justify-center rounded-full bg-muted/60 font-mono text-xs font-bold tracking-widest text-muted-foreground backdrop-blur-md ring-1 ring-border/50 shadow-sm">
            {isEvent && pokopia?.eventDexNumber != null
              ? `E-${String(pokopia.eventDexNumber).padStart(3, "0")}`
              : `#${String(pokemon.id).padStart(3, "0")}`}
          </span>
          {isSpecial && (
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full shadow-lg backdrop-blur-md ring-2 ring-inset transition-all duration-300 ${isMythical
                ? "bg-pink-500 text-white ring-pink-400/50 shadow-pink-500/20"
                : "bg-amber-400 text-white ring-amber-300/50 shadow-amber-500/20"
                }`}
              aria-label={isMythical ? tr.pokedex.mythical : tr.pokedex.legendary}
              title={isMythical ? tr.pokedex.mythical : tr.pokedex.legendary}
            >
              {isMythical ? <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> : <Trophy className="h-3.5 w-3.5" aria-hidden="true" />}
            </div>
          )}
        </div>
        <CollectionButton
          itemId={pokemon.slug}
          className="absolute right-4 top-4 z-20"
        />

        {/* Glowing Background Blob */}
        <div className={`absolute left-1/2 top-28 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] transition-all duration-700 ease-in-out group-hover:scale-150 ${blobClassName}`}>
          {!isSpecial && <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />}
        </div>

        <div className={`flex flex-1 flex-col p-5 ${isSpecial ? "pt-20" : "pt-12"}`}>
          {/* Header: Name */}
          <div className="mb-4 text-center">
            {headingLevel === "h3" ? (
              <h3 className="truncate text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {pokemon.name}
              </h3>
            ) : (
              <h2 className="truncate text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {pokemon.name}
              </h2>
            )}
          </div>

          {/* Image */}
          <div className="relative mb-6 flex h-[140px] items-center justify-center">
            <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110">
              <SafeImage
                src={pokemon.image}
                alt={pokemon.name}
                width={140}
                height={140}
                className="pokemon-sprite-target object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>

          {/* Types & Specialties */}
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {pokemon.types.map((type) => (
                <TypeBadge key={type} type={type} locale={locale} />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {hasSpecialties ? (
                pokopia.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md transition-colors group-hover:border-border/80"
                  >
                    <SafeImage
                      src={`/images/specialties/${s.replace(/ /g, "-")}.png`}
                      alt={(tr.specialties as Record<string, string>)[s] ?? s}
                      width={16}
                      height={16}
                      className="shrink-0 drop-shadow-sm"
                    />
                    {(tr.specialties as Record<string, string>)[s] ?? s}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                  <Image
                    src="/images/unknown.svg"
                    alt="?"
                    width={16}
                    height={16}
                    className="shrink-0 opacity-60"
                  />
                  {tr.pokedex.specialty}
                </span>
              )}
            </div>
          </div>

          {!compact && (
            <div className="mt-auto flex flex-col gap-2 rounded-2xl bg-muted/30 p-3 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50">
              {/* Time of Day */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {tr.pokedex.timeOfDay}
                </span>
                <div className="flex gap-1 rounded-full bg-background/50 p-1 shadow-sm ring-1 ring-border/50">
                  {hasTime ? (
                    pokopia.timeOfDay!.map((tod) => (
                      <SafeImage
                        key={tod}
                        src={`/images/time/${tod}.svg`}
                        alt={(tr.timeOfDay as Record<string, string>)[tod] ?? tod}
                        title={(tr.timeOfDay as Record<string, string>)[tod] ?? tod}
                        width={18}
                        height={18}
                        className="transition-transform hover:scale-110"
                      />
                    ))
                  ) : (
                    <Image src="/images/unknown.svg" alt="?" width={18} height={18} className="opacity-40" />
                  )}
                </div>
              </div>

              {/* Weather */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {tr.pokedex.weatherLabel}
                </span>
                <div className="flex gap-1 rounded-full bg-background/50 p-1 shadow-sm ring-1 ring-border/50">
                  {hasWeather ? (
                    pokopia.weather!.map((w) => (
                      <SafeImage
                        key={w}
                        src={`/images/weather/${w}.svg`}
                        alt={(tr.weather as Record<string, string>)[w] ?? w}
                        title={(tr.weather as Record<string, string>)[w] ?? w}
                        width={18}
                        height={18}
                        className="transition-transform hover:scale-110"
                      />
                    ))
                  ) : (
                    <Image src="/images/unknown.svg" alt="?" width={18} height={18} className="opacity-40" />
                  )}
                </div>
              </div>

              {/* Habitats */}
              <div className="mt-1 flex flex-col gap-2 border-t border-border/50 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {tr.pokedex.habitatLabel}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {hasHabitats ? (
                    pokopia.habitats!.map((h) => {
                      const ringColor =
                        h.rarity === "very-rare"
                          ? "ring-purple-500/50"
                          : h.rarity === "rare"
                            ? "ring-blue-500/50"
                            : "ring-emerald-500/50"
                      const areaRestriction = (pokemonAreaRestrictions[pokemon.slug] ?? []).find(
                        (r) => r.habitatId === h.id
                      )
                      const areaLabel = areaRestriction
                        ? locale === "ja" ? areaRestriction.areaJa : locale === "zh" ? areaRestriction.areaZh : areaRestriction.area
                        : null
                      return (
                        <HabitatLink
                          key={h.id}
                          href={getLocalePath(locale, `/habitat/${toHabitatSlug(h.id)}`)}
                          className="group/habitat relative flex shrink-0 w-[4.5rem] flex-col items-center gap-1 rounded-2xl bg-background/60 p-1.5 shadow-sm ring-1 ring-inset ring-border/50 transition-all hover:bg-background hover:ring-2 hover:ring-primary/50"
                        >
                          <div className={`overflow-hidden rounded-xl ring-2 ${ringColor}`}>
                            <SafeImage
                              src={`/images/habitats/habitat_${h.id}.png`}
                              alt={h.name}
                              width={48}
                              height={48}
                              className="w-full h-auto transition-transform duration-300 group-hover/habitat:scale-110"
                            />
                          </div>
                          <span className="w-full text-center text-xs leading-tight font-medium text-muted-foreground group-hover/habitat:text-foreground line-clamp-2">
                            {h.name}
                          </span>
                          {areaLabel && (
                            <span className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400">
                              <MapPin className="h-2 w-2 shrink-0" />
                              {areaLabel}
                            </span>
                          )}
                        </HabitatLink>
                      )
                    })
                  ) : (
                    <div className="flex gap-2">
                      <div className="rounded-xl bg-background/60 p-1.5 ring-1 ring-border/50">
                        <Image src="/images/unknown-habitat.svg" alt="?" width={48} height={48} className="rounded-lg opacity-40" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
