// Aether — Character Palette
// Builds a palette of every character across weights/styles,
// measured for width (via pretext) and brightness (via offscreen canvas scan).

import { prepareWithSegments } from '@chenglou/pretext'

const FONT_SIZE = 15
const PROP_FAMILY = 'Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif'
const CHARSET = ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const WEIGHTS = [300, 500, 800]
const STYLES = ['normal', 'italic'] as const

const MEASURE_SIZE = 28
const measureCanvas = document.createElement('canvas')
measureCanvas.width = MEASURE_SIZE
measureCanvas.height = MEASURE_SIZE
const measureCtx = measureCanvas.getContext('2d', { willReadFrequently: true })!

export interface PaletteEntry {
  char: string
  weight: number
  style: 'normal' | 'italic'
  font: string
  width: number
  brightness: number
}

function estimateBrightness(ch: string, font: string): number {
  measureCtx.clearRect(0, 0, MEASURE_SIZE, MEASURE_SIZE)
  measureCtx.font = font
  measureCtx.fillStyle = '#fff'
  measureCtx.textAlign = 'left'
  measureCtx.textBaseline = 'middle'
  measureCtx.fillText(ch, 1, MEASURE_SIZE / 2)
  const data = measureCtx.getImageData(0, 0, MEASURE_SIZE, MEASURE_SIZE).data
  let sum = 0
  for (let i = 3; i < data.length; i += 4) {
    sum += data[i]
  }
  return sum / (255 * MEASURE_SIZE * MEASURE_SIZE)
}

/** Build the full character palette — called once at init */
export function buildPalette(): PaletteEntry[] {
  const entries: PaletteEntry[] = []

  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const font = `${style === 'italic' ? 'italic ' : ''}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`
      for (const ch of CHARSET) {
        if (ch === ' ') continue
        const prepared = prepareWithSegments(ch, font)
        const width = prepared.widths.length > 0 ? prepared.widths[0] : 0
        if (width <= 0) continue
        const brightness = estimateBrightness(ch, font)
        entries.push({ char: ch, weight, style, font, width, brightness })
      }
    }
  }

  // Normalize brightness
  const maxB = Math.max(...entries.map(e => e.brightness))
  if (maxB > 0) {
    for (const e of entries) e.brightness /= maxB
  }

  // Sort by brightness
  entries.sort((a, b) => a.brightness - b.brightness)

  return entries
}

const SPACE_WIDTH = FONT_SIZE * 0.27

/** Find the best-matching palette entry for a target brightness and width */
export function findBestMatch(
  palette: PaletteEntry[],
  targetBrightness: number,
  targetWidth: number,
): PaletteEntry {
  // Binary search on brightness
  let lo = 0
  let hi = palette.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (palette[mid].brightness < targetBrightness) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  // Search neighborhood for best combined score
  let bestScore = Infinity
  let best = palette[lo]
  const range = 15
  for (let i = Math.max(0, lo - range); i < Math.min(palette.length, lo + range); i++) {
    const p = palette[i]
    const bErr = Math.abs(p.brightness - targetBrightness) * 2.5
    const wErr = Math.abs(p.width - targetWidth) / targetWidth
    const score = bErr + wErr
    if (score < bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

export const palette = {
  spaceWidth: SPACE_WIDTH,
  fontSize: FONT_SIZE,
} as const
