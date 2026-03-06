import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getAllHabitatsWithPokemon } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface HabitatListPageProps {
  locale: Locale
}

export async function HabitatListPage({ locale }: HabitatListPageProps) {
  const [habitats, translations] = await Promise.all([
    getAllHabitatsWithPokemon(locale),
    getTranslations(locale),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: t(translations, "nav.habitat"),
            href: getLocalePath(locale, "/habitat"),
          },
          { label: t(translations, "habitat.breadcrumbList") },
        ]}
        locale={locale}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t(translations, "habitat.listTitle")}
        </h1>
        <h2 className="mt-2 text-lg font-normal text-muted-foreground">
          {t(translations, "habitat.listDescription")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {habitats.map((habitat) => (
          <Link
            key={habitat.id}
            href={getLocalePath(locale, `/habitat/list/${habitat.id}`)}
          >
            <Card className="transition-shadow hover:shadow-lg h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-center py-2">
                  <SafeImage
                    src={habitat.image}
                    alt={habitat.name}
                    width={160}
                    height={160}
                    className="rounded-lg object-contain"
                  />
                </div>
                <CardTitle className="text-center text-lg">{habitat.name}</CardTitle>
                {habitat.materials && (
                  <p className="text-center text-xs text-muted-foreground">
                    {habitat.materials}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {habitat.pokemon.slice(0, 6).map(({ pokemon }) => (
                      <SafeImage
                        key={pokemon.id}
                        src={pokemon.image}
                        alt={pokemon.name}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-background bg-muted"
                      />
                    ))}
                  </div>
                  {habitat.pokemon.length > 6 && (
                    <span className="text-sm text-muted-foreground">
                      +{habitat.pokemon.length - 6}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {habitat.pokemon.length}{" "}
                  {t(translations, "habitat.pokemonCount")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
