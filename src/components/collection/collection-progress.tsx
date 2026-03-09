"use client"

import { useCollection } from "@/hooks/use-collection"

interface CollectionProgressProps {
  total: number
}

export function CollectionProgress({ total }: CollectionProgressProps) {
  const { count, mounted } = useCollection()

  if (!mounted || count === 0) return null

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  const radius = 44
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
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
  )
}
