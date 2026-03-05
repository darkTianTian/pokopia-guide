import Image from "next/image"
import { SafeImage } from "@/components/ui/safe-image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TypeBadge } from "@/components/pokemon/type-badge"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

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

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
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
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium tabular-nums text-muted-foreground">
            No.{String(pokemon.id).padStart(3, "0")}
          </span>
          <h1 className="text-3xl font-bold">{pokemon.name}</h1>
        </div>
        <div className="mt-2 flex gap-2">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} locale={locale} />
          ))}
        </div>
      </div>

      <div className="mb-8 flex justify-center">
        <SafeImage
          src={pokemon.image}
          alt={pokemon.name}
          width={240}
          height={240}
          className="object-contain"
          priority
        />
      </div>

      {pokemon.pokopia && (
        <Card>
          <CardHeader>
            <CardTitle>{t(translations, "pokedex.pokopiaInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {pokemon.pokopia.specialties.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {t(translations, "pokedex.specialty")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pokemon.pokopia.specialties.map((s) => (
                      <span key={s} className="inline-flex flex-col items-center gap-0.5">
                        <SafeImage
                          src={`/images/specialties/${s.replace(/ /g, "-")}.png`}
                          alt={t(translations, `specialties.${s}`)}
                          width={32}
                          height={32}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t(translations, `specialties.${s}`)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {t(translations, "pokedex.obtainMethod")}
                </p>
                <Badge variant="outline">
                  {t(translations, `obtainMethods.${pokemon.pokopia.obtainMethod}`)}
                </Badge>
              </div>

              {pokemon.pokopia.timeOfDay && pokemon.pokopia.timeOfDay.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {t(translations, "pokedex.timeOfDay")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pokemon.pokopia.timeOfDay.map((tod) => (
                      <span key={tod} className="inline-flex flex-col items-center gap-0.5">
                        <SafeImage
                          src={`/images/time/${tod}.svg`}
                          alt={t(translations, `timeOfDay.${tod}`)}
                          width={28}
                          height={28}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t(translations, `timeOfDay.${tod}`)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pokemon.pokopia.weather && pokemon.pokopia.weather.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {t(translations, "pokedex.weatherLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pokemon.pokopia.weather.map((w) => (
                      <span key={w} className="inline-flex flex-col items-center gap-0.5">
                        <SafeImage
                          src={`/images/weather/${w}.svg`}
                          alt={t(translations, `weather.${w}`)}
                          width={28}
                          height={28}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t(translations, `weather.${w}`)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pokemon.pokopia.habitats && pokemon.pokopia.habitats.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {t(translations, "pokedex.habitatLabel")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {pokemon.pokopia.habitats.map((h) => {
                      const borderColor =
                        h.rarity === "very-rare"
                          ? "border-purple-500"
                          : h.rarity === "rare"
                            ? "border-blue-500"
                            : "border-green-500"
                      return (
                        <div key={h.id} className="flex flex-col items-center gap-1">
                          <SafeImage
                            src={`/images/habitats/habitat_${h.id}.png`}
                            alt={h.name}
                            width={96}
                            height={96}
                            className={`rounded-lg border-2 ${borderColor}`}
                          />
                          <p className="max-w-[100px] truncate text-center text-xs font-medium">{h.name}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {t(translations, `rarity.${h.rarity}`)}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {relatedPokemon.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">
            {t(translations, "pokedex.relatedPokemon")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPokemon.map((p) => (
              <PokemonCard key={p.slug} pokemon={p} locale={locale} compact />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
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
