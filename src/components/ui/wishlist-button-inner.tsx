"use client"

import { Heart } from "lucide-react"
import { useWishlist } from "@/hooks/use-wishlist"

interface WishlistButtonInnerProps {
  itemId: string
  className?: string
}

export function WishlistButtonInner({ itemId, className = "" }: WishlistButtonInnerProps) {
  const { has, toggle, mounted } = useWishlist()

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
          ? "bg-pink-500 text-white ring-1 ring-inset ring-pink-500 hover:bg-pink-600"
          : "bg-background/80 text-muted-foreground ring-1 ring-inset ring-border/50 hover:bg-pink-50 hover:text-pink-500 hover:ring-pink-300 dark:hover:bg-pink-950/30"
      } ${className}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${active ? "fill-current scale-110" : ""}`}
      />
    </button>
  )
}
