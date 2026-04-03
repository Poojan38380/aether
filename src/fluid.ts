// Aether — Fluid Simulation
// Multi-frequency trigonometric velocity field, semi-Lagrangian advection,
// diffusion, and emitter-based density injection.

export interface EmitterDef {
  cx: number       // center x (fraction of grid)
  cy: number       // center y (fraction of grid)
  orbitR: number   // orbit radius (fraction)
  freq: number     // orbit frequency
  phase: number    // orbit phase offset
  strength: number // density injection strength
}

export interface FluidSim {
  cols: number
  rows: number
  density: Float32Array
  temp: Float32Array
  emitters: EmitterDef[]
  aspect: number   // charWidth / lineHeight
  time: number
}

function createDefaultEmitters(): EmitterDef[] {
  return [
    { cx: 0.25, cy: 0.4, orbitR: 0.14, freq: 0.3, phase: 0, strength: 0.18 },
    { cx: 0.7, cy: 0.35, orbitR: 0.10, freq: 0.25, phase: 2.1, strength: 0.15 },
    { cx: 0.45, cy: 0.65, orbitR: 0.16, freq: 0.35, phase: 4.2, strength: 0.20 },
    { cx: 0.8, cy: 0.6, orbitR: 0.08, freq: 0.4, phase: 1.0, strength: 0.14 },
  ]
}

export function createFluidSim(
  cols: number,
  rows: number,
  aspect: number,
  emitters?: EmitterDef[],
): FluidSim {
  return {
    cols,
    rows,
    density: new Float32Array(cols * rows),
    temp: new Float32Array(cols * rows),
    emitters: emitters ?? createDefaultEmitters(),
    aspect,
    time: 0,
  }
}

function getVel(sim: FluidSim, c: number, r: number, t: number): [number, number] {
  const nx = c / sim.cols
  const ny = r / sim.rows

  // Multi-frequency velocity field — layered trigonometric flow
  let vx = Math.sin(ny * 6.28 + t * 0.3) * 2
    + Math.cos((nx + ny) * 12.5 + t * 0.55) * 0.7
    + Math.sin(nx * 25 + ny * 18 + t * 0.8) * 0.25

  let vy = Math.cos(nx * 5 + t * 0.4) * 1.5
    + Math.sin((nx - ny) * 10 + t * 0.4) * 0.8
    + Math.cos(nx * 18 - ny * 25 + t * 0.7) * 0.25

  vy *= sim.aspect
  return [vx, vy]
}

/** Semi-Lagrangian advection step */
function advect(sim: FluidSim): void {
  for (let r = 0; r < sim.rows; r++) {
    for (let c = 0; c < sim.cols; c++) {
      const [vx, vy] = getVel(sim, c, r, sim.time)

      // Backtrace
      let sx = Math.max(0, Math.min(sim.cols - 1.001, c - vx))
      let sy = Math.max(0, Math.min(sim.rows - 1.001, r - vy))

      const x0 = sx | 0
      const y0 = sy | 0
      const x1 = Math.min(x0 + 1, sim.cols - 1)
      const y1 = Math.min(y0 + 1, sim.rows - 1)
      const fx = sx - x0
      const fy = sy - y0

      // Bilinear interpolation
      const i00 = y0 * sim.cols + x0
      const i10 = y0 * sim.cols + x1
      const i01 = y1 * sim.cols + x0
      const i11 = y1 * sim.cols + x1

      sim.temp[r * sim.cols + c] =
        sim.density[i00] * (1 - fx) * (1 - fy) +
        sim.density[i10] * fx * (1 - fy) +
        sim.density[i01] * (1 - fx) * fy +
        sim.density[i11] * fx * fy
    }
  }

  // Swap
  const tmp = sim.density
  sim.density = sim.temp
  sim.temp = tmp
}

/** Diffusion step with aspect-ratio-corrected neighbors */
function diffuse(sim: FluidSim): void {
  const a2 = sim.aspect * sim.aspect
  for (let r = 1; r < sim.rows - 1; r++) {
    for (let c = 1; c < sim.cols - 1; c++) {
      const i = r * sim.cols + c
      const avg = (
        sim.density[i - 1] +
        sim.density[i + 1] +
        (sim.density[i - sim.cols] + sim.density[i + sim.cols]) * a2
      ) / (2 + 2 * a2)
      sim.temp[i] = sim.density[i] * 0.92 + avg * 0.08
    }
  }

  // Swap
  const tmp = sim.density
  sim.density = sim.temp
  sim.temp = tmp
}

/** Inject density from emitters */
function emit(sim: FluidSim): void {
  const spread = 4
  for (const e of sim.emitters) {
    const ex = (e.cx + Math.cos(sim.time * e.freq + e.phase) * e.orbitR) * sim.cols
    const ey = (e.cy + Math.sin(sim.time * e.freq * 0.7 + e.phase) * e.orbitR * 0.8) * sim.rows
    const ec = ex | 0
    const er = ey | 0

    for (let dr = -spread; dr <= spread; dr++) {
      for (let dc = -spread; dc <= spread; dc++) {
        const rr = er + dr
        const cc = ec + dc
        if (rr >= 0 && rr < sim.rows && cc >= 0 && cc < sim.cols) {
          const drScaled = dr / sim.aspect
          const dist = Math.sqrt(drScaled * drScaled + dc * dc)
          const s = Math.max(0, 1 - dist / (spread + 1))
          const idx = rr * sim.cols + cc
          sim.density[idx] = Math.min(1, sim.density[idx] + s * e.strength)
        }
      }
    }
  }
}

/** Add density at a grid position (for mouse interaction) */
export function addDensity(sim: FluidSim, col: number, row: number, radius: number, amount: number): void {
  const r = Math.round(radius)
  for (let dr = -r; dr <= r; dr++) {
    for (let dc = -r; dc <= r; dc++) {
      const rr = row + dr
      const cc = col + dc
      if (rr >= 0 && rr < sim.rows && cc >= 0 && cc < sim.cols) {
        const dist = Math.sqrt(dr * dr + dc * dc)
        if (dist < radius) {
          const s = 1 - dist / radius
          const idx = rr * sim.cols + cc
          sim.density[idx] = Math.min(1, sim.density[idx] + s * amount)
        }
      }
    }
  }
}

/** Create a shockwave ring of density */
export function shockwave(sim: FluidSim, col: number, row: number, radius: number, amount: number): void {
  const thickness = 3
  const steps = Math.max(16, Math.round(radius * 2 * Math.PI))
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const c = col + Math.cos(angle) * radius
    const r = row + Math.sin(angle) * radius
    for (let dr = -thickness; dr <= thickness; dr++) {
      for (let dc = -thickness; dc <= thickness; dc++) {
        const rr = Math.round(r) + dr
        const cc = Math.round(c) + dc
        if (rr >= 0 && rr < sim.rows && cc >= 0 && cc < sim.cols) {
          const idx = rr * sim.cols + cc
          sim.density[idx] = Math.min(1, sim.density[idx] + amount)
        }
      }
    }
  }
}

/** Run one simulation step */
export function stepSim(sim: FluidSim, time: number): void {
  sim.time = time
  advect(sim)
  diffuse(sim)
  emit(sim)
  // Decay
  for (let i = 0; i < sim.cols * sim.rows; i++) {
    sim.density[i] *= 0.984
  }
}
