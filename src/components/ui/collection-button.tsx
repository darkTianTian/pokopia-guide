"use client"

import dynamic from "next/dynamic"

interface CollectionButtonProps {
  itemId: string
  className?: string
}

const CollectionButtonInner = dynamic(
  () => import("./collection-button-inner").then((m) => m.CollectionButtonInner),
  { ssr: false }
)

export function CollectionButton({ itemId, className = "" }: CollectionButtonProps) {
  return <CollectionButtonInner itemId={itemId} className={className} />
}
