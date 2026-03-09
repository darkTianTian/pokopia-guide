"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { useCollection } from "@/hooks/use-collection"
import { ShareCardModal } from "./share-card-modal"

interface CollectionProgressProps {
  total: number
  pokemonSlugs: string[]
  translations: Record<string, string>
}

export function CollectionProgress({ total, pokemonSlugs, translations }: CollectionProgressProps) {
  const { items, count, mounted } = useCollection()
  const [showShare, setShowShare] = useState(false)

  if (!mounted || count === 0) return null

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  const radius = 44
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const caughtSlugs = pokemonSlugs.filter((slug) => items.has(slug))

  return (
    <>
      <div className="relative flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] shrink-0">
            <circle
              stroke="currentColor"
              className="text-emerald-500/20"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="currentColor"
              className="text-emerald-500 transition-all duration-700 ease-out"
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute flex flex-col items-center leading-none">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {percentage}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {count}/{total}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
          aria-label="Share collection"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <ShareCardModal
        open={showShare}
        onOpenChange={setShowShare}
        caughtSlugs={caughtSlugs}
        totalCount={total}
        translations={translations}
      />
    </>
  )
}
