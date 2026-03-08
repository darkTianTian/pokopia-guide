interface QuantitySvgProps {
  count: number
  className?: string
}

/**
 * Renders "×N" as an SVG image instead of text, so search engines
 * don't index repeated "x1/x2/x4" tokens in keyword density.
 */
export function QuantityDots({ count, className }: QuantitySvgProps) {
  if (count <= 0) return null

  const label = `× ${count}`
  // Approximate width: × is ~8px, each digit ~7px, plus padding
  const textWidth = 8 + String(count).length * 7
  const width = textWidth + 4
  const height = 16

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      role="img"
      className={className}
    >
      <text
        x={width / 2}
        y="12"
        textAnchor="middle"
        fontSize="12"
        fontWeight="500"
        className="fill-muted-foreground/70"
      >
        {label}
      </text>
    </svg>
  )
}
