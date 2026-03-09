import { drawSwitchIcon, drawColoredLogo } from "./share-card-logo"

export interface ShareCardConfig {
  orientation: "portrait" | "landscape"
  nickname: string
  caughtSlugs: string[]
  totalCount: number
  spriteSheet: HTMLImageElement
  spriteMap: Record<string, { x: number; y: number }>
  dateString: string
}

const SPRITE_SIZE = 96
const TEXT_PRIMARY = "#ffffff"
const TEXT_SECONDARY = "rgba(255, 255, 255, 0.7)"
const EMERALD = "#34d399" // emerald-400
const EMERALD_BG = "rgba(52, 211, 153, 0.2)"

function drawGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Dark base
  ctx.fillStyle = "#0f172a"
  ctx.fillRect(0, 0, w, h)

  // Logo six colors as soft diagonal gradient overlay
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, "rgba(56, 189, 248, 0.25)")    // blue
  grad.addColorStop(0.2, "rgba(74, 222, 128, 0.2)")   // green
  grad.addColorStop(0.4, "rgba(251, 191, 36, 0.18)")  // yellow
  grad.addColorStop(0.6, "rgba(251, 146, 60, 0.2)")   // orange
  grad.addColorStop(0.8, "rgba(244, 114, 182, 0.22)") // pink
  grad.addColorStop(1, "rgba(192, 132, 252, 0.25)")   // purple

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function drawProgressRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  percentage: number,
  strokeWidth: number
) {
  // Background ring
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = EMERALD_BG
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  // Progress arc
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + (percentage / 100) * Math.PI * 2

  ctx.beginPath()
  ctx.arc(cx, cy, radius, startAngle, endAngle)
  ctx.strokeStyle = EMERALD
  ctx.lineWidth = strokeWidth
  ctx.lineCap = "round"
  ctx.stroke()

  // Percentage text
  ctx.fillStyle = EMERALD
  ctx.font = `700 ${radius * 0.7}px Fredoka, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${percentage}%`, cx, cy - radius * 0.1)

  // Reset text align
  ctx.textAlign = "start"
}

function drawPokemonGrid(
  ctx: CanvasRenderingContext2D,
  config: ShareCardConfig,
  startX: number,
  startY: number,
  gridWidth: number,
  gridHeight: number
) {
  const { caughtSlugs, spriteSheet, spriteMap } = config
  const cellSize = 72
  const cols = Math.floor(gridWidth / cellSize)
  const maxRows = Math.floor(gridHeight / cellSize)
  const maxVisible = cols * maxRows

  const slugsToShow = caughtSlugs.slice(0, maxVisible)
  const totalPadX = (gridWidth - cols * cellSize) / 2
  const totalPadY = (gridHeight - Math.min(Math.ceil(slugsToShow.length / cols), maxRows) * cellSize) / 2

  for (let i = 0; i < slugsToShow.length; i++) {
    const slug = slugsToShow[i]
    const pos = spriteMap[slug]
    if (!pos) continue

    const col = i % cols
    const row = Math.floor(i / cols)
    if (row >= maxRows) break

    const dx = startX + totalPadX + col * cellSize + (cellSize - 64) / 2
    const dy = startY + totalPadY + row * cellSize + (cellSize - 64) / 2

    ctx.drawImage(
      spriteSheet,
      pos.x, pos.y, SPRITE_SIZE, SPRITE_SIZE,
      dx, dy, 64, 64
    )
  }
}

