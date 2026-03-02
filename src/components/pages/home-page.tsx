import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { GuideCard } from "@/components/guides/guide-card"
import { getAllPokemon } from "@/lib/pokemon"
import { getAllGuides } from "@/lib/guides"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface HomePageProps {
  locale: Locale
}

export async function HomePage({ locale }: HomePageProps) {
  const [pokemon, guides, translations] = await Promise.all([
    getAllPokemon(locale),
    getAllGuides(locale),
    getTranslations(locale),
  ])

  const featuredPokemon = pokemon.slice(0, 3)
  const latestGuides = guides.slice(0, 3)

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
