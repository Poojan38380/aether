# Contributing to Aether

Thank you for your interest in contributing to Aether! This document provides guidelines and instructions for contributing.

## 🐛 Reporting Bugs

Found a bug? Please [open an issue](https://github.com/Poojan38380/aether/issues/new?template=bug_report.md) with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots (if applicable)
- Browser, OS, and device information

## 💡 Suggesting Enhancements

Have an idea? [Open a feature request](https://github.com/Poojan38380/aether/issues/new?template=feature_request.md) with:

- The problem your idea solves
- Your proposed solution
- Any alternatives you've considered
- How the feature fits into the project's scope

## 📝 Pull Requests

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/aether.git`
3. **Install dependencies:** `npm install`
4. **Create a branch:** `git checkout -b feat/your-feature-name`
5. **Develop** your changes
6. **Test** locally: `npm run dev` — verify in browser
7. **Build:** `npm run build` — must pass with zero errors
8. **Commit** using [Conventional Commits](#-conventional-commits)
9. **Push** and open a **Pull Request**

### ✅ Conventional Commits

Commit messages must follow this format:

```
type(scope): description

optional longer body
```

**Types:**

| Type | When to Use |
|------|-------------|
| `feat` | New feature or enhancement |
| `fix` | Bug fix |
| `docs` | Documentation-only changes |
| `style` | Code style changes (formatting, whitespace, no code logic) |
| `refactor` | Code refactoring (no behavior change) |
| `perf` | Performance improvements |
| `chore` | Build, config, tooling changes |
| `ci` | CI/CD configuration changes |

**Examples:**

```
feat(fluid): add shockwave density on click
fix(palette): cap brightness normalization at 1
docs(readme): add architecture diagram
refactor(main): extract smoke rendering to function
perf(fluid): reduce advect allocations
chore(deps): update vite to 6.0.1
```

**Scopes:** `fluid`, `palette`, `obstacles`, `main`, `readme`, `ci`, `deps`

### 🎨 Code Style

- **TypeScript strict mode** is enabled. No `any` unless absolutely necessary (add a `// FIXME` comment).
- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Line endings:** LF
- **Max line length:** 120 characters (soft limit)

#### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables, functions | `camelCase` | `mouseX`, `drawSmokeAscii` |
| Constants | `UPPER_SNAKE_CASE` | `BODY_TEXT`, `MAX_COLS` |
| Types, interfaces | `PascalCase` | `FluidSim`, `PaletteEntry` |
| Private/internal | Leading `_` (if needed) | `_tempBuffer` |
| Files | `kebab-case` or `camelCase` | `fluid.ts`, `palette.ts` |

#### Project-Specific Conventions

- Simulation state is held in plain interfaces (`FluidSim`, `PaletteEntry`), not classes.
- Render functions take `CanvasRenderingContext2D` as the first argument.
- Grid coordinates use `(col, row)` ordering; pixel coordinates use `(x, y)`.
- All DOM access is guarded (no server-side rendering expected, but be mindful).

## 🎯 What Contributions Are Welcome

Prioritized list of areas where help is most valued:

1. **Performance optimization** — Adaptive grid resolution, faster palette lookup
2. **Mobile experience** — Touch gesture refinements, responsive grid scaling
3. **Visual polish** — Color themes, smoother transitions, additional font support
4. **New interaction modes** — Draggable obstacles, configurable text content
5. **Accessibility** — Reduced motion support, keyboard navigation
6. **Testing** — Unit tests for simulation and layout logic
7. **Documentation** — Inline code comments, architecture diagrams, tutorials

## 📋 Before You Submit a PR

- [ ] `npm run build` passes with zero errors
- [ ] Changes work in latest Chrome, Firefox, and Safari
- [ ] No console errors or warnings
- [ ] Commit messages follow Conventional Commits
- [ ] Code follows the style guide above
- [ ] If adding a feature, it's documented in the README or code comments

## 📜 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 Project Plan

See the [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md) for the current project status and roadmap.

---

Thank you for contributing! 🎉
