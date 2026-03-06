import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { GuideCard } from "@/components/guides/guide-card"
import { SafeImage } from "@/components/ui/safe-image"
import { getAllPokemon } from "@/lib/pokemon"
import { getAllGuides } from "@/lib/guides"
import { getAllHabitatsWithPokemon } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface HomePageProps {
  locale: Locale
}

export async function HomePage({ locale }: HomePageProps) {
  const [pokemon, guides, habitats, translations] = await Promise.all([
    getAllPokemon(locale),
    getAllGuides(locale),
    getAllHabitatsWithPokemon(locale),
    getTranslations(locale),
  ])

  const featuredPokemon = pokemon.slice(0, 3)
  const latestGuides = guides.slice(0, 3)
  const featuredHabitats = habitats.slice(0, 6)

  const features = [
    {
      href: getLocalePath(locale, "/pokedex"),
      title: t(translations, "features.pokedexTitle"),
      description: t(translations, "features.pokedexDesc"),
      icon: "📖",
    },
    {
      href: getLocalePath(locale, "/habitat"),
      title: t(translations, "features.habitatTitle"),
      description: t(translations, "features.habitatDesc"),
      icon: "🏡",
    },
    {
      href: getLocalePath(locale, "/guides"),
      title: t(translations, "features.guidesTitle"),
      description: t(translations, "features.guidesDesc"),
      icon: "📜",
    },
    {
      href: getLocalePath(locale, "/events"),
      title: t(translations, "features.eventsTitle"),
      description: t(translations, "features.eventsDesc"),
      icon: "🎉",
    },
    {
      href: getLocalePath(locale, "/explore"),
      title: t(translations, "features.exploreTitle"),
      description: t(translations, "features.exploreDesc"),
      icon: "🗺️",
    },
    {
      href: getLocalePath(locale, "/multiplayer"),
      title: t(translations, "features.multiplayerTitle"),
      description: t(translations, "features.multiplayerDesc"),
      icon: "🤝",
    },
  ]

  return (
    <>
      <section className="bg-gradient-to-b from-primary/10 via-accent/5 to-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t(translations, "home.heroTitle")}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            {t(translations, "home.heroDescription")}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href={getLocalePath(locale, "/pokedex")}>
                {t(translations, "home.browsePokedex")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={getLocalePath(locale, "/guides")}>
                {t(translations, "home.viewGuides")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t(translations, "home.featureNav")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 text-3xl">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {featuredPokemon.length > 0 && (
        <section className="bg-muted/50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {t(translations, "home.featuredPokemon")}
              </h2>
              <Button asChild variant="ghost">
                <Link href={getLocalePath(locale, "/pokedex")}>
                  {t(translations, "home.viewAll")} &rarr;
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPokemon.map((p) => (
                <PokemonCard key={p.slug} pokemon={p} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredHabitats.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {t(translations, "home.pokopiaHabitats")}
            </h2>
            <Button asChild variant="ghost">
              <Link href={getLocalePath(locale, "/habitat/list")}>
                {t(translations, "home.viewAll")} &rarr;
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredHabitats.map((habitat) => (
              <Link
                key={habitat.id}
                href={getLocalePath(locale, `/habitat/list/${habitat.id}`)}
              >
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex justify-center py-2">
                      <SafeImage
                        src={habitat.image}
                        alt={habitat.name}
                        width={120}
                        height={120}
                        className="rounded-lg object-contain"
                      />
                    </div>
                    <CardTitle className="text-center text-lg">
                      {habitat.name}
                    </CardTitle>
                    {habitat.materials && (
                      <p className="text-center text-xs text-muted-foreground">
                        {habitat.materials}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex -space-x-2">
                        {habitat.pokemon.slice(0, 5).map(({ pokemon: p }) => (
                          <SafeImage
                            key={p.id}
                            src={p.image}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="rounded-full border-2 border-background bg-muted"
                          />
                        ))}
                      </div>
                      {habitat.pokemon.length > 5 && (
                        <span className="text-sm text-muted-foreground">
                          +{habitat.pokemon.length - 5}
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
        </section>
      )}

      {latestGuides.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {t(translations, "home.latestGuides")}
            </h2>
            <Button asChild variant="ghost">
              <Link href={getLocalePath(locale, "/guides")}>
                {t(translations, "home.viewAll")} &rarr;
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: t(translations, "site.name"),
            description: t(translations, "site.description"),
            url: "https://pokopiaguide.com",
          }),
        }}
      />
    </>
  )
}
