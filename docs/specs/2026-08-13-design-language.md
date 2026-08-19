# Portfolio v2 — Design Language: *Handled*

Date: 2026-08-13
Status: approved direction
Supersedes: the "Structure" and "Build order" sections of `2026-08-10-portfolio-v2-design.md`. The token system, typography, and stack in that document stand unchanged.

## Why this document exists

The 2026-08-10 spec settled a *token system* — monochrome, Suisse Int'l, hairline separation — and a page structure that shipped code has since diverged from. It never settled a design language: the point of view that decides what this site is, rather than what colour it is.

v0.4.0 is correct and cold. It is a well-made monochrome grid with no argument and no human trace in it. This document fixes that.

## Scope

Locked and out of scope: the monochrome two-skin token system, Suisse Int'l + Suisse Mono, hairline separation, the shared primitives in `components/ui.tsx`. No accent hue enters the site.

Open and settled here: the archetype, the interaction language, the work hierarchy, and the site's self-reporting.

## The language

**Handled.** Every surface admits to being an object. It has weight, an edge you can take hold of, and a memory of where you left it. The visitor is handed the same controls used to build the site.

### Four laws

1. **If it looks like an edge, it drags.** The hairlines between rails are resize handles.
2. **If it looks like a card, it lifts.** Playground tiles pick up, reorder, and settle.
3. **If it changes, it remembers.** Layout persists across visits, as the DialKit already does.
4. **Nothing moves unless touched, arriving, or reporting.** No ambient motion, no autoplay, no parallax, no scroll-triggered reveals.

Law 4 is the language. Monochrome restraint and playfulness normally fight; stillness-until-touched lets them coexist. The site is quiet in a screenshot and alive in use, and every motion on the page was caused by the visitor — which is what makes it read as an instrument rather than a performance.

The "arriving" clause is narrow and deliberate. An element may animate the first time it enters the viewport — once. It does not re-trigger when scrolled back to, because a reveal that fires twice is a performance rather than an arrival.

The "reporting" clause is narrower still. An instrument displaying live external state may move to show that state changing — only an instrument, only while the state is actually live, and only within its own bounds. The playhead pulse is a track that is playing right now; the pedometer is a day that is still being walked. The motion is the reading, not decoration around it, and it stops when the reading does: nothing on the page may move to announce a value that is merely sitting there.

Still forbidden: parallax, scroll-linked transforms, autoplay, ambient loops, and anything that keeps moving while the visitor is still. A page at rest holds no running animation, and a page at rest with nothing playing holds none either.

### Governing corollary

**Structure is rigid, contents have weight.** Dividers track the pointer exactly, with no spring. Tiles have mass and settle. Structure that wobbles reads as broken; contents that wobble read as physical.

## What the reference set established

References: guglieri.com/work, rghv.ca, jkane.co, kostya.sh, kprkr.co/work.

1. **Labelled records, not compositions.** Label + value throughout. kprkr prints `Navigation / Last Updated / Filter`; kostya runs dotted leaders from role to dates; guglieri gives each project a title and category tags and nothing more. Metadata is the aesthetic.
2. **Hierarchy by room, never decoration.** guglieri tiers explicitly: Case studies (3), Personal projects (6), Recent work (15+). Importance is expressed as space and depth.
3. **The chrome is content.** kprkr prints `Last Updated — over 2 years ago` and offers Focus Mode; rghv states "CONTENT REORGANIZES ON RELOAD"; kostya shows reaction counts.
4. **Each has exactly one warm anomaly.** kostya's hanging polaroid, rghv's ASCII faces, jkane's cartoon avatar. One deliberate break in an otherwise cold system.
5. **Almost none of them are toys.** Across all five, kostya's swinging polaroid is the entire physical vocabulary. They are dense, still, labelled archives.

Point 5 relocated the play rather than removing it: in every reference the content stays a calm labelled record and the play lives in the chrome or in a single anomaly. Tile physics is therefore demoted — reorder stays, flinging and velocity-tilt are cut.

## Structure

The home stops trying to be the archive.

### Tiers

