import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { GuideCard } from "@/components/guides/guide-card"
import { SafeImage } from "@/components/ui/safe-image"
import { QuantityDots } from "@/components/ui/quantity-dots"
import { getAllPokemon } from "@/lib/pokemon"
import { getAllGuides } from "@/lib/guides"
import { getAllHabitatsWithPokemon } from "@/lib/habitat"
import { getMaterialItems } from "@/lib/materials"
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
      title: t(translations, "nav.habitatList"),
      description: t(translations, "habitat.listDescription"),
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
      comingSoon: true,
    },
    {
      href: getLocalePath(locale, "/multiplayer"),
      title: t(translations, "features.multiplayerTitle"),
      description: t(translations, "features.multiplayerDesc"),
      icon: "🤝",
      comingSoon: true,
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
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="flex-none"
            >
              <Card className={`h-full w-[220px] rounded-2xl border-border/40 bg-background/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:bg-background/60 hover:shadow-xl ${feature.comingSoon ? "opacity-60" : ""}`}>
                <CardHeader>
                  <div className="mb-2 text-3xl">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
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
                <PokemonCard key={p.slug} pokemon={p} locale={locale} headingLevel="h3" />
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
              <Link href={getLocalePath(locale, "/habitat")}>
                {t(translations, "home.viewAll")} &rarr;
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredHabitats.map((habitat) => (
              <article key={habitat.id} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl">
                <span className="absolute top-6 right-6 z-20 flex px-4 py-1 items-center justify-center rounded-full bg-muted/60 font-mono text-sm font-bold tracking-widest text-muted-foreground backdrop-blur-md ring-1 ring-border/50">
                  #{String(habitat.id).padStart(3, "0")}
                </span>

                <div className="absolute left-1/2 top-28 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-60 dark:opacity-20 dark:group-hover:opacity-50">
                  <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="relative mb-6 mt-2 flex h-[160px] items-center justify-center">
                    <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110">
                      <SafeImage
                        src={habitat.image}
                        alt={habitat.name}
                        width={160}
                        height={160}
                        className="rounded-2xl object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
                      />
                    </div>
                  </div>

                  <div className="mb-4 text-center z-10">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {habitat.name}
                    </h3>
                    {(() => {
                      const items = getMaterialItems(habitat.materialsEn, locale)
                      return items.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          {items.map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10"
                            >
                              <SafeImage
                                src={`/images/items/${item.slug}.png`}
                                alt={item.name}
                                width={20}
                                height={20}
                                className="inline-block shrink-0"
                              />
                              {item.name}
                              <QuantityDots count={item.quantity} className="ml-1" />
                            </span>
                          ))}
                        </div>
                      ) : null
                    })()}
                  </div>

                  <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50 z-10">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {habitat.pokemon.map(({ pokemon: p }) => (
                        <Link
                          key={p.id}
                          href={getLocalePath(locale, `/pokedex/${p.slug}`)}
                          className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-background drop-shadow-sm transition-transform hover:scale-125 hover:z-20 border border-border/20"
                          title={p.name}
                        >
                          <SafeImage
                            src={p.image}
                            alt={p.name}
                            fill
                            className="bg-background object-contain p-1"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
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
