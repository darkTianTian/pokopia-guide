import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { Badge } from "@/components/ui/badge"
import { getHabitatWithPokemon } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import { notFound } from "next/navigation"

interface HabitatDetailPageProps {
  id: number
  locale: Locale
}

export async function HabitatDetailPage({
  id,
  locale,
}: HabitatDetailPageProps) {
  const [habitat, translations] = await Promise.all([
    getHabitatWithPokemon(id, locale),
    getTranslations(locale),
  ])

  if (!habitat) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: t(translations, "nav.habitat"),
            href: getLocalePath(locale, "/habitat"),
          },
          {
            label: t(translations, "habitat.breadcrumbList"),
            href: getLocalePath(locale, "/habitat/list"),
          },
          { label: habitat.name },
        ]}
        locale={locale}
      />
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <SafeImage
          src={habitat.image}
          alt={habitat.name}
          width={240}
          height={240}
          className="rounded-lg object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold">{habitat.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {t(translations, "habitat.detailDescription")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {habitat.pokemon.length}{" "}
            {t(translations, "habitat.pokemonCount")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {habitat.pokemon.map(({ pokemon, rarity }) => (
          <div key={pokemon.id} className="relative">
            <PokemonCard pokemon={pokemon} locale={locale} />
            <Badge
              variant={
                rarity === "very-rare"
                  ? "destructive"
                  : rarity === "rare"
                    ? "default"
                    : "secondary"
              }
              className="absolute right-2 top-2"
            >
              {t(translations, `rarity.${rarity}`)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
