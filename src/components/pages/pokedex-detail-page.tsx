import { SafeImage } from "@/components/ui/safe-image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TypeBadge } from "@/components/pokemon/type-badge"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { CollectionButton } from "@/components/ui/collection-button"
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Trophy } from "lucide-react"
import Link from "next/link"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import type { Pokemon } from "@/lib/types"
import { toHabitatSlug } from "@/lib/habitat-slug"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import _pokemonAreaRestrictions from "@/../content/pokemon-area-restrictions.json"

type AreaRestriction = { habitatId: number; area: string; areaJa: string; areaZh: string; areaKo?: string }
const pokemonAreaRestrictions = _pokemonAreaRestrictions as Record<string, AreaRestriction[]>

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

interface PokedexDetailPageProps {
  slug: string
  locale: Locale
}

export async function PokedexDetailPage({
  slug,
  locale,
}: PokedexDetailPageProps) {
  const [pokemon, allPokemon, translations] = await Promise.all([
    getPokemonBySlug(slug, locale),
    getAllPokemon(locale),
    getTranslations(locale),
  ])

  if (!pokemon) {
    notFound()
  }

  const isEventPokemon = pokemon.pokopia?.category === "event"
  const sameCategoryPokemon = allPokemon.filter((p) =>
    isEventPokemon
      ? p.pokopia?.category === "event"
      : p.pokopia?.category !== "event"
  )

  const relatedPokemon = sameCategoryPokemon
    .filter((p) => p.slug !== pokemon.slug && p.types.some((type) => pokemon.types.includes(type)))
    .slice(0, 4)

  const currentIndex = sameCategoryPokemon.findIndex((p) => p.slug === pokemon.slug)
  const prevPokemon = currentIndex > 0 ? sameCategoryPokemon[currentIndex - 1] : null
  const nextPokemon = currentIndex < sameCategoryPokemon.length - 1 ? sameCategoryPokemon[currentIndex + 1] : null

  const primaryType = pokemon.types[0] || "normal"
  const gradientClass = TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.normal

  const isLegendary = pokemon.pokopia?.category === "legendary"
  const isMythical = pokemon.pokopia?.category === "mythical"
  const isSpecial = isLegendary || isMythical

  function formatDexNumber(p: Pokemon): string {
    if (p.pokopia?.category === "event" && p.pokopia.eventDexNumber != null) {
      return `E-${String(p.pokopia.eventDexNumber).padStart(3, "0")}`
    }
    return `No.${String(p.id).padStart(3, "0")}`
  }

  const heroBorderClass = isSpecial
    ? "golden-card-base"
    : "border border-border/30"

  const heroBlobClassName = isMythical
    ? "bg-pink-500/30 dark:bg-pink-500/15"
    : isLegendary
      ? "bg-amber-400/30 dark:bg-amber-400/15"
      : "opacity-30 dark:opacity-20"

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: t(translations, "pokedex.breadcrumb"),
            href: getLocalePath(locale, "/pokedex"),
          },
          { label: pokemon.name },
        ]}
        locale={locale}
      />

      {/* Hero Section */}
      <div className={`relative mt-8 mb-16 flex flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-background/20 px-4 py-16 shadow-lg backdrop-blur-2xl ${heroBorderClass}`}>
        {isSpecial && (
          <>
            <div className={`premium-metallic-border ${isLegendary ? 'legendary-metallic-gradient' : 'mythical-metallic-gradient'}`} />
            <div className="shimmer-layer" />
            <div className="sparkle" style={{ top: '8%', left: '8%', animationDelay: '0s' }} />
            <div className="sparkle" style={{ top: '12%', left: '88%', animationDelay: '0.7s' }} />
            <div className="sparkle" style={{ top: '55%', left: '5%', animationDelay: '1.4s' }} />
            <div className="sparkle" style={{ top: '70%', left: '92%', animationDelay: '0.3s' }} />
            <div className="sparkle" style={{ top: '85%', left: '20%', animationDelay: '1.0s' }} />
            <div className="sparkle" style={{ top: '30%', left: '95%', animationDelay: '1.8s' }} />
          </>
        )}
        {/* Glowing Background Blob */}
        <div className={`absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] animate-pulse duration-3000 ${heroBlobClassName}`}>
          {!isSpecial && <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />}
        </div>

        <CollectionButton
          itemId={pokemon.slug}
          className="absolute right-6 top-6 z-20"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-8 items-center justify-center rounded-full bg-muted/50 px-4 font-mono text-sm font-semibold tracking-wider text-muted-foreground shadow-sm backdrop-blur-md">
            {isEventPokemon && pokemon.pokopia?.eventDexNumber != null
              ? `E-${String(pokemon.pokopia.eventDexNumber).padStart(3, "0")}`
              : `No.${String(pokemon.id).padStart(3, "0")}`}
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">{pokemon.name}</h1>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} locale={locale} />
            ))}
          </div>
          {isSpecial && (
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider backdrop-blur-md ring-1 ${isMythical ? "bg-pink-500/20 text-pink-600 ring-pink-500/30 dark:text-pink-400" : "bg-amber-500/20 text-amber-600 ring-amber-500/30 dark:text-amber-400"}`}>
              {isMythical ? <Sparkles className="h-4 w-4" aria-hidden="true" /> : <Trophy className="h-4 w-4" aria-hidden="true" />}
              {t(translations, `pokedex.${pokemon.pokopia!.category}`)}
            </span>
          )}
          {isEventPokemon && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-emerald-600 backdrop-blur-md ring-1 ring-emerald-500/30 dark:text-emerald-400">
              {t(translations, "pokedex.event")}
            </span>
          )}
        </div>

        <div className="relative mt-12 flex h-[280px] w-full items-center justify-center sm:h-[320px] lg:h-[400px]">
          <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform hover:scale-105 duration-700 ease-out">
            <SafeImage
              src={pokemon.image}
              alt={pokemon.name}
              width={400}
              height={400}
              className="pokemon-sprite-target object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>
        </div>
      </div>

      {/* Pokopia Info Bento Grid */}
      {pokemon.pokopia && (
        <div className="mb-16">
          <h2 className="mb-6 text-3xl font-bold tracking-tight">
            {t(translations, "pokedex.pokopiaInfo")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Specialty */}
            {pokemon.pokopia.specialties.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(translations, "pokedex.specialty")}
                </h3>
                <div className="mt-auto flex flex-wrap gap-2">
                  {pokemon.pokopia.specialties.map((s) => (
                    <span key={s} className="group inline-flex items-center gap-2 rounded-2xl bg-background/50 p-2 pr-4 shadow-sm ring-1 ring-border/50 transition-all hover:bg-background">
                      <SafeImage
                        src={`/images/specialties/${s.replace(/ /g, "-")}.png`}
                        alt={t(translations, `specialties.${s}`)}
                        width={32}
                        height={32}
                        className="transition-transform group-hover:scale-110"
                      />
                      <span className="text-sm font-medium">
                        {t(translations, `specialties.${s}`)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time of Day */}
            {pokemon.pokopia.timeOfDay && pokemon.pokopia.timeOfDay.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(translations, "pokedex.timeOfDay")}
                </h3>
                <div className="mt-auto flex flex-wrap gap-2">
                  {pokemon.pokopia.timeOfDay.map((tod) => (
                    <span key={tod} className="group inline-flex items-center gap-2 rounded-2xl bg-background/50 p-2 pr-4 shadow-sm ring-1 ring-border/50 transition-all hover:bg-background">
                      <SafeImage
                        src={`/images/time/${tod}.svg`}
                        alt={t(translations, `timeOfDay.${tod}`)}
                        width={32}
                        height={32}
                        className="transition-transform group-hover:scale-110"
                      />
                      <span className="text-sm font-medium">
                        {t(translations, `timeOfDay.${tod}`)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weather */}
            {pokemon.pokopia.weather && pokemon.pokopia.weather.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(translations, "pokedex.weatherLabel")}
                </h3>
                <div className="mt-auto flex flex-wrap gap-2">
                  {pokemon.pokopia.weather.map((w) => (
                    <span key={w} className="group inline-flex items-center gap-2 rounded-2xl bg-background/50 p-2 pr-4 shadow-sm ring-1 ring-border/50 transition-all hover:bg-background">
                      <SafeImage
                        src={`/images/weather/${w}.svg`}
                        alt={t(translations, `weather.${w}`)}
                        width={32}
                        height={32}
                        className="transition-transform group-hover:scale-110"
                      />
                      <span className="text-sm font-medium">
                        {t(translations, `weather.${w}`)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites */}
            {pokemon.pokopia.favorites && pokemon.pokopia.favorites.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(translations, "pokedex.favoritesLabel")}
                </h3>
                <div className="mt-auto flex flex-wrap gap-2">
                  {pokemon.pokopia.favorites.map((fav) => (
                    <Badge key={fav} variant="secondary" className="px-3 py-1.5 text-sm ring-1 ring-border/50">
                      {t(translations, `favorites.${fav}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Obtain Method */}
            <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                {t(translations, "pokedex.obtainMethod")}
              </h3>
              <div className="mt-auto flex flex-col gap-2">
                {pokemon.pokopia.obtainMethod === "event" ? (
                  <Link
                    href={getLocalePath(locale, "/events/more-spores-for-hoppip")}
                    className="group/obtain inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-500/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:shadow-md hover:ring-emerald-500/50 dark:text-emerald-400"
                  >
                    {t(translations, `obtainMethods.${pokemon.pokopia.obtainMethod}`)}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover/obtain:translate-x-0.5" />
                  </Link>
                ) : (
                  <Badge variant="secondary" className="w-fit px-3 py-1.5 text-sm ring-1 ring-border/50">
                    {t(translations, `obtainMethods.${pokemon.pokopia.obtainMethod}`)}
                  </Badge>
                )}
                {pokemon.pokopia.obtainDetails && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pokemon.pokopia.obtainDetails}
                  </p>
                )}
              </div>
            </div>

            {/* Habitats (Spans full width if large) */}
            {pokemon.pokopia.habitats && pokemon.pokopia.habitats.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(translations, "pokedex.habitatLabel")}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4">
                  {pokemon.pokopia.habitats.map((h) => {
                    const ringColor =
                      h.rarity === "very-rare"
                        ? "ring-purple-500/50 hover:ring-purple-500"
                        : h.rarity === "rare"
                          ? "ring-blue-500/50 hover:ring-blue-500"
                          : "ring-emerald-500/50 hover:ring-emerald-500"
                    const areaRestriction = (pokemonAreaRestrictions[pokemon.slug] ?? []).find(
                      (r) => r.habitatId === h.id
                    )
                    const areaLabel = areaRestriction
                      ? locale === "ja" ? areaRestriction.areaJa : locale === "zh" ? areaRestriction.areaZh : locale === "ko" ? (areaRestriction.areaKo ?? areaRestriction.area) : areaRestriction.area
                      : null
                    return (
                      <Link
                        key={h.id}
                        href={getLocalePath(locale, `/habitat/${toHabitatSlug(h.id)}`)}
                        className={`group flex items-center gap-5 rounded-3xl bg-background/60 p-4 pr-8 shadow-sm ring-2 ${ringColor} transition-all hover:-translate-y-1 hover:bg-background hover:shadow-md`}
                      >
                        <div className="relative overflow-hidden rounded-2xl shadow-inner border border-border/20">
                          <SafeImage
                            src={`/images/habitats/habitat_${h.id}.png`}
                            alt={h.name}
                            width={100}
                            height={100}
                            className="transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex flex-col gap-3">
                          <p className="truncate text-xl font-bold tracking-tight">{h.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider font-semibold">
                              {t(translations, `rarity.${h.rarity}`)}
                            </Badge>
                            {areaLabel && (
                              <Badge variant="secondary" className="w-fit gap-1.5 px-4 py-1.5 text-base font-bold bg-amber-500 text-white hover:bg-amber-600 border-none shadow-md ring-2 ring-amber-500/20">
                                <MapPin className="h-5 w-5" />
                                {t(translations, "habitat.areaOnly").replace("{{area}}", areaLabel)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Related Pokemon */}
      {relatedPokemon.length > 0 && (
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-border/50 after:h-px after:flex-1 after:bg-border/50">
            <h2 className="text-2xl font-bold tracking-tight text-foreground/80">
              {t(translations, "pokedex.relatedPokemon")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPokemon.map((p) => (
              <PokemonCard key={p.slug} pokemon={p} locale={locale} compact headingLevel="h3" />
            ))}
          </div>
        </section>
      )}

      {/* Prev / Next Navigation */}
      <nav className="mb-16 flex items-stretch justify-between gap-4">
        {prevPokemon ? (
          <Link
            href={getLocalePath(locale, `/pokedex/${prevPokemon.slug}`)}
            className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:-translate-x-1 hover:shadow-md"
          >
            <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            <SafeImage
              src={prevPokemon.image}
              alt={prevPokemon.name}
              width={40}
              height={40}
              className="pokemon-sprite-target object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {t(translations, "pokedex.prev")}
              </span>
              <span className="text-sm font-semibold leading-tight">{prevPokemon.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDexNumber(prevPokemon)}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextPokemon ? (
          <Link
            href={getLocalePath(locale, `/pokedex/${nextPokemon.slug}`)}
            className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:translate-x-1 hover:shadow-md"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">
                {t(translations, "pokedex.next")}
              </span>
              <span className="text-sm font-semibold leading-tight">{nextPokemon.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDexNumber(nextPokemon)}
              </span>
            </div>
            <SafeImage
              src={nextPokemon.image}
              alt={nextPokemon.name}
              width={40}
              height={40}
              className="pokemon-sprite-target object-contain"
            />
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <p className="mt-8 text-center text-sm text-muted-foreground/70">
        {t(translations, "feedback.dataIssue")}{" "}
        <a
          href={`mailto:feedback@pokopiaguide.com?subject=${encodeURIComponent(`[Feedback] ${pokemon.name} - Pokopia Guide`)}&body=${encodeURIComponent(`Page: https://pokopiaguide.com${getLocalePath(locale, `/pokedex/${pokemon.slug}`)}\n\nIssue:\n`)}`}
          className="text-primary hover:underline"
        >
          {t(translations, "feedback.letUsKnow")}
        </a>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            name: pokemon.name,
            description: `${pokemon.name} - ${pokemon.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("/")}${pokemon.pokopia?.specialties?.length ? `. Specialty: ${pokemon.pokopia.specialties.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}` : ""}`,
            mainEntityOfPage: `https://pokopiaguide.com${getLocalePath(locale, `/pokedex/${pokemon.slug}`)}`,
          }),
        }}
      />
    </article>
  )
}
