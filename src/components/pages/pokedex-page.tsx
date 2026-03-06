import { Breadcrumb } from "@/components/layout/breadcrumb"
import { BrowseBySection } from "@/components/pokemon/browse-by-section"
import { PokemonGrid } from "@/components/pokemon/pokemon-grid"
import { getAllPokemon } from "@/lib/pokemon"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface PokedexPageProps {
  locale: Locale
}

export async function PokedexPage({ locale }: PokedexPageProps) {
  const [pokemon, translations] = await Promise.all([
    getAllPokemon(locale),
    getTranslations(locale),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t(translations, "pokedex.breadcrumb") }]}
        locale={locale}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t(translations, "pokedex.title")}
        </h1>
        <h2 className="mt-2 text-lg font-normal text-muted-foreground">
          {t(translations, "pokedex.subtitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(translations, "pokedex.totalCount").replace("{{count}}", String(pokemon.length))}
        </p>
      </div>
      <BrowseBySection locale={locale} />
      <PokemonGrid
        pokemon={pokemon}
        locale={locale}
      />
    </div>
  )
}
