# Portfolio v2

Personal portfolio of Damilare Osofisan. Successor to [damilareoo.xyz](https://www.damilareoo.xyz), rebuilt from the ground up.

## Direction

Pure monochrome, two-skin system. Hierarchy comes from tonal value, weight, and size, never hue. Hairline borders separate surfaces instead of shadows. Set entirely in Suisse Int'l, with Suisse Int'l Mono for labels and meta.

Full design spec: `docs/specs/2026-08-10-portfolio-v2-design.md`

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
| Portfolio | `damilareoo` | The public face: split-layout home with profile and playground. `NEXT_PUBLIC_SITE_MODE=portfolio` hides workshop chrome. |
| Workshop | `portfolio-v2` | The build log: same home plus `/system` and `/changelog`. |

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

## Status

v0.4.0: three-rail home (profile record, playground, settings) with a working DialKit. Real playground artwork, case study pages, and the easter egg follow.
