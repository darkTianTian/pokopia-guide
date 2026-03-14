"use client"

import { useState } from "react"
import { PokemonGrid } from "./pokemon-grid"
import type { Pokemon, PokemonType } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"
import koTranslations from "@/i18n/ko.json"
import zhHansTranslations from "@/i18n/zh-Hans.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  "zh-Hans": zhHansTranslations,
  ja: jaTranslations,
  ko: koTranslations,
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: tr.pokedex.tabAll },
    { key: "event", label: tr.pokedex.tabEvent },
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
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
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
