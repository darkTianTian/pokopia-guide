import Link from "next/link"
import Image from "next/image"
import { SafeImage } from "@/components/ui/safe-image"
import { TypeBadge } from "./type-badge"
import type { Pokemon } from "@/lib/types"
import { getLocalePath, type Locale } from "@/i18n/config"
import { HabitatLink } from "@/components/habitat/habitat-link"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

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

  // If no className is provided, use the default border styles
  const computedClassName = className
    ? className
    : "border border-border/40 hover:border-border/80"

  return (
    <Link href={getLocalePath(locale, `/pokedex/${pokemon.slug}`)} className="group block h-full outline-none">
      <article className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-background/40 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5 ${computedClassName}`}>


        {/* Glowing Background Blob */}
        <div className="absolute left-1/2 top-28 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[50px] transition-all duration-500 group-hover:scale-125 group-hover:opacity-70 dark:opacity-30 dark:group-hover:opacity-50">
          <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
        </div>

        <div className="flex flex-1 flex-col p-5">
          {/* Header: Name and ID */}
          <div className="mb-4 flex items-center justify-between">
            {headingLevel === "h3" ? (
              <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {pokemon.name}
              </h3>
            ) : (
              <h2 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {pokemon.name}
              </h2>
            )}
            <span className="flex h-7 items-center justify-center rounded-full bg-muted/50 px-3 font-mono text-xs font-semibold tracking-wider text-muted-foreground backdrop-blur-md">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
          </div>

          {/* Image */}
          <div className="relative mb-6 flex h-[140px] items-center justify-center">
            <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110">
              <SafeImage
                src={pokemon.image}
                alt={pokemon.name}
                width={140}
                height={140}
                className="object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
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
                      return (
                        <HabitatLink
                          key={h.id}
                          href={getLocalePath(locale, "/habitat")}
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
