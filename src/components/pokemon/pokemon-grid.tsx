"use client"

import { useRef, useState } from "react"
import { PokemonCard } from "./pokemon-card"
import { Button } from "@/components/ui/button"
import type { Pokemon } from "@/lib/types"
import type { Locale } from "@/i18n/config"

const PAGE_SIZE = 24

interface PokemonGridProps {
  pokemon: Pokemon[]
  locale: Locale
  prevLabel: string
  nextLabel: string
  pageLabel: string
}

export function PokemonGrid({
  pokemon,
  locale,
  prevLabel,
  nextLabel,
  pageLabel,
}: PokemonGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(pokemon.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const currentPokemon = pokemon.slice(start, start + PAGE_SIZE)

  function changePage(newPage: number) {
    setPage(newPage)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  return (
    <>
      <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentPokemon.map((p) => (
          <PokemonCard key={p.slug} pokemon={p} locale={locale} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
          >
            {prevLabel}
          </Button>
          <span className="text-sm text-muted-foreground">
            {pageLabel} {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => changePage(page + 1)}
          >
            {nextLabel}
          </Button>
        </div>
      )}
    </>
  )
}
