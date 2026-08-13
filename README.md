# Portfolio v2

Personal portfolio of Damilare Osofisan. Successor to [damilareoo.xyz](https://www.damilareoo.xyz), rebuilt from the ground up.

## Direction

Pure monochrome, two-skin system. Hierarchy comes from tonal value, weight, and size, never hue. Hairline borders separate surfaces instead of shadows. Set entirely in Suisse Int'l, with Suisse Int'l Mono for labels and meta.

The design language is **Handled**: every surface admits to being an object with weight, an edge you can take hold of, and a memory of where you left it. Four laws govern it, the last one load-bearing:

1. If it looks like an edge, it drags.
2. If it looks like a card, it lifts.
3. If it changes, it remembers.
4. Nothing moves unless touched — no ambient motion, no autoplay, no scroll-triggered reveals.

Law 4 is what lets monochrome restraint and playfulness coexist: the site is quiet in a screenshot and alive in use, and every motion on the page was caused by the visitor.

Specs: `docs/specs/2026-08-13-design-language.md` (language, structure, feel) and `docs/specs/2026-08-10-portfolio-v2-design.md` (tokens, typography, stack).

## Token system

Semantic tokens only. Components never reference raw hex values; light and dark are variable swaps.

| Token | Light | Dark |
|---|---|---|
| `--bg` | #F4F4F4 | #0A0A0A |
| `--surface` | #FFFFFF | #141414 |
| `--surface-2` | #F7F7F7 | #1C1C1C |
| `--border` | #E9E9E9 | #262626 |
| `--text-1` | #111111 | #F5F5F5 |
| `--text-2` | #6F6F6F | #8A8A8A |
| `--text-3` | #B0B0B0 | #4D4D4D |
| `--fill-strong` | #111111 | #F5F5F5 |

Dark mode inverts the strong fill: primary buttons become light pills with dark labels.

## Stack

| Tool | Purpose |
|---|---|
| Next.js (App Router) | Framework and routing |
| Tailwind CSS v4 | Styling via CSS variable tokens |
| TypeScript | Type safety |
| next-themes | Light and dark mode switching |
| Vercel | Hosting and deployment |

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Two links, one codebase

| Deployment | Vercel project | Purpose |
|---|---|---|
| Portfolio | `damilareoo` | The public face: three-rail home, `/work` archive, case pages. `NEXT_PUBLIC_SITE_MODE=portfolio` hides workshop chrome. |
| Workshop | `portfolio-v2` | The build log: the same site plus `/system` and `/changelog`. |

Deploy both with `scripts/deploy.sh`.

## Versioning

Every change ships with an entry in `data/changelog.ts`, rendered at `/changelog`. Each entry records the immutable Vercel deployment URL of that version, so every version of the site stays viewable forever. Versions are also tagged in git (`v0.1.0`, `v0.2.0`, ...).

## DialKit

The settings rail on the home page is not a preferences panel. Each control rewrites the design tokens the page is drawn from, live, and the choice persists across visits.

| Dial | Writes | Values |
|---|---|---|
| Theme | `.dark` class | Light, Dark, Auto |
| Type | `--type-scale` → root font size | 0.9, 1, 1.12 |
| Density | `--pg-gap`, `--pad`, `--radius-window`, `--radius-tile` | S, M, L |

Two rules keep it working: type sizes are always `rem` so the type dial reaches them, and spacing and radii read from dial tokens rather than fixed values. A pre-paint script in the document head applies saved values before first render, so nothing flashes at its default.

## Work model

One model in `data/work.ts`, tiered by how much room a piece earns.

| Tier | Gets | Lives |
|---|---|---|
| `selected` | A `/work/[slug]` case page and room on the home rail | Home centre rail and `/work` |
| `project` | Tile plus one line, links out to the live thing | `/work` |
| `index` | Text only: title, tags, year | `/work` |

Selected work without written sections says so plainly on its case page instead of padding — the site does not pretend to depth it lacks.

## Status

v0.5.0: work tiering, a `/work` archive with discipline filters, and case pages. Next: living counters (global dial count on Upstash, Spotify now-playing, build honesty), then the handling layer — divider drag, tile reorder, reset — then the mobile pass.
