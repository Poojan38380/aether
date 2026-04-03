// Aether — Main entry point
// Fluid smoke simulation driving real pretext text layout on Canvas 2D.

import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'
import { buildPalette, findBestMatch, type PaletteEntry, palette as pal } from './palette'
import { createFluidSim, stepSim, addDensity, shockwave, type FluidSim } from './fluid'
import { carveSlots, type ObstacleInterval } from './obstacles'

// --- Configuration ---

const BODY_TEXT =
  'The web renders text through a pipeline designed thirty years ago for static documents. ' +
  'A browser loads a font, shapes the text into glyphs, measures their combined width, ' +
  'determines where lines break, and positions each line vertically. Every step depends ' +
  'on the previous one. Every step requires the rendering engine to consult its internal ' +
  'layout tree — a structure so expensive to maintain that browsers guard access to it ' +
  'behind synchronous reflow barriers.\n\n' +
  'What if text measurement did not require the DOM at all? What if you could compute ' +
  'exactly where every line of text would break, exactly how wide each line would be, ' +
  'and exactly how tall the entire text block would be, using nothing but arithmetic?\n\n' +
  'This is the core insight of pretext. The browser canvas API includes a measureText ' +
  'method that returns the width of any string in any font without triggering a layout ' +
  'reflow. Canvas measurement uses the same font engine as DOM rendering — the results ' +
  'are identical. But because it operates outside the layout tree, it carries no reflow ' +
  'penalty.\n\n' +
  'With instant text measurement, an entire class of previously impractical interfaces ' +
  'becomes trivial. Text can flow around arbitrary shapes. Obstacles can move, animate, ' +
  'or be dragged by the user, and the text reflows instantly. The text that sat in boxes ' +
  'begins to flow.\n\n' +
  'Move your mouse to create smoke. Click to send a shockwave through the field. ' +
  'Watch the text find its way around the vapor.'

const BODY_FONT = '17px Georgia'
const BODY_LINE_HEIGHT = 24
const ASCII_LINE_HEIGHT = 17
const DENSITY_THRESHOLD = 0.06
const MIN_SLOT_WIDTH = 40
const SMOKE_ALPHA = 0.55
const TEXT_ALPHA = 0.75
const MARGIN_X_RATIO = 0.06
const MAX_COLS = 250
const MAX_ROWS = 100

// --- State ---

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const loadingEl = document.getElementById('loading') as HTMLDivElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1

let W = window.innerWidth
let H = window.innerHeight
let COLS = 0
let ROWS = 0
let sim: FluidSim
let palette: PaletteEntry[]
let aspect: number
let preparedBody: ReturnType<typeof prepareWithSegments>

// Mouse
let mouseX = W / 2
let mouseY = H / 2
let mouseDown = false
let mouseJustClicked = false

// FPS
let frameCount = 0
let lastFpsTime = 0
let displayFps = 0

function resize(): void {
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  COLS = Math.min(MAX_COLS, Math.floor(W / 7))
  ROWS = Math.min(MAX_ROWS, Math.floor(H / ASCII_LINE_HEIGHT))

  // Preserve existing density if resizing
  const oldDensity = sim ? sim.density : null
  const oldCols = sim ? sim.cols : 0
  const oldRows = sim ? sim.rows : 0

  sim = createFluidSim(COLS, ROWS, aspect)

  if (oldDensity && oldCols > 0 && oldRows > 0) {
    // Scale old density into new grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sr = Math.floor((r / ROWS) * oldRows)
        const sc = Math.floor((c / COLS) * oldCols)
        if (sr < oldRows && sc < oldCols) {
          sim.density[r * COLS + c] = oldDensity[sr * oldCols + sc]
        }
      }
    }
  }
}

