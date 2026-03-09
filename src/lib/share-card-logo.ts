export const LOGO_COLORS = [
  "#38bdf8", // light blue
  "#fb923c", // orange
  "#4ade80", // green
  "#c084fc", // purple
  "#f472b6", // pink
  "#fbbf24", // yellow
]

export function drawSwitchIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const scale = size / 24
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // Left Joycon (Cyan)
  ctx.fillStyle = "#00c3e3"
  ctx.beginPath()
  ctx.moveTo(8, 4)
  ctx.lineTo(6.5, 4)
  ctx.arc(6.5, 7.5, 3.5, -Math.PI / 2, -Math.PI, true)
  ctx.lineTo(3, 16.5)
  ctx.arc(6.5, 16.5, 3.5, Math.PI, Math.PI / 2, true)
  ctx.lineTo(8, 20)
  ctx.closePath()
  ctx.fill()

  // Left stick
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(6, 7, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Right Joycon (Red)
  ctx.fillStyle = "#ff4554"
  ctx.beginPath()
  ctx.moveTo(16, 4)
  ctx.lineTo(17.5, 4)
  ctx.arc(17.5, 7.5, 3.5, -Math.PI / 2, 0)
  ctx.lineTo(21, 16.5)
  ctx.arc(17.5, 16.5, 3.5, 0, Math.PI / 2)
  ctx.lineTo(16, 20)
  ctx.closePath()
  ctx.fill()

  // Right stick
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(18.5, 11.5, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Screen (Dark Gray)
  ctx.fillStyle = "#333333"
  ctx.fillRect(9, 4, 6, 16)

  ctx.restore()
}

export function drawColoredLogo(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number
) {
  ctx.font = `700 ${fontSize}px Fredoka, sans-serif`
  ctx.textBaseline = "middle"

  let colorIndex = 0
  let currentX = x

  for (const char of text) {
    if (char === " ") {
      currentX += fontSize * 0.3
      continue
    }

    const color = LOGO_COLORS[colorIndex % LOGO_COLORS.length]
    colorIndex++

    // Stroke (white outline)
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = fontSize * 0.15
    ctx.lineJoin = "round"
    ctx.strokeText(char, currentX, y)

    // Fill
    ctx.fillStyle = color
    ctx.fillText(char, currentX, y)

    currentX += ctx.measureText(char).width
  }

  return currentX - x // total width
}
