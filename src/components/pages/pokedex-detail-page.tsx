import { SafeImage } from "@/components/ui/safe-image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TypeBadge } from "@/components/pokemon/type-badge"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import Link from "next/link"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

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

  const relatedPokemon = allPokemon
    .filter((p) => p.slug !== pokemon.slug && p.types.some((type) => pokemon.types.includes(type)))
    .slice(0, 4)

  const primaryType = pokemon.types[0] || "normal"
  const gradientClass = TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.normal

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
      <div className="relative mt-8 mb-16 flex flex-col items-center justify-center rounded-[3rem] border border-border/30 bg-background/20 px-4 py-16 shadow-lg backdrop-blur-2xl">
        {/* Glowing Background Blob */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[80px] dark:opacity-20 animate-pulse duration-3000">
          <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-8 items-center justify-center rounded-full bg-muted/50 px-4 font-mono text-sm font-semibold tracking-wider text-muted-foreground shadow-sm backdrop-blur-md">
            No.{String(pokemon.id).padStart(3, "0")}
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">{pokemon.name}</h1>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} locale={locale} />
            ))}
          </div>
        </div>

        <div className="relative mt-12 flex h-[280px] w-full items-center justify-center sm:h-[320px] lg:h-[400px]">
          <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform hover:scale-105 duration-700 ease-out">
            <SafeImage
              src={pokemon.image}
              alt={pokemon.name}
              width={400}
              height={400}
              className="object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
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

            {/* Obtain Method */}
            <div className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-muted/20 p-6 shadow-sm backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                {t(translations, "pokedex.obtainMethod")}
              </h3>
              <div className="mt-auto">
                <Badge variant="secondary" className="px-3 py-1.5 text-sm ring-1 ring-border/50">
                  {t(translations, `obtainMethods.${pokemon.pokopia.obtainMethod}`)}
                </Badge>
              </div>
            </div>

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
                    return (
                      <Link
                        key={h.id}
                        href={getLocalePath(locale, `/habitat/list/${h.id}`)}
                        className={`group flex items-center gap-4 rounded-3xl bg-background/60 p-3 pr-6 shadow-sm ring-2 ${ringColor} transition-all hover:-translate-y-1 hover:bg-background hover:shadow-md`}
                      >
                        <div className="overflow-hidden rounded-2xl">
                          <SafeImage
                            src={`/images/habitats/habitat_${h.id}.png`}
                            alt={h.name}
                            width={80}
                            height={80}
                            className="transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <p className="max-w-[140px] truncate text-sm font-bold">{h.name}</p>
                          <Badge variant="secondary" className="w-fit text-[10px] uppercase">
                            {t(translations, `rarity.${h.rarity}`)}
                          </Badge>
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
              <PokemonCard key={p.slug} pokemon={p} locale={locale} compact />
            ))}
          </div>
        </section>
      )}

      <p className="mt-16 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
        {t(translations, "pokedex.dataDisclaimer")}
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
