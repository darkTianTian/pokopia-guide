"use client"

import dynamic from "next/dynamic"

interface WishlistButtonProps {
  itemId: string
  className?: string
}

const WishlistButtonInner = dynamic(
  () => import("./wishlist-button-inner").then((m) => m.WishlistButtonInner),
  { ssr: false }
)

export function WishlistButton({ itemId, className = "" }: WishlistButtonProps) {
  return <WishlistButtonInner itemId={itemId} className={className} />
}
