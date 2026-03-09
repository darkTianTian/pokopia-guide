"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { renderShareCard, renderShareCardToPreview, type ShareCardConfig } from "@/lib/share-card-renderer"

let cachedSpriteSheet: HTMLImageElement | null = null
let cachedSpriteMap: Record<string, { x: number; y: number }> | null = null

interface ShareCardCanvasProps {
  orientation: "portrait" | "landscape"
  layoutStyle: "grid" | "class-photo"
  nickname: string
  slogan: string
  caughtSlugs: string[]
  totalCount: number
  onReady?: (getBlob: () => Promise<Blob>) => void
}

export function ShareCardCanvas({
  orientation,
  layoutStyle,
  nickname,
  slogan,
  caughtSlugs,
  totalCount,
  onReady,
}: ShareCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const configRef = useRef<ShareCardConfig | null>(null)
  const drawIdRef = useRef(0)

  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const currentDrawId = ++drawIdRef.current

    // Only show full loading spinner if assets aren't cached yet
    if (!cachedSpriteSheet || !cachedSpriteMap) {
      setLoading(true)
    }

    try {
      if (!cachedSpriteSheet || !cachedSpriteMap) {
        const [sheet, mapData] = await Promise.all([
          loadImage("/images/pokemon-sprites.png"),
          fetch("/images/pokemon-sprites.json").then((r) => r.json()),
        ])
        cachedSpriteSheet = sheet
        cachedSpriteMap = mapData
      }

      // If a newer render was requested while we were fetching/processing, abort this one
      if (currentDrawId !== drawIdRef.current) return

      const config: ShareCardConfig = {
        orientation,
        layoutStyle,
        nickname,
        slogan,
        caughtSlugs,
        totalCount,
        spriteSheet: cachedSpriteSheet!,
        spriteMap: cachedSpriteMap!,
        dateString: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }

      configRef.current = config

      const containerWidth = canvas.parentElement?.clientWidth ?? 400
      await renderShareCardToPreview(config, canvas, containerWidth * 2)

      onReady?.(() => renderShareCard(config))
    } catch (err) {
      console.error("Failed to render share card:", err)
    } finally {
      if (currentDrawId === drawIdRef.current) {
        setLoading(false)
      }
    }
  }, [orientation, layoutStyle, nickname, slogan, caughtSlugs, totalCount, onReady])

  useEffect(() => {
    // Load Fredoka font before drawing
    const font = new FontFace("Fredoka", "url(https://fonts.gstatic.com/s/fredoka/v14/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3O8SL.woff2)", {
      weight: "700",
      style: "normal",
    })
    font.load().then((loaded) => {
      document.fonts.add(loaded)
      draw()
    }).catch(() => {
      draw()
    })
  }, [draw])

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg ${orientation === "portrait" ? "mx-auto max-h-[50vh]" : "w-full"}`}
        style={{ aspectRatio: orientation === "portrait" ? "1080/1920" : "2400/1260" }}
      />
    </div>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
