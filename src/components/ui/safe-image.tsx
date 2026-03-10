"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

const FALLBACK_SIZES = [32, 64, 128, 512] as const

function getFallbackSrc(width: number | undefined): string {
  const w = typeof width === "number" ? width : 512
  const size = FALLBACK_SIZES.find((s) => s >= w) ?? 512
  return size === 512
    ? "/images/image-not-found.png"
    : `/images/image-not-found-${size}.png`
}

export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() =>
        setImgSrc(getFallbackSrc(props.width as number | undefined))
      }
    />
  )
}
