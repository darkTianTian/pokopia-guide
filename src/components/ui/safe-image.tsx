"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

const FALLBACK_SRC = "/images/image-not-found.png"

export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_SRC)}
    />
  )
}
