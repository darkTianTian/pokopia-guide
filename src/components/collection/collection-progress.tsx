"use client"

import { useState, useEffect, useRef } from "react"
import { Share2 } from "lucide-react"
import { useCollection } from "@/hooks/use-collection"
import { ShareCardModal } from "./share-card-modal"

interface CollectionProgressProps {
  total: number
  pokemonSlugs: string[]
  translations: Record<string, string>
}

export function CollectionProgress({ total, pokemonSlugs, translations }: CollectionProgressProps) {
  const { items, count: realCount, mounted } = useCollection()
  const [showShare, setShowShare] = useState(false)
  const [displayCount, setDisplayCount] = useState(-1)
  const [isPop, setIsPop] = useState(false)

  const latestRealCount = useRef(realCount)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    latestRealCount.current = realCount
  }, [realCount])

  // Sync initial state on mount
  useEffect(() => {
    if (mounted && displayCount === -1 && realCount >= 0) {
      setDisplayCount(realCount)
    }
  }, [mounted, realCount, displayCount])

  // Handle count changes with delays for the Pokeball flight animation
  useEffect(() => {
    if (!mounted || displayCount === -1) return

    if (realCount < displayCount) {
      // Un-catch: Update immediately
      setDisplayCount(realCount)
    } else if (realCount > displayCount) {
      // Catch: Delay visual update to match the 1.25s Pokeball flight duration
      const targetCount = realCount
      const timer = setTimeout(() => {
        setDisplayCount((prev) => {
          // Double check if the real count hasn't been reverted within the 1.25s window
          if (latestRealCount.current >= targetCount) {
            return targetCount
          }
          return prev
        })

        // Trigger the scale pop animation
        setIsPop(true)
        const popTimer = setTimeout(() => setIsPop(false), 350)
        timeoutsRef.current.push(popTimer)
      }, 1250) // Stage 1 (400) + impact (150) + vanish (150) + stage 2 (550 flight to target)

      timeoutsRef.current.push(timer)
    }
  }, [realCount]) // ONLY run on realCount change!

  useEffect(() => {
    return () => {
      // eslint-react-hooks-exhaustive-deps
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  if (!mounted || displayCount === -1) return null

  // Use displayCount instead of realCount for all visual elements
  const count = displayCount
  const rawPercentage = total > 0 ? (count / total) * 100 : 0
  const percentage = count === total ? 100 : Math.min(Math.round(rawPercentage), 99)

  // Enlarged Ring Size
  const radius = 56
  const stroke = 7
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const caughtSlugs = pokemonSlugs.filter((slug) => items.has(slug))

  const getMilestone = (p: number) => {
    if (p === 100) return {
      id: "completionist",
      gradient: { from: "#10b981", to: "#f59e0b" }, // emerald-500 to amber-500
      text: "text-emerald-500 dark:text-emerald-400",
      bgRing: "text-emerald-500/20",
      glow: "bg-emerald-500/30 animate-pulse",
      hover: "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
    }
    if (p >= 67) return {
      id: "master",
      gradient: { from: "#c026d3", to: "#8b5cf6" }, // fuchsia-600 to violet-500
      text: "text-fuchsia-600 dark:text-fuchsia-400",
      bgRing: "text-fuchsia-500/20",
      glow: "bg-fuchsia-500/20",
      hover: "hover:bg-fuchsia-500/10 hover:text-fuchsia-600 dark:hover:text-fuchsia-400"
    }
    if (p >= 34) return {
      id: "explorer",
      gradient: { from: "#06b6d4", to: "#3b82f6" }, // cyan-500 to blue-500
      text: "text-cyan-600 dark:text-cyan-400",
      bgRing: "text-cyan-500/20",
      glow: "bg-cyan-500/20",
      hover: "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
    }
    return {
      id: "newbie",
      gradient: { from: "#f59e0b", to: "#ea580c" }, // amber-500 to orange-600
      text: "text-amber-600 dark:text-amber-400",
      bgRing: "text-amber-500/20",
      glow: "bg-amber-500/20",
      hover: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
    }
  }

  const milestone = getMilestone(percentage)

  return (
    <>
      <div id="collection-progress-ring" className="relative flex items-center gap-4 rounded-full border border-border/40 bg-background/40 p-3 pr-6 shadow-sm backdrop-blur-xl">
        {/* Enlarged Glowing Backdrop Blob */}
        <div className={`absolute left-4 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full blur-[25px] transition-colors duration-700 ${milestone.glow}`} />

        <div className="relative flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] shrink-0 relative z-10 transition-transform duration-300">
            <defs>
              <linearGradient id={`progress-gradient-${milestone.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={milestone.gradient.from} />
                <stop offset="100%" stopColor={milestone.gradient.to} />
              </linearGradient>
            </defs>
            <circle
              stroke="currentColor"
              className={`${milestone.bgRing} transition-colors duration-700`}
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={`url(#progress-gradient-${milestone.id})`}
              className="transition-all duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
          <div className={`absolute flex flex-col items-center leading-none z-10 transition-transform duration-300 ${isPop ? "scale-125" : "scale-100"}`}>
            <span className={`text-2xl font-extrabold tracking-tight transition-colors duration-700 ${milestone.text}`}>
              {percentage}%
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">
              {count}/{total}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-border/50 hidden sm:block"></div>

        <button
          onClick={() => setShowShare(true)}
          className={`relative z-10 rounded-full p-2.5 text-muted-foreground transition-all duration-300 active:scale-95 ${milestone.hover}`}
          aria-label="Share collection"
        >
          <Share2 className="h-6 w-6" />
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
