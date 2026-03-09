import { drawSwitchIcon, drawColoredLogo } from "./share-card-logo"

// --- Randomness Helpers for Class Photo ---
// Simple 32-bit integer hash for strings
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Stable pseudo-random number generator (0.0 to 1.0)
function getStableRandom(index: number, seed: number = 0) {
  const x = Math.sin(index * 13.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
// ------------------------------------------

export interface ShareCardConfig {
  orientation: "portrait" | "landscape"
  layoutStyle: "grid" | "class-photo"
  nickname: string
  slogan: string
  caughtSlugs: string[]
  totalCount: number
  spriteSheet: HTMLImageElement
  spriteMap: Record<string, { x: number; y: number }>
  dateString: string
}

export function getSloganKey(percentage: number): string {
  if (percentage >= 100) return "collection.shareCard.slogan100"
  if (percentage >= 90) return "collection.shareCard.slogan90"
  if (percentage >= 75) return "collection.shareCard.slogan75"
  if (percentage >= 50) return "collection.shareCard.slogan50"
  if (percentage >= 25) return "collection.shareCard.slogan25"
  if (percentage >= 10) return "collection.shareCard.slogan10"
  return "collection.shareCard.slogan0"
}

const SPRITE_SIZE = 96
const TEXT_PRIMARY = "#27272a" // zinc-800
const TEXT_SECONDARY = "#52525b" // zinc-600
const PROGRESS_BG = "rgba(0,0,0,0.05)"

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
function drawGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Light creamy base
  ctx.fillStyle = "#f8fafc"
  ctx.fillRect(0, 0, w, h)

  // Soft pastel gradients overlay
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, "rgba(167, 243, 208, 0.4)")    // emerald-200
  grad.addColorStop(0.3, "rgba(186, 230, 253, 0.4)")  // sky-200
  grad.addColorStop(0.7, "rgba(254, 215, 170, 0.3)")  // orange-200
  grad.addColorStop(1, "rgba(252, 165, 165, 0.3)")    // red-300

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Decorative blobs
  ctx.filter = "blur(80px)"
  ctx.fillStyle = "rgba(134, 239, 172, 0.4)" // green-300
  ctx.beginPath()
  ctx.arc(w * 0.2, h * 0.2, Math.max(w, h) * 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "rgba(147, 197, 253, 0.4)" // blue-300
  ctx.beginPath()
  ctx.arc(w * 0.8, h * 0.8, Math.max(w, h) * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.filter = "none"
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  strokeColor: string
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()

  ctx.fillStyle = fillColor
  ctx.fill()

  ctx.lineWidth = 4
  ctx.strokeStyle = strokeColor
  ctx.stroke()
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
  ctx.strokeStyle = PROGRESS_BG
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  // Progress arc
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + (percentage / 100) * Math.PI * 2

  // Gradient based on milestone
  let fromColor = "#f59e0b" // amber-500
  let toColor = "#ea580c"   // orange-600
  let textColor = "#d97706" // amber-600

  if (percentage === 100) {
    fromColor = "#10b981"
    toColor = "#f59e0b"
    textColor = "#059669" // emerald-600
  } else if (percentage >= 67) {
    fromColor = "#c026d3"
    toColor = "#8b5cf6"
    textColor = "#c026d3" // fuchsia-600
  } else if (percentage >= 34) {
    fromColor = "#06b6d4"
    toColor = "#3b82f6"
    textColor = "#0284c7" // light blue-600
  }

  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  grad.addColorStop(0, fromColor)
  grad.addColorStop(1, toColor)

  ctx.beginPath()
  ctx.arc(cx, cy, radius, startAngle, endAngle)
  ctx.strokeStyle = grad
  ctx.lineWidth = strokeWidth
  ctx.lineCap = "round"
  ctx.stroke()

  // Percentage text
  ctx.fillStyle = textColor
  ctx.font = `800 ${radius * 0.7}px Fredoka, ${FONT_STACK}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${percentage}%`, cx, cy - radius * 0.02)

  // Reset text align
  ctx.textAlign = "start"
}

function drawPokemonClassPhoto(
  ctx: CanvasRenderingContext2D,
  config: ShareCardConfig,
  startX: number,
  startY: number,
  boxWidth: number,
  boxHeight: number
) {
  const { caughtSlugs, spriteSheet, spriteMap } = config
  if (caughtSlugs.length === 0) return

  // Limit how many we actually try to draw so it doesn't get completely absurd
  const maxToDraw = Math.min(caughtSlugs.length, 300)
  const count = maxToDraw

  // Stable shuffle so the photo looks like a mixed crowd, but doesn't flicker on re-renders
  const slugsToShow = [...caughtSlugs.slice(0, maxToDraw)].sort((a, b) => {
    return getStableRandom(hashString(a), count) - getStableRandom(hashString(b), count);
  });

  // Dynamically calculate the maximum renderSize that fits the entire bounding box perfectly
  // using a binary search approach
  let low = 10;
  let high = Math.min(boxWidth, boxHeight) * 2;
  let bestSize = low;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const overlapX = mid * 0.65;
    const overlapY = mid * 0.6;

    let maxCols = Math.floor((boxWidth - mid) / overlapX) + 1;
    if (maxCols < 1) maxCols = 1;

    let totalItems = 0;
    let tempNumRows = 0;
    while (totalItems < count) {
      // Alternate row counts for automatic interlacing (e.g. 14, 13, 14, 13)
      // This allows rows to be perfectly centered independently while interlocking visually
      let rowCols = (tempNumRows % 2 === 0) ? maxCols : Math.max(1, maxCols - 1);
      if (count - totalItems < rowCols) {
        rowCols = count - totalItems;
      }
      totalItems += rowCols;
      tempNumRows++;
    }

    const totalHeight = mid + (tempNumRows - 1) * overlapY;

    if (totalHeight <= boxHeight) {
      bestSize = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  // Cap size so 1-5 pokemon don't get comically gigantic 
  const renderSize = Math.min(260, Math.floor(bestSize));
  const overlapX = renderSize * 0.65;
  const overlapY = renderSize * 0.6;

  // Re-run the layout math with the finalized size to get row arrays
  let maxCols = Math.floor((boxWidth - renderSize) / overlapX) + 1;
  if (maxCols < 1) maxCols = 1;

  const rowLayouts: number[] = [];
  let totalItemsLayout = 0;
  while (totalItemsLayout < count) {
    let rowCols = (rowLayouts.length % 2 === 0) ? maxCols : Math.max(1, maxCols - 1);
    if (count - totalItemsLayout < rowCols) {
      rowCols = count - totalItemsLayout;
    }
    rowLayouts.push(rowCols);
    totalItemsLayout += rowCols;
  }

  const numRows = rowLayouts.length;
  const totalGroupHeight = renderSize + (numRows - 1) * overlapY;

  // Vertical centering offset
  const offsetY = startY + Math.max(0, (boxHeight - totalGroupHeight) / 2);

  let i = 0;
  for (let row = 0; row < numRows; row++) {
    const itemsInThisRow = rowLayouts[row];

    // Calculate total width of JUST this row to center it horizontally perfectly.
    // Because we alternate maxCols and maxCols-1, the centers perfectly interlace without manual staggering!
    const rowWidth = renderSize + (itemsInThisRow - 1) * overlapX;
    const offsetX = startX + Math.max(0, (boxWidth - rowWidth) / 2);

    for (let col = 0; col < itemsInThisRow; col++) {
      const slug = slugsToShow[i];
      const pos = spriteMap[slug];

      if (!pos) {
        i++;
        continue;
      }

      // Calculate stable randomness for this specific slot
      const randX = (getStableRandom(i, 1) - 0.5) * (overlapX * 0.4);
      const randY = (getStableRandom(i, 2) - 0.5) * (overlapY * 0.4);
      const sizeMod = 0.85 + getStableRandom(i, 3) * 0.3; // 85% to 115% size
      const angleDeg = (getStableRandom(i, 4) - 0.5) * 16; // +/- 8 degrees

      const dx = offsetX + col * overlapX + randX;
      const dy = offsetY + row * overlapY + randY;
      const finalSize = renderSize * sizeMod;

      ctx.save();
      // Translate to the exact actual center of where the sprite should be drawn
      ctx.translate(dx + renderSize / 2, dy + renderSize / 2);
      ctx.rotate((angleDeg * Math.PI) / 180);

      ctx.drawImage(
        spriteSheet,
        pos.x, pos.y, SPRITE_SIZE, SPRITE_SIZE,
        -finalSize / 2, -finalSize / 2, finalSize, finalSize
      );

      ctx.restore();

      i++;
    }
  }
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
  const W = isPortrait ? 1080 : 1920
  const H = isPortrait ? 1920 : 1080

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  drawGradientBg(ctx, W, H)

  const percentage = config.totalCount > 0
    ? config.caughtSlugs.length === config.totalCount
      ? 100
      : Math.min(Math.round((config.caughtSlugs.length / config.totalCount) * 100), 99)
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
  const margin = 40
  const boxFill = "rgba(255, 255, 255, 0.6)" // Frosted glass look
  const boxStroke = "rgba(255, 255, 255, 0.8)"
  const boxRadius = 48

  // ── 1. Top: Logo + Nickname Box ──
  const headerY = margin
  const headerH = 280
  drawRoundedRect(ctx, margin, headerY, W - margin * 2, headerH, boxRadius, boxFill, boxStroke)

  const logoY = headerY + 80
  drawSwitchIcon(ctx, W / 2 - 180, logoY - 24, 48)
  drawColoredLogo(ctx, "Pokopia Guide", W / 2 - 125, logoY, 40)

  let subtitleY = logoY + 65

  if (config.nickname) {
    ctx.fillStyle = TEXT_PRIMARY
    ctx.font = `700 36px Fredoka, ${FONT_STACK}`
    ctx.textAlign = "center"
    ctx.fillText(config.nickname, W / 2, subtitleY)
    subtitleY += 50
  }

  if (config.slogan) {
    const sloganY = Math.max(subtitleY, logoY + 110)
    ctx.fillStyle = TEXT_SECONDARY
    ctx.font = `600 28px Fredoka, ${FONT_STACK}`
    ctx.textAlign = "center"
    ctx.fillText(config.slogan, W / 2, sloganY)
    ctx.textAlign = "start"
  }

  // ── 2. Progress Ring Box ──
  const ringBoxY = headerY + headerH + margin
  const ringBoxH = 340
  drawRoundedRect(ctx, margin, ringBoxY, W - margin * 2, ringBoxH, boxRadius, boxFill, boxStroke)

  const ringCY = ringBoxY + 150
  const ringRadius = 100
  drawProgressRing(ctx, W / 2, ringCY, ringRadius, percentage, 24)

  // Count text below ring
  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `700 32px Fredoka, ${FONT_STACK}`
  ctx.textAlign = "center"
  ctx.fillText(countText, W / 2, ringCY + ringRadius + 50)
  ctx.textAlign = "start"

  // ── 3. Pokemon Grid Box ──
  const gridBoxY = ringBoxY + ringBoxH + margin
  const gridBoxH = H - gridBoxY - margin - 80 // Leave space for footer
  drawRoundedRect(ctx, margin, gridBoxY, W - margin * 2, gridBoxH, boxRadius, boxFill, boxStroke)

  if (config.layoutStyle === "grid") {
    drawPokemonGrid(ctx, config, margin + 20, gridBoxY + 20, W - margin * 2 - 40, gridBoxH - 40)
  } else {
    drawPokemonClassPhoto(ctx, config, margin + 20, gridBoxY + 20, W - margin * 2 - 40, gridBoxH - 40)
  }

  // ── 4. Footer: Date + URL ──
  const footerY = H - margin - 15

  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `600 26px Fredoka, ${FONT_STACK}`
  ctx.fillText(config.dateString, margin + 20, footerY)

  ctx.textAlign = "right"
  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = `700 30px Fredoka, ${FONT_STACK}`
  ctx.fillText("pokopiaguide.com", W - margin - 20, footerY)
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
  const margin = 40
  const boxFill = "rgba(255, 255, 255, 0.6)"
  const boxStroke = "rgba(255, 255, 255, 0.8)"
  const boxRadius = 48
  const leftW = 680

  // ── 1. Left Column: Header Box ──
  const headerY = margin
  const headerH = 300
  drawRoundedRect(ctx, margin, headerY, leftW, headerH, boxRadius, boxFill, boxStroke)

  const colCX = margin + leftW / 2
  const logoY = headerY + 100
  drawSwitchIcon(ctx, colCX - 180, logoY - 24, 48)
  drawColoredLogo(ctx, "Pokopia Guide", colCX - 125, logoY, 40)

  let lSubtitleY = logoY + 70

  if (config.nickname) {
    ctx.fillStyle = TEXT_PRIMARY
    ctx.font = `700 36px Fredoka, ${FONT_STACK}`
    ctx.textAlign = "center"
    ctx.fillText(config.nickname, colCX, lSubtitleY)
    lSubtitleY += 50
  }

  if (config.slogan) {
    const sloganY = Math.max(lSubtitleY, logoY + 120)
    ctx.fillStyle = TEXT_SECONDARY
    ctx.font = `600 28px Fredoka, ${FONT_STACK}`
    ctx.textAlign = "center"
    ctx.fillText(config.slogan, colCX, sloganY)
    ctx.textAlign = "start"
  }

  // ── 2. Left Column: Progress Ring Box ──
  const ringBoxY = headerY + headerH + margin
  const ringBoxH = H - ringBoxY - margin - 80 // Leave space for footer
  drawRoundedRect(ctx, margin, ringBoxY, leftW, ringBoxH, boxRadius, boxFill, boxStroke)

  const ringCY = ringBoxY + (ringBoxH / 2) - 30
  const ringRadius = 120
  drawProgressRing(ctx, colCX, ringCY, ringRadius, percentage, 28)

  // Count text
  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `700 36px Fredoka, ${FONT_STACK}`
  ctx.textAlign = "center"
  ctx.fillText(countText, colCX, ringCY + ringRadius + 60)
  ctx.textAlign = "start"

  // ── 3. Right Column: Pokemon Grid Box ──
  const rightX = margin + leftW + margin
  const rightW = W - rightX - margin
  const gridBoxH = H - margin * 2 - 80
  drawRoundedRect(ctx, rightX, margin, rightW, gridBoxH, boxRadius, boxFill, boxStroke)

  if (config.layoutStyle === "grid") {
    drawPokemonGrid(ctx, config, rightX + 20, margin + 20, rightW - 40, gridBoxH - 40)
  } else {
    drawPokemonClassPhoto(ctx, config, rightX + 20, margin + 20, rightW - 40, gridBoxH - 40)
  }

  // ── 4. Footer: Date + URL ──
  const footerY = H - margin - 15

  ctx.fillStyle = TEXT_SECONDARY
  ctx.font = `600 26px Fredoka, ${FONT_STACK}`
  ctx.textAlign = "left"
  ctx.fillText(config.dateString, margin + 20, footerY)

  ctx.textAlign = "right"
  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = `700 30px Fredoka, ${FONT_STACK}`
  ctx.fillText("pokopiaguide.com", W - margin - 20, footerY)
  ctx.textAlign = "start"
}

export async function renderShareCardToPreview(
  config: ShareCardConfig,
  previewCanvas: HTMLCanvasElement,
  maxWidth: number
) {
  const isPortrait = config.orientation === "portrait"
  const W = isPortrait ? 1080 : 1920
  const H = isPortrait ? 1920 : 1080

  const scale = Math.min(maxWidth / W, 1)
  previewCanvas.width = W * scale
  previewCanvas.height = H * scale

  const ctx = previewCanvas.getContext("2d")!
  ctx.scale(scale, scale)

  drawGradientBg(ctx, W, H)

  const percentage = config.totalCount > 0
    ? config.caughtSlugs.length === config.totalCount
      ? 100
      : Math.min(Math.round((config.caughtSlugs.length / config.totalCount) * 100), 99)
    : 0
  const countText = `${config.caughtSlugs.length}/${config.totalCount}`

  if (isPortrait) {
    drawPortrait(ctx, config, W, H, percentage, countText)
  } else {
    drawLandscape(ctx, config, W, H, percentage, countText)
  }
}
