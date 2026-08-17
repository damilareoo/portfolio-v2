# Portfolio v2

Personal portfolio of Damilare Osofisan. Successor to [damilareoo.xyz](https://www.damilareoo.xyz), rebuilt from the ground up.

## Direction

Pure monochrome, two-skin system. Hierarchy comes from tonal value, weight, and size, never hue. Hairline borders separate surfaces instead of shadows. Set entirely in Suisse Int'l, with Suisse Int'l Mono for labels and meta.

The design language is **Handled**: every surface admits to being an object with weight, an edge you can take hold of, and a memory of where you left it. Four laws govern it, the last one load-bearing:

1. If it looks like an edge, it drags.
2. If it looks like a card, it lifts.
3. If it changes, it remembers.
4. Nothing moves unless touched, or arriving.

Law 4 is what lets monochrome restraint and playfulness coexist: the site is quiet in a screenshot and alive in use, and every motion on the page was caused by the visitor.

The "or arriving" clause is narrow and deliberate. An element may animate the first time it enters the viewport — once. It does not re-trigger when scrolled back to, because a reveal that fires twice is a performance rather than an arrival. Still forbidden: parallax, scroll-linked transforms, autoplay, ambient loops, and anything that keeps moving while the visitor is still. A page at rest holds no running animation.

Specs: `docs/specs/2026-08-17-v1-surfaces.md` (surfaces, motion law, case model), `docs/specs/2026-08-13-design-language.md` (language, feel) and `docs/specs/2026-08-10-portfolio-v2-design.md` (tokens, typography, stack).

## Surfaces

Four, and the nav names all four.

| Route | Holds |
|---|---|
| `/` | The argument — lockup, selected work, the dated work list |
| `/work` | The archive, tiered and filterable |
| `/feed` | The gallery |
| `/about` | The record about the person, and the colophon |

`/system` and `/changelog` stay live and stay out of the nav; the colophon links to both.

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
| Portfolio | `damilareoo` | The public face: the four surfaces. `NEXT_PUBLIC_SITE_MODE=portfolio` hides workshop chrome. |
| Workshop | `portfolio-v2` | The build log: the same site plus `/system` and `/changelog`. |

Deploy both with `scripts/deploy.sh`.

## Versioning

Every change ships with an entry in `data/changelog.ts`, rendered at `/changelog`. Each entry records the immutable Vercel deployment URL of that version, so every version of the site stays viewable forever. Versions are also tagged in git (`v0.1.0`, `v0.2.0`, ...).

## Artwork

Art is authored by hand and dropped in; nothing is generated.

```bash
# public/feed/2026-04-sylvan-marks.png   -> dated, titled "Sylvan marks"
# public/work/chessever/01-board.png     -> ordered by the numeric prefix
pnpm manifest
```

`scripts/manifest.mjs` reads intrinsic dimensions straight out of the PNG, JPEG, and WebP headers — no image dependency — and writes a typed `data/assets.generated.ts`. Dimensions ship with the manifest, so no frame ever causes layout shift.

Until art lands, a frame prints what is missing and the shape of the slot rather than collapsing. A case page with assets but no authored blocks falls back to one full frame per asset, in filename order.

## DialKit

The colophon's dial rail is not a preferences panel. Each control rewrites the design tokens the page is drawn from, live, and the choice persists across visits.

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

Selected work without written blocks says so plainly on its case page instead of padding — the site does not pretend to depth it lacks.

A case page is a sticky metadata rail beside a column of typed blocks:

| Block | Renders |
|---|---|
| `full` | One full-width frame |
| `pair` | Two frames side by side |
| `text` | A narrow prose break at a decision point |
| `quote` | A pulled line with optional attribution |

Blocks without a `src` consume the project's assets in filename order, so dropping files into `public/work/<slug>` fills a reel without editing data.

## The value field

The colophon carries one instrument beyond the dials. Its scatter plots eight named landmarks on **weight × contrast**; the cursor blends the nearest of them by inverse-distance weighting and writes the result into `--body-weight`, `--text-2`, `--text-3`, and `--border`. Click commits. The blend holds across client-side navigation and resets on refresh.

The blending is left to CSS — each token becomes a `color-mix()` against `var(--bg)` and `var(--text-1)` — so switching skin under a held blend re-derives the ladder for free.

## Counters

The site reports on itself with real data, so it is never identical twice.

| Counter | Source | Behaviour |
|---|---|---|
| Dials turned | Upstash Redis, shared by every visitor | Read once on mount; moves only when you turn a dial |
| Now playing | Spotify, refreshed every 30s | The halftone disc, bottom right |
| Build | `VERCEL_GIT_COMMIT_SHA` at build time | Version and short commit |

Law 4 governs all three: the dial count never polls and never climbs on its own, and the roll animation fires only for a turn the visitor caused.

Now-playing is the halftone disc. Album artwork is converted to grayscale and rendered as an ordered-dither dot field, which is what lets real artwork onto a site with no accent hue — dithering discards the colour rather than suppressing it, and what survives is the one thing the palette trades in. The cursor displaces the dots with distance falloff and they settle on a spring; the frame loop runs only while the pointer is inside or dots are still moving, then stops itself. Nothing playing is a normal answer: the dots flatten to an even grid.

Artwork is proxied through `/api/now-playing/art` so the canvas stays same-origin and `getImageData` keeps working. That route allowlists the Spotify CDN hosts — without it, it would be an open proxy.

Counters degrade rather than fail. With no store configured, `lib/counters.ts` returns null everywhere and the rail shows a local count labelled "by you". A counter that has never been read renders placeholder digits at `--text-3`, not a zero.

Environment: `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`), plus `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`. Both Vercel projects share one Redis store so the two faces show one number.

## Status

v1.0.0: the surface set is complete — Index, Work, Feed, and About, with the colophon, the halftone disc, and the value field.

Outstanding: `public/` is still empty, so every frame renders as a labelled placeholder until artwork is dropped in and `pnpm manifest` is run. `palette` is unpopulated on every `WorkItem`, so no value strips render yet. The handling layer from the 2026-08-13 spec — divider drag, tile reorder, reset — is still unbuilt.