export async function renderShareCard(config: ShareCardConfig): Promise<Blob> {
  const isPortrait = config.orientation === "portrait"
  const W = isPortrait ? 1080 : 2400
  const H = isPortrait ? 1920 : 1260

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  drawGradientBg(ctx, W, H)

  const percentage = config.totalCount > 0
    ? Math.round((config.caughtSlugs.length / config.totalCount) * 100)
    : 0
  const countText = `${config.caughtSlugs.length}/${config.totalCount}`

  if (isPortrait) {
    drawPortrait(ctx, config, W, H, percentage, countText)
  } else {
    drawLandscape(ctx, config, W, H, percentage, countText)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      "image/png"
    )
  })
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  config: ShareCardConfig,
  W: number,
  H: number,
  percentage: number,
  countText: string
) {
  // ── Top: Logo + Nickname (~200px) ──
  const logoY = 80
  drawSwitchIcon(ctx, W / 2 - 180, logoY - 24, 48)
  drawColoredLogo(ctx, "Pokopia Guide", W / 2 - 125, logoY, 40)

  if (config.nickname) {
    ctx.fillStyle = TEXT_SECONDARY
    ctx.font = `600 32px Fredoka, sans-serif`
    ctx.textAlign = "center"
    ctx.fillText(config.nickname, W / 2, logoY + 70)
    ctx.textAlign = "start"
  }

  // ── Progress Ring (~250px) ──
  const ringCY = 340
  const ringRadius = 80
  drawProgressRing(ctx, W / 2, ringCY, ringRadius, percentage, 12)

  // Count text below ring
  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `600 28px Fredoka, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText(countText, W / 2, ringCY + ringRadius + 40)
  ctx.textAlign = "start"

  // ── Pokemon Grid ──
  const gridY = 480
  const gridH = H - gridY - 140
  drawPokemonGrid(ctx, config, 40, gridY, W - 80, gridH)

  // ── Bottom: Date + URL ──
  const bottomY = H - 100

  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `500 24px Fredoka, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText(config.dateString, W / 2, bottomY)

  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = `600 28px Fredoka, sans-serif`
  ctx.fillText("pokopiaguide.com", W / 2, bottomY + 40)
  ctx.textAlign = "start"
}

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  config: ShareCardConfig,
  W: number,
  H: number,
  percentage: number,
  countText: string
) {
  const LEFT_W = 600

  // Subtle separator line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(LEFT_W, 40)
  ctx.lineTo(LEFT_W, H - 40)
  ctx.stroke()

  // ── Left Column ──
  const colCX = LEFT_W / 2

  // Logo
  const logoY = 120
  drawSwitchIcon(ctx, colCX - 180, logoY - 24, 48)
  drawColoredLogo(ctx, "Pokopia Guide", colCX - 125, logoY, 40)

  // Nickname
  if (config.nickname) {
    ctx.fillStyle = TEXT_SECONDARY
    ctx.font = `600 32px Fredoka, sans-serif`
    ctx.textAlign = "center"
    ctx.fillText(config.nickname, colCX, logoY + 80)
    ctx.textAlign = "start"
  }

  // Progress ring
  const ringCY = 420
  const ringRadius = 100
  drawProgressRing(ctx, colCX, ringCY, ringRadius, percentage, 14)

  // Count text
  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `600 30px Fredoka, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText(countText, colCX, ringCY + ringRadius + 50)
  ctx.textAlign = "start"

  // Date + URL at bottom of left column
  const bottomY = H - 120

  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `500 22px Fredoka, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText(config.dateString, colCX, bottomY)

  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = `600 26px Fredoka, sans-serif`
  ctx.fillText("pokopiaguide.com", colCX, bottomY + 40)
  ctx.textAlign = "start"

  // ── Right Column: Pokemon Grid ──
  const rightX = LEFT_W + 20
  const rightW = W - LEFT_W - 40
  drawPokemonGrid(ctx, config, rightX, 30, rightW, H - 80)
}

export async function renderShareCardToPreview(
  config: ShareCardConfig,
  previewCanvas: HTMLCanvasElement,
  maxWidth: number
) {
  const isPortrait = config.orientation === "portrait"
  const W = isPortrait ? 1080 : 2400
  const H = isPortrait ? 1920 : 1260

  const scale = Math.min(maxWidth / W, 1)
  previewCanvas.width = W * scale
  previewCanvas.height = H * scale

  const ctx = previewCanvas.getContext("2d")!
  ctx.scale(scale, scale)

  drawGradientBg(ctx, W, H)

  const percentage = config.totalCount > 0
    ? Math.round((config.caughtSlugs.length / config.totalCount) * 100)
    : 0
  const countText = `${config.caughtSlugs.length}/${config.totalCount}`

  if (isPortrait) {
    drawPortrait(ctx, config, W, H, percentage, countText)
  } else {
    drawLandscape(ctx, config, W, H, percentage, countText)
  }
}
