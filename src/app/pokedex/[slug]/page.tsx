import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TypeBadge } from "@/components/pokemon/type-badge"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import type { PokemonStats } from "@/lib/types"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const pokemon = await getAllPokemon()
  return pokemon.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pokemon = await getPokemonBySlug(slug)
  if (!pokemon) return { title: "未找到" }

  return {
    title: `${pokemon.name} — 宝可梦图鉴`,
    description: pokemon.description,
  }
}

const STAT_LABELS: Record<keyof PokemonStats, string> = {
  hp: "HP",
  attack: "攻击",
  defense: "防御",
  spAtk: "特攻",
  spDef: "特防",
  speed: "速度",
}

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

export default async function PokemonDetailPage({ params }: PageProps) {
  const { slug } = await params
  const pokemon = await getPokemonBySlug(slug)

  if (!pokemon) {
    notFound()
  }

  const totalStats = Object.values(pokemon.stats).reduce((a, b) => a + b, 0)

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "图鉴", href: "/pokedex" },
          { label: pokemon.name },
        ]}
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
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>

      <p className="mb-8 text-lg text-muted-foreground">
        {pokemon.description}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>种族值</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(STAT_LABELS) as [keyof PokemonStats, string][]).map(
              ([key, label]) => (
                <StatBar key={key} label={label} value={pokemon.stats[key]} />
              )
            )}
            <Separator />
            <div className="flex items-center gap-3">
              <span className="w-12 text-right text-sm font-medium">合计</span>
              <span className="w-8 text-right text-sm font-bold">
                {totalStats}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>特性</CardTitle>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            name: pokemon.name,
            description: pokemon.description,
            mainEntityOfPage: `https://pokopia.guide/pokedex/${pokemon.slug}`,
          }),
        }}
      />
    </article>
  )
}
