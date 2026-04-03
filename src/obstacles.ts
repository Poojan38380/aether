// Aether — Obstacle routing from fluid density
// Converts smoke density grid into blocked intervals per text line band.

export interface ObstacleInterval {
  left: number
  right: number
}

/** Carve available slots from a base interval by subtracting blocked intervals */
export function carveSlots(
  base: { left: number; right: number },
  blocked: ObstacleInterval[],
  minSlotWidth: number,
): { left: number; right: number }[] {
  let slots = [{ ...base }]

  for (let bi = 0; bi < blocked.length; bi++) {
    const iv = blocked[bi]
    const next: { left: number; right: number }[] = []
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si]
      if (iv.right <= s.left || iv.left >= s.right) {
        next.push(s)
        continue
      }
      if (iv.left > s.left) {
        next.push({ left: s.left, right: iv.left })
      }
      if (iv.right < s.right) {
        next.push({ left: iv.right, right: s.right })
      }
    }
    slots = next
  }

  return slots.filter(s => s.right - s.left >= minSlotWidth)
}

/** For a circular obstacle, compute the blocked horizontal interval at a given vertical band */
export function circleInterval(
  cx: number,
  cy: number,
  r: number,
  bandTop: number,
  bandBottom: number,
  hPad: number,
  vPad: number,
): ObstacleInterval | null {
  const top = bandTop - vPad
  const bottom = bandBottom + vPad
  if (top >= cy + r || bottom <= cy - r) return null

  const minDy = (cy >= top && cy <= bottom)
    ? 0
    : cy < top
      ? top - cy
      : cy - bottom

  if (minDy >= r) return null

  const maxDx = Math.sqrt(r * r - minDy * minDy)
  return { left: cx - maxDx - hPad, right: cx + maxDx + hPad }
}

/** Extract obstacle intervals from the density grid for a given row band.
 *  High-density columns become blocked intervals. */
export function densityToObstacles(
  density: Float32Array,
  cols: number,
  row: number,
  threshold: number,
  pixelX: number,
  _pixelY: number,
  _pixelColWidth: number,
  _pixelRowHeight: number,
): ObstacleInterval[] {
  const intervals: ObstacleInterval[] = []
  const r = Math.min(row, Math.floor(density.length / cols) - 1)
  if (r < 0) return intervals

  // Walk columns and find contiguous runs above threshold
  let inBlock = false
  let startCol = 0

  for (let c = 0; c < cols; c++) {
    const d = density[r * cols + c]
    if (d > threshold && !inBlock) {
      inBlock = true
      startCol = c
    } else if (d <= threshold && inBlock) {
      inBlock = false
      intervals.push({
        left: startCol * pixelColWidth + pixelX,
        right: c * pixelColWidth + pixelX,
      })
    }
  }
  if (inBlock) {
    intervals.push({
      left: startCol * pixelColWidth + pixelX,
      right: cols * pixelColWidth + pixelX,
    })
  }

  return intervals
}
