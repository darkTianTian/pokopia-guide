"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

interface HabitatLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function HabitatLink({ href, children, className }: HabitatLinkProps) {
  const router = useRouter()

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(href)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.stopPropagation()
          router.push(href)
        }
      }}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </span>
  )
}
