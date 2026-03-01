import Image from "next/image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TypeBadge } from "@/components/pokemon/type-badge"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import type { PokemonStats } from "@/lib/types"

const STAT_KEYS: (keyof PokemonStats)[] = [
  "hp",
  "attack",
  "defense",
  "spAtk",
  "spDef",
  "speed",
]

const STAT_MAX = 255

function StatBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / STAT_MAX) * 100

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-right text-sm text-muted-foreground">
        {label}
      </span>
      <span className="w-8 text-right text-sm font-medium">{value}</span>
      <div className="h-2.5 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
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

  const totalStats = Object.values(pokemon.stats).reduce((a, b) => a + b, 0)

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
          <span className="text-sm text-muted-foreground">
            #{String(pokemon.id).padStart(3, "0")}
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
        <Image
          src={pokemon.image}
          alt={pokemon.name}
          width={240}
          height={240}
          className="object-contain"
          priority
        />
      </div>

      <p className="mb-8 text-lg text-muted-foreground">
        {pokemon.description}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t(translations, "pokedex.baseStats")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STAT_KEYS.map((key) => (
              <StatBar
                key={key}
                label={t(translations, `stats.${key}`)}
                value={pokemon.stats[key]}
              />
            ))}
            <Separator />
            <div className="flex items-center gap-3">
              <span className="w-12 text-right text-sm font-medium">
                {t(translations, "pokedex.total")}
              </span>
              <span className="w-8 text-right text-sm font-bold">
                {totalStats}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(translations, "pokedex.abilities")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((ability) => (
                <Badge key={ability} variant="outline">
                  {ability}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {relatedPokemon.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">
            {t(translations, "pokedex.relatedPokemon")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedPokemon.map((p) => (
              <PokemonCard key={p.slug} pokemon={p} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            name: pokemon.name,
            description: pokemon.description,
            mainEntityOfPage: `https://pokopiaguide.com${getLocalePath(locale, `/pokedex/${pokemon.slug}`)}`,
          }),
        }}
      />
    </article>
  )
}
