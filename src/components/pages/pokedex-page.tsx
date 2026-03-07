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
      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl text-foreground">
          {t(translations, "pokedex.title")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h2 className="text-lg sm:text-xl text-muted-foreground">
            {t(translations, "pokedex.subtitle")}
          </h2>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              {t(translations, "pokedex.totalCount").replace("{{count}}", String(pokemon.length))}
            </span>
          </div>
        </div>
      </div>
      <BrowseBySection locale={locale} />
      <PokemonGrid
        pokemon={pokemon}
        locale={locale}
      />
    </div>
  )
}
