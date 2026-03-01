import type { Metadata } from "next"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { getAllPokemon } from "@/lib/pokemon"

export const metadata: Metadata = {
  title: "宝可梦图鉴",
  description: "浏览 Pokopia 世界中所有宝可梦的详细数据、属性、特性和种族值。",
}

export default async function PokedexPage() {
  const pokemon = await getAllPokemon()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb items={[{ label: "图鉴" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">宝可梦图鉴</h1>
        <p className="mt-2 text-muted-foreground">
          浏览 Pokopia 世界中的所有宝可梦
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pokemon.map((p) => (
          <PokemonCard key={p.slug} pokemon={p} />
        ))}
      </div>
    </div>
  )
}
