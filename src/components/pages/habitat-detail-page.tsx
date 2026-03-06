import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
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
          {habitat.materials && (
            <p className="mt-3 text-base">
              <span className="font-semibold">{t(translations, "habitat.materials")}:</span>{" "}
              <span className="font-medium">{habitat.materials}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mb-4 text-sm text-muted-foreground">
        {t(translations, "habitat.detailDescription")} ({habitat.pokemon.length} {t(translations, "habitat.pokemonCount")})
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {habitat.pokemon.map(({ pokemon, rarity }) => {
          const borderColor =
            rarity === "very-rare"
              ? "border-purple-500"
              : rarity === "rare"
                ? "border-blue-500"
                : "border-green-500"
          return (
            <div key={pokemon.id} className={`rounded-xl border-2 ${borderColor}`}>
              <PokemonCard pokemon={pokemon} locale={locale} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
