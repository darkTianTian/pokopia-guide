"use client"

import { useState } from "react"
import { PokemonGrid } from "./pokemon-grid"
import type { Pokemon, PokemonType } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

type Tab = "all" | "event"

interface PokedexTabsProps {
  regularPokemon: Pokemon[]
  eventPokemon: Pokemon[]
  locale: Locale
  types: readonly PokemonType[]
  regularSpecialties: string[]
  eventSpecialties: string[]
}

export function PokedexTabs({
  regularPokemon,
  eventPokemon,
  locale,
  types,
  regularSpecialties,
  eventSpecialties,
}: PokedexTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const tr = TRANSLATIONS_BY_LOCALE[locale]

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: tr.pokedex.tabAll, count: regularPokemon.length },
    { key: "event", label: tr.pokedex.tabEvent, count: eventPokemon.length },
  ]

  return (
    <>
      <div className="mb-8 flex gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.key === "event" && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-amber-950 shadow-sm ring-2 ring-background">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id={`${activeTab}-panel`} role="tabpanel">
        {activeTab === "all" ? (
          <PokemonGrid
            pokemon={regularPokemon}
            locale={locale}
            headingLevel="h3"
            types={types}
            specialties={regularSpecialties}
          />
        ) : (
          <PokemonGrid
            pokemon={eventPokemon}
            locale={locale}
            headingLevel="h3"
            types={types}
            specialties={eventSpecialties}
          />
        )}
      </div>
    </>
  )
}
