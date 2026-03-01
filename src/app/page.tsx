import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { GuideCard } from "@/components/guides/guide-card"
import { getAllPokemon } from "@/lib/pokemon"
import { getAllGuides } from "@/lib/guides"

const FEATURES = [
  {
    href: "/pokedex",
    title: "宝可梦图鉴",
    description: "查看所有宝可梦的详细数据、属性和特性",
    icon: "📖",
  },
  {
    href: "/guides",
    title: "攻略文章",
    description: "新手入门、进阶技巧、通关攻略一网打尽",
    icon: "📝",
  },
  {
    href: "#",
    title: "道具大全",
    description: "所有道具的获取方式与使用效果（即将推出）",
    icon: "🎒",
  },
  {
    href: "#",
    title: "技能查询",
    description: "技能威力、命中率、效果详解（即将推出）",
    icon: "⚡",
  },
] as const

export default async function HomePage() {
  const [pokemon, guides] = await Promise.all([
    getAllPokemon(),
    getAllGuides(),
  ])

  const featuredPokemon = pokemon.slice(0, 3)
  const latestGuides = guides.slice(0, 3)

  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            欢迎来到 Pokopia 攻略站
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            最全面的 Pokopia 游戏攻略与数据查询平台。无论你是新手训练家还是资深玩家，都能在这里找到你需要的信息。
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/pokedex">浏览图鉴</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/guides">查看攻略</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">功能导航</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
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
              <h2 className="text-2xl font-bold">精选宝可梦</h2>
              <Button asChild variant="ghost">
                <Link href="/pokedex">查看全部 &rarr;</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPokemon.map((p) => (
                <PokemonCard key={p.slug} pokemon={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {latestGuides.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">最新攻略</h2>
            <Button asChild variant="ghost">
              <Link href="/guides">查看全部 &rarr;</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
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
            name: "Pokopia 攻略站",
            description:
              "最全面的 Pokopia 游戏攻略与数据查询平台",
            url: "https://pokopia.guide",
          }),
        }}
      />
    </>
  )
}
