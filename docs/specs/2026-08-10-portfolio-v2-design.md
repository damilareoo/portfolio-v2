# Portfolio v2 — Design Spec

> Partially superseded by `2026-08-13-design-language.md`, which replaces the Structure and Build order sections below. The token system, typography, and stack here still stand.

Date: 2026-08-10
Replaces: damilareoo.xyz (portfolio-v1). New repo, new Vercel project. Old site stays live until v2 is ready.

## Direction

Pure monochrome, two-skin system modeled on the Monivoice reference values. Hierarchy comes from tonal value, weight, and size — never hue. Hairline borders separate surfaces instead of shadows. One typeface family (Suisse Int'l) with Suisse Int'l Mono for labels/meta.

References:
- Monivoice light/dark — the tonal value ladder, inverted strong-fill buttons in dark mode, hairline separation, pill badges.
- Jordan Jenkins interactive portfolio — cascading strip of small interactive project tiles for featured work.
- Body — calm deep-dive case study layout, reserved for selected projects.

## Token system

Semantic tokens only; components never reference raw hex. Two skins swap the variables.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #F4F4F4 | #0A0A0A | Page canvas |
| `--surface` | #FFFFFF | #141414 | Cards, panels |
| `--surface-2` | #F7F7F7 | #1C1C1C | Nested fills (inputs, inactive tabs) |
| `--border` | #E9E9E9 | #262626 | Hairlines |
| `--text-1` | #111111 | #F5F5F5 | Primary text |
| `--text-2` | #6F6F6F | #8A8A8A | Secondary text |
| `--text-3` | #B0B0B0 | #4D4D4D | Tertiary / placeholders / skeletons |
| `--fill-strong` | #111111 | #F5F5F5 | Primary buttons (inverts in dark) |
| `--on-strong` | #FFFFFF | #111111 | Text on strong fill |

Rules carried from the reference:
- Dark mode inverts the strong fill (light pill button, dark label).
- `--bg` is never pure white / pure black-adjacent surfaces are lifted, not gray mush.
- Skeleton/ghost content sits at `--text-3` so hierarchy reads even when empty.

## Stack

Next.js (App Router) + Tailwind v4 + TypeScript + next-themes (class strategy). Suisse Int'l via `next/font/local` (woff2, subsetted from local family). Hosted on Vercel, repo `damilareoo/portfolio-v2`.

## Structure

- `/` — top bar (wordmark pill + theme toggle), oversized-name hero, Jenkins-style featured strip, compact project list, about, footer with Spotify now-playing.
- `/work/[slug]` — Body-style case study pages, only for deep-dive projects.

## Typography

Suisse Int'l: Light 300, Regular 400, Book 450, Medium 500, Bold 700. Suisse Int'l Mono for eyebrows, badges, meta. One display moment: the name in the hero at oversized scale.

## Easter egg (deferred — own design pass)

DialKit-style hidden panel tuning real site tokens, integrated with Spotify now-playing. Concept to be chosen later; token system above is built so live tuning is trivial (everything is CSS variables).

## Build order

1. Foundation: scaffold, tokens, Suisse, theme toggle, specimen home skeleton, deploy.
2. Home sections (hero, featured strip, list, about, footer).
3. Case study template.
4. Easter egg.
5. Interactions & polish.
