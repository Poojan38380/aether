# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-08

### Added

#### Fluid Simulation
- Multi-frequency trigonometric velocity field with layered sinusoidal flow
- Semi-Lagrangian advection with bilinear interpolation
- Aspect-ratio-corrected diffusion
- Four orbiting density emitters with configurable parameters
- Mouse-driven density injection (click and drag)
- Click-triggered shockwave rings
- Graceful density preservation on window resize

#### Rendering
- ASCII smoke rendering — density mapped to brightness-sorted character palette
- Automatic character palette building via pretext width measurement + offscreen canvas brightness scan
- 3 weights (300, 500, 800) × 2 styles (normal, italic) palette coverage
- Warm gold color gradient interpolated by density
- Device pixel ratio (DPR) scaling for crisp rendering on Retina displays

#### Text Layout
- Body text flowing around smoke using pretext `layoutNextLine`
- Real-time obstacle carving from density grid to blocked intervals
- Multi-column layout (2 columns when content width > 700px)
- Slot selection algorithm — widest available slot chosen per line

#### Interaction
- Mouse move and click/touch event handling
- Touch support for mobile/tablet (touchmove, touchstart, touchend)
- FPS counter and grid stats overlay

#### Infrastructure
- Vite 6 build configuration
- TypeScript strict mode
- Google Fonts integration (Inter, Playfair Display, Georgia)
- Loading screen with animated spinner
- Responsive canvas with automatic grid sizing (up to 250×100 cells)

### Tech Stack
- **TypeScript 5.6+** — Strict mode, ES modules
- **Vite 6** — Fast dev server, optimized production builds
- **@chenglou/pretext 0.0.4** — DOM-free text measurement and layout
- **Canvas 2D** — All rendering, no WebGL

### Performance
- Grid: up to 250 columns × 100 rows (25,000 cells)
- Target: 60 FPS on modern desktop hardware
- Palette: ~200 entries, binary search + neighborhood scoring
- Startup: < 2s including font loading and palette measurement
- Bundle: < 50 KB gzipped (excluding Google Fonts)

[Unreleased]: https://github.com/Poojan38380/aether/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Poojan38380/aether/releases/tag/v0.1.0