- **Selected (2–3)** — ChessEver and Sylvan are confirmed. Whether a third joins them is an open *content* decision, not a design one: it depends on what case study material exists, and the layout works at two or three. The only work with depth; each gets a `/work/[slug]` case page.
- **Projects (5–7)** — Hitman's Library, WorkBench, Pixel Soccer, damilare's-skills. Live things that link out. Tile plus one line.
- **Index (remainder)** — text only, title and tags, guglieri-style. No images, no room.

### Surfaces

- **`/`** — three rails, unchanged as a frame. The centre rail carries **Selected only**, with real room, instead of seven peers. The home becomes an argument and a route rather than a display case.
- **`/work`** — the archive, kprkr-modelled: filter list (`Product Design · Interaction · Identity · Build`), the three tiers as sections, honest `Last Updated`.
- **`/work/[slug]`** — Body-style case pages, calm, Selected only.

This also closes a structural hole: today every outbound path from the home leads off-site. A visitor cannot go further *into* the site, only away from it.

## The warm anomaly: living counters

The site reports on itself with real data and is never identical twice.

- **Global dial turns** — the keystone. "The dials have been turned 4,812 times." Fuses the toy and the counter: every visitor who plays leaves a trace the next visitor sees, and the DialKit stops being a solo instrument.
- **Spotify now-playing** — carried from portfolio-v1. Requires the v1 Spotify app credentials and refresh token; confirm these still exist before implementation.
- **Build honesty** — commit hash chip and a real `Last updated N days ago`, derived from Vercel git environment variables at build time. No runtime cost.
- **Local trace** — "you've turned the dials 12 times", from localStorage.

### Counter infrastructure

Upstash Redis. One integer for the global dial count, incremented through a single POST route handler, debounced client-side and rate-limited by IP. The free tier is far beyond what this needs. The same store later serves reaction counts if they are wanted.

The counter component reads through a typed interface so its backing store is swappable and testable without network access.

## Feel

- **Dividers — rigid.** 1:1 pointer tracking. No easing, no spring, no overshoot. Range-clamped to minimum rail widths; double-click resets a divider.
- **Tiles — weight.** Lift 120ms ease-out, scale 1.015, border to `--ink-3`. Settle on a spring, stiffness 400, damping 32, roughly 250ms perceived. No velocity tilt, no fling.
- **Counters — roll, never spin.** Digits roll 180ms on change. No spinners anywhere; an unloaded counter shows `--ink-3` placeholder digits, per the existing skeleton rule.
- **`prefers-reduced-motion`** zeroes every duration. Dragging and reordering remain fully functional.

## Guarantees

These are invariants, not preferences. A change that breaks one is a bug.

- A drag does not begin until ~4px of pointer travel, so tapping a tile always opens the work. Click stays the primary action.
- At rest the playground is always a legible grid. Physicality is additive and never becomes the layout.
- No layout state can hide content or strand a rail. Every divider is range-clamped.
- Everything is keyboard-reachable and keyboard-operable. Drag is pointer enhancement, never the only route to an action.
- A **Reset** control in the Settings rail restores rail widths, tile order, and dials. Persistent mutation without an undo is hostile; this ships with the first draggable thing, not after.

## Mobile

Mobile is its own layout, not a stacked desktop.

Law 1 does not apply: without dividers there is nothing to drag, and faking a resize affordance is worse than dropping it. Home becomes a single scrolling record — profile, selected work, counters, contact. The DialKit is a bottom sheet. Tile reorder survives via long-press.

## Build order

1. **Structure** — tiering in `data/`, home centre rail reduced to Selected, `/work` archive, `/work/[slug]` template.
2. **Counters** — Upstash wiring, global dial count, build honesty chip, Spotify now-playing.
3. **Handling** — divider drag, tile reorder, Reset control, feel spec applied.
4. **Mobile** — the single-record layout and bottom sheet.
5. **Polish.**

Counters land before handling deliberately: the global dial count is the payoff for the DialKit, and shipping the drag mechanics first would leave the anomaly — the thing the whole direction turns on — until last.

## Versioning

This document is not a site change and carries no version bump. Implementation follows the existing discipline: a `data/changelog.ts` entry before shipping, `vercel deploy --prod` through `scripts/deploy.sh`, the immutable deployment URL recorded in the entry, then commit, tag, push, and a final production deploy. Phase 1 ships as v0.5.0.
