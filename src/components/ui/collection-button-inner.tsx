"use client"

import { Check } from "lucide-react"
import { useCollection } from "@/hooks/use-collection"

interface CollectionButtonInnerProps {
  itemId: string
  className?: string
}

export function CollectionButtonInner({ itemId, className = "" }: CollectionButtonInnerProps) {
  const { has, toggle, mounted } = useCollection()

  if (!mounted) return null

  const active = has(itemId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(itemId)
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        active
          ? "bg-emerald-500 text-white ring-1 ring-inset ring-emerald-500 hover:bg-emerald-600"
          : "bg-background/80 text-muted-foreground ring-1 ring-inset ring-border/50 hover:bg-emerald-50 hover:text-emerald-500 hover:ring-emerald-300 dark:hover:bg-emerald-950/30"
      } ${className}`}
      aria-label={active ? "Mark as uncaught" : "Mark as caught"}
    >
      <Check
        className={`h-4 w-4 transition-transform ${active ? "scale-110" : ""}`}
      />
    </button>
  )
}