async function main(): Promise<void> {
  await document.fonts.ready

  palette = buildPalette()
  aspect = pal.spaceWidth / ASCII_LINE_HEIGHT
  preparedBody = prepareWithSegments(BODY_TEXT, BODY_FONT)

  resize()
  window.addEventListener('resize', resize)

  // Input
  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  }, { passive: true })

  canvas.addEventListener('mousedown', () => {
    mouseDown = true
    mouseJustClicked = true
  })

  window.addEventListener('mouseup', () => {
    mouseDown = false
  })

  // Touch
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const t = e.touches[0]
    mouseX = t.clientX
    mouseY = t.clientY
  }, { passive: false })

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    mouseX = t.clientX
    mouseY = t.clientY
    mouseDown = true
    mouseJustClicked = true
  })

  canvas.addEventListener('touchend', () => {
    mouseDown = false
  })

  loadingEl.classList.add('hidden')

  function frame(now: number): void {
    const time = now / 1000

    // FPS
    frameCount++
    if (now - lastFpsTime > 500) {
      displayFps = Math.round(frameCount / ((now - lastFpsTime) / 1000))
      frameCount = 0
      lastFpsTime = now
    }

    // Mouse interaction with fluid
    if (mouseDown && mouseJustClicked) {
      // Shockwave
      const col = Math.floor(mouseX / W * COLS)
      const row = Math.floor(mouseY / H * ROWS)
      shockwave(sim, col, row, 6, 0.6)
    }

    if (mouseDown) {
      // Add density along mouse path
      const col = Math.floor(mouseX / W * COLS)
      const row = Math.floor(mouseY / H * ROWS)
      addDensity(sim, col, row, 4, 0.12)
    }

    // Step fluid simulation
    stepSim(sim, time)

    // Clear
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#06060a'
    ctx.fillRect(0, 0, W, H)

    // Draw smoke as ASCII on canvas
    drawSmokeAscii(ctx, sim)

    // Draw body text flowing around smoke
    drawTextAroundSmoke(ctx, sim, preparedBody)

    // Draw FPS
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${COLS}×${ROWS} | ${palette.length} variants | ${displayFps} fps`, 8, H - 6)
    ctx.globalAlpha = 1

    mouseJustClicked = false

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

// --- Render: ASCII smoke on canvas ---

function drawSmokeAscii(ctx: CanvasRenderingContext2D, sim: FluidSim): void {
  const cellW = W / COLS
  const cellH = ASCII_LINE_HEIGHT

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  for (let r = 0; r < ROWS; r++) {
    const y = r * cellH + cellH

    for (let c = 0; c < COLS; c++) {
      const density = sim.density[r * COLS + c]
      if (density < 0.015) continue

      const entry = findBestMatch(palette, density, cellW)
      const alpha = Math.min(1, density * 2.5) * SMOKE_ALPHA

      // Color: warm gold, interpolated by density
      const warm = Math.min(1, density * 1.5)
      const red = Math.round(196 + (255 - 196) * warm * 0.3)
      const green = Math.round(163 - 40 * warm)
      const blue = Math.round(90 - 60 * warm)

      ctx.globalAlpha = alpha
      ctx.fillStyle = `rgb(${red},${green},${blue})`
      ctx.font = entry.font
      ctx.fillText(entry.char, c * cellW, y)
    }
  }
  ctx.globalAlpha = 1
}

// --- Render: Body text flowing around smoke ---

function drawTextAroundSmoke(
  ctx: CanvasRenderingContext2D,
  sim: FluidSim,
  prepared: ReturnType<typeof prepareWithSegments>,
): void {
  const marginX = W * MARGIN_X_RATIO
  const contentWidth = W - marginX * 2
  const colCount = contentWidth > 700 ? 2 : 1
  const colGap = 40
  const colWidth = (contentWidth - (colCount - 1) * colGap) / colCount

  const headlineH = 60
  const startY = headlineH + 20
  const maxY = H - 40

  const cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  let y = startY
  while (y < maxY) {
    for (let col = 0; col < colCount; col++) {
      const colX = marginX + col * (colWidth + colGap)

      // Get blocked intervals from smoke density for this row
      const gridRow = Math.floor((y / H) * ROWS)
      const blocked: ObstacleInterval[] = []

      if (gridRow >= 0 && gridRow < ROWS) {
        blocked.push(...densityToBlockedIntervals(
          sim.density, sim.cols, gridRow,
          DENSITY_THRESHOLD, colX, y, colWidth, BODY_LINE_HEIGHT,
        ))
      }

      // Also add the headline as a rectangle obstacle
      blocked.push({ left: colX, right: colX + colWidth }) // will be carved by actual headline below

      // Carve available slots
      const slots = carveSlots(
        { left: colX, right: colX + colWidth },
        blocked,
        MIN_SLOT_WIDTH,
      )

      if (slots.length === 0) continue

      // Use the widest available slot
      slots.sort((a, b) => (b.right - b.left) - (a.right - a.left))
      const bestSlot = slots[0]
      const availWidth = bestSlot.right - bestSlot.left

      if (availWidth < 30) continue

      const line = layoutNextLine(prepared, cursor, availWidth)
      if (line === null) return

      ctx.globalAlpha = TEXT_ALPHA
      ctx.fillStyle = '#d4c8a0'
      ctx.font = BODY_FONT
      ctx.fillText(line.text, bestSlot.left, y + BODY_LINE_HEIGHT * 0.75)
    }

    y += BODY_LINE_HEIGHT
  }
  ctx.globalAlpha = 1
}

/** Convert a density row into blocked intervals for a text band */
function densityToBlockedIntervals(
  density: Float32Array,
  cols: number,
  row: number,
  threshold: number,
  pixelX: number,
  _pixelY: number,
  bandWidth: number,
  _bandHeight: number,
): ObstacleInterval[] {
  const intervals: ObstacleInterval[] = []

  if (row < 0 || row >= Math.floor(density.length / cols)) return intervals

  const actualCellW = (pixelX + bandWidth) / cols

  let inBlock = false
  let startCol = 0

  for (let c = 0; c < cols; c++) {
    const d = density[row * cols + c]
    if (d > threshold && !inBlock) {
      inBlock = true
      startCol = c
    } else if (d <= threshold && inBlock) {
      inBlock = false
      intervals.push({
        left: pixelX + startCol * actualCellW,
        right: pixelX + c * actualCellW,
      })
    }
  }
  if (inBlock) {
    intervals.push({
      left: pixelX + startCol * actualCellW,
      right: pixelX + cols * actualCellW,
    })
  }

  return intervals
}

main().catch((err) => {
  console.error('Aether failed:', err)
  loadingEl.innerHTML = `<span style="color:#f55">Failed: ${err.message}</span>`
})
