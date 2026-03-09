"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useWishlist } from "@/hooks/use-wishlist"
import { getLocalePath, type Locale } from "@/i18n/config"

interface WishlistIconProps {
  locale: Locale
}

export function WishlistIcon({ locale }: WishlistIconProps) {
  const { count, mounted } = useWishlist()

  return (
    <Link
      id="header-wishlist-icon"
      href={getLocalePath(locale, "/wishlist")}
      className="relative rounded-full p-2 text-muted-foreground transition-all duration-300 hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-950/30"
      aria-label="Wishlist"
    >
      <Heart className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
