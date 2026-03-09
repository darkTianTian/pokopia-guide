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
    flyingClone.className = "fixed z-[100] pointer-events-none flex items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-border/50"
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

    // Calculate Final Target coordinates (relative to viewport)
    let targetX = 0
    let targetY = 0

    const progressRing = document.getElementById("collection-progress-ring")
    const headerNav = document.querySelector("header > div")

    // Determine target based on what's visible in the viewport
    let hasTarget = false
    if (progressRing) {
      const ringRect = progressRing.getBoundingClientRect()
      if (ringRect.top > -50 && ringRect.bottom < window.innerHeight + 50) {
        targetX = ringRect.left + 30
        targetY = ringRect.top + ringRect.height / 2
        hasTarget = true
      }
    }

    // If progress ring is not visible, check for the main navigation pill as fallback
    if (!hasTarget && headerNav) {
      const headerRect = headerNav.getBoundingClientRect()
      if (headerRect.top > -50 && headerRect.bottom < window.innerHeight + 50) {
        // Fly to the right side of the header pill (near language switcher)
        targetX = headerRect.right - 60
        targetY = headerRect.top + headerRect.height / 2
        hasTarget = true
      }
    }

    // Ultimate fallback: Fixed top right corner of the VIEWPORT
    if (!hasTarget) {
      targetX = window.innerWidth - 60 // 60px from the right edge
      targetY = 20                     // 20px from the top edge
    }

    // Find closest Pokemon image for Stage 1 interaction
    const container = buttonRef.current.closest('article, .rounded-\\[3rem\\]')
    const imgEl = (container?.querySelector('img.pokemon-sprite-target') || container?.querySelector('img')) as HTMLElement | null

    // Force reflow
    void flyingClone.offsetWidth

    if (imgEl) {
      const imgRect = imgEl.getBoundingClientRect()
      const midX = imgRect.left + imgRect.width / 2
      const midY = imgRect.top + imgRect.height / 2

      // Stage 1: Fly to Image
      flyingClone.style.transition = "all 0.4s cubic-bezier(0.34,1.56,0.64,1)"
      flyingClone.style.transform = `translate(${midX - btnRect.left - 16}px, ${midY - btnRect.top - 16}px) scale(1.5)`
      flyingClone.style.boxShadow = "0 0 20px 10px rgba(239, 68, 68, 0.5)" // Red glow

      setTimeout(() => {
        // The Impact/Catch Effect
        const originalTransition = imgEl.style.transition
        const originalFilter = imgEl.style.filter
        const originalTransform = imgEl.style.transform
        const originalOpacity = imgEl.style.opacity

        // Flash Red
        imgEl.style.transition = "all 0.15s ease-out"
        imgEl.style.filter = "brightness(1.5) drop-shadow(0 0 20px rgba(239,68,68,0.8))"
        imgEl.style.transform = "scale(0.95)"

        // Pokeball Wobble (Left)
        flyingClone.style.transition = "transform 0.1s ease-in-out"
        flyingClone.style.transform = `translate(${midX - btnRect.left - 16}px, ${midY - btnRect.top - 16}px) scale(1.5) rotate(-15deg)`

        setTimeout(() => {
          // Vanish the Pokemon (sucked into the ball)
          imgEl.style.opacity = "0"
          imgEl.style.transform = "scale(0.5)"
          imgEl.style.filter = "brightness(2) drop-shadow(0 0 30px rgba(239,68,68,1))"

          // Pokeball Wobble (Right)
          flyingClone.style.transform = `translate(${midX - btnRect.left - 16}px, ${midY - btnRect.top - 16}px) scale(1.5) rotate(15deg)`

          setTimeout(() => {
            // Stage 2: Fly to Progress Ring
            flyingClone.style.transition = "all 0.6s cubic-bezier(0.5, 0, 0.2, 1)"
            flyingClone.style.transform = `translate(${targetX - btnRect.left - 16}px, ${targetY - btnRect.top - 16}px) scale(0.5)`
            flyingClone.style.opacity = "0"

            setTimeout(() => {
              // Restore Image after the ball flies away
              imgEl.style.transition = "opacity 0.4s ease-in-out, transform 0.4s ease-out, filter 0.4s ease-out"
              imgEl.style.opacity = originalOpacity || "1"
              imgEl.style.filter = originalFilter
              imgEl.style.transform = originalTransform

              setTimeout(() => { imgEl.style.transition = originalTransition }, 400)

              if (document.body.contains(flyingClone)) {
                document.body.removeChild(flyingClone)
              }
            }, 600)
          }, 150)
        }, 150)
      }, 400)
    } else {
      // Fallback if no image found: direct flight to Target
      flyingClone.style.transition = "all 0.7s cubic-bezier(0.34,1.56,0.64,1)"
      flyingClone.style.transform = `translate(${targetX - btnRect.left - 16}px, ${targetY - btnRect.top - 16}px) scale(0.5)`
      flyingClone.style.opacity = "0"
      flyingClone.style.boxShadow = "0 0 20px 10px rgba(239, 68, 68, 0.5)"

      setTimeout(() => {
        if (document.body.contains(flyingClone)) {
          document.body.removeChild(flyingClone)
        }
      }, 700)
    }
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
