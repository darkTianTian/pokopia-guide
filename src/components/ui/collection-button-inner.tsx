"use client"

import { PokeballIcon } from "./pokeball-icon"
import { useCollection } from "@/hooks/use-collection"
import { useRef } from "react"

interface CollectionButtonInnerProps {
  itemId: string
  className?: string
}

export function CollectionButtonInner({ itemId, className = "" }: CollectionButtonInnerProps) {
  const { has, toggle, mounted } = useCollection()
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (!mounted) return null

  const active = has(itemId)

  const triggerAnimation = (e: React.MouseEvent) => {
    // Only animate when ADDING to collection
    if (active || !buttonRef.current) return

    const btnRect = buttonRef.current.getBoundingClientRect()

    // Create a clone of the Pokeball SVG to fly
    const flyingClone = document.createElement("div")
    flyingClone.className = "fixed z-[100] pointer-events-none transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-border/50"
    flyingClone.style.width = "32px"
    flyingClone.style.height = "32px"
    flyingClone.style.left = `${btnRect.left}px`
    flyingClone.style.top = `${btnRect.top}px`
    flyingClone.style.color = "#ef4444" // Red color for the active pokeball outline

    // Inner SVG matches the active PokeballIcon state
    flyingClone.innerHTML = `
      <svg viewBox="0 0 100 100" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" stroke-width="6"/>
        <path d="M 50 5 A 45 45 0 0 1 95 50 L 5 50 A 45 45 0 0 1 50 5 Z" fill="#ef4444"/>
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" stroke-width="6"/>
        <circle cx="50" cy="50" r="14" fill="white" stroke="currentColor" stroke-width="6"/>
        <circle cx="50" cy="50" r="6" fill="currentColor"/>
      </svg>
    `
    document.body.appendChild(flyingClone)

    // Calculate Target coordinates
    let targetX = 0
    let targetY = 0

    const progressRing = document.getElementById("collection-progress-ring")
    const headerWishlist = document.getElementById("header-wishlist-icon")

    if (progressRing) {
      const ringRect = progressRing.getBoundingClientRect()
      // Default to top-right viewport corner if scrolled way down
      if (ringRect.top > -50 && ringRect.bottom < window.innerHeight + 50) {
        // Fly to the progress circle part of the pill (roughly 30px from left)
        targetX = ringRect.left + 30
        targetY = ringRect.top + ringRect.height / 2
      } else {
        targetX = window.innerWidth - 60
        targetY = 20
      }
    } else if (headerWishlist) {
      const wishRect = headerWishlist.getBoundingClientRect()
      targetX = wishRect.left + wishRect.width / 2
      targetY = wishRect.top + wishRect.height / 2
    } else {
      // Ultimate fallback: top right corner
      targetX = window.innerWidth - 60
      targetY = 20
    }

    // Force reflow
    void flyingClone.offsetWidth

    // Trigger CSS transition
    flyingClone.style.transform = `translate(${targetX - btnRect.left - 16}px, ${targetY - btnRect.top - 16}px) scale(0.5)`
    flyingClone.style.opacity = "0"
    flyingClone.style.boxShadow = "0 0 20px 10px rgba(239, 68, 68, 0.5)" // Red glow during flight

    setTimeout(() => {
      document.body.removeChild(flyingClone)
    }, 700)
  }

  return (
    <button
      ref={buttonRef}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        triggerAnimation(e)
        toggle(itemId)
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${active
          ? "bg-red-50 text-red-500 ring-1 ring-inset ring-red-500/50 hover:bg-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          : "bg-background/80 text-muted-foreground ring-1 ring-inset ring-border/50 hover:bg-red-50 hover:text-red-500 hover:ring-red-300 dark:hover:bg-red-950/30"
        } ${className}`}
      aria-label={active ? "Mark as uncaught" : "Mark as caught"}
    >
      <PokeballIcon
        active={active}
        className={`h-[18px] w-[18px] transition-transform ${active ? "scale-110" : ""}`}
      />
    </button>
  )
}
