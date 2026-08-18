# Portfolio v2 — The Glyph Matrix

Date: 2026-08-18
Status: approved direction
Extends: `2026-08-13-design-language.md` (Law 4), `2026-08-17-v1-surfaces.md` (motion law)
Supersedes: nothing. The token system, typography, and stack stand unchanged.

## Why this document exists

The home carries one instrument — the halftone disc — that reports what is playing on
Spotify. This document turns that single object into a **system**: one monochrome cell
renderer with several faces, reporting live state from more than one source, in the visual
language of a dot-matrix display.

It also settles three things the existing specs do not: what motion a live readout is
allowed, what the site may claim about data it does not have, and where an authored
easter egg lives on a site that otherwise only reports facts.

## Scope

Locked and out of scope: the monochrome two-skin token system, Suisse Int'l + Suisse Mono,
hairline separation, the shared primitives in `components/ui.tsx`. **No accent hue enters
the site** — see "The hollow ring" below for how the reference's red is carried without it.

Open and settled here: the glyph engine, the Spotify face, the pedometer faces, the
entrance animation, the step data path, and the colophon forge.

## Provenance and licence

The visual language is a homage to Nothing's dot-matrix interface. It is **not** an
integration.

Nothing's GlyphMatrix Developer Kit is an Android `.aar` driving the physical LEDs on
Phone (3) (25×25) and Phone (4a) Pro (13×13). It cannot execute in a browser. Its licence
additionally forbids redistribution, derivative works, and commercial use without written
permission.

Therefore: **no Nothing code, no Nothing assets, no Nothing trademarks.** Every glyph in
this system is drawn from primitives in our own source, the way `halftone-disc.tsx:68`
already rasterises the Spotify mark. The colophon carries an attribution row stating this
plainly. This is a correctness requirement, not a courtesy.

Reference hardware note: the author's device is a Phone (2a), which has the Glyph
Interface light strips rather than a Glyph Matrix. The reference images are therefore the
Nothing OS **pedometer widget**, not a Matrix toy — which is fortunate, because the
widget's language (dot-matrix numerals beside plain sans labels) maps onto this site's
type system almost exactly.

## Law 4, amended

Current: *Nothing moves unless touched, or arriving.*

New: **Nothing moves unless touched, arriving, or reporting.**

The reporting clause is as narrow as the arriving clause:

- Only an instrument displaying **live external state** may use it.
- Only **while that state is live**. Nothing playing, or a step count that has not changed,
  means a still card. The exception is earned by data, not granted by decoration.
- Only **within its own bounds**. A reporting instrument never animates the page around it.

Still forbidden everywhere, unchanged: parallax, scroll-linked transforms, autoplay,
ambient loops, and anything that keeps moving while the visitor is still and nothing is
being reported. A page at rest with nothing playing holds no running animation.

`prefers-reduced-motion` zeroes the reporting clause entirely: values update, nothing
travels.

## Honesty constraint

**Spotify's `audio-features` and `audio-analysis` endpoints return 403** for this
application. Verified against live production credentials on 2026-08-18. There is no
tempo, no beat grid, and no waveform available, and no route to them short of a new
extended-access grant from Spotify.

Consequently **nothing in this system may claim to be beat-synchronised.** The pulse is
driven by real playback position and is named a *playhead pulse* in code, in the UI, and
in the colophon. A fabricated rhythm would be the single change most damaging to a site
whose argument is `Last updated N days ago`, live-computed token rows, and placeholder
digits instead of spinners.

## Architecture

The disc is already most of a glyph matrix — a monochrome cell grid, one value per cell,
spring offsets, travelling ripples, a self-terminating loop. It is circular and hardcoded
to one glyph. **Generalise it; the disc becomes the engine's first client.** This is what
makes the result one instrument rather than four widgets sharing a page.

```
lib/glyph/matrix.ts        Engine. Cells, spring offsets, ripple sources, self-terminating
                           loop. Pure TypeScript, no React, no DOM beyond a canvas context.
lib/glyph/font.ts          A 3×5 dot micro-numeral set plus comma, drawn in code.
lib/glyph/glyphs.ts        Frame sources: (t, state) => Float32Array of cell values.
                           One per face. Pure functions of time and state.
components/glyph-cell.tsx  React wrapper: canvas, pointer, swipe, paging, reduced motion,
                           accessible label and keyboard operation.
components/glyph-bay.tsx   The home pair — Spotify cell and pedometer cell.
app/api/steps/route.ts     POST (shared-secret guarded) and GET.
lib/steps.ts               Typed read/write over Upstash, mirroring lib/counters.ts.
```

Each unit is independently answerable: the engine knows nothing about Spotify or steps;
a frame source knows nothing about canvases or React; the cell knows nothing about which
face it is showing. Frame sources are pure, so they are testable without a browser.

`components/halftone-disc.tsx` is retired once its behaviour is reproduced by the engine —
its physics constants (stiffness 400, damping 32, and the ripple tuning at lines 22–33)
carry over unchanged, because they are already the spec's feel values.

## The bay

Two cards, side by side, where the disc currently sits above the footer.

**Card one — Spotify.** As today: dots hold the mark when silent and migrate into dithered
album artwork when a track starts. New behaviour while playing:

- A ring is emitted on a fixed 2000ms period, its phase derived from `progressMs % period`,
  so the pulse is a function of true playback position — deterministic across reloads and
  devices, and stopping dead when playback stops. The period is a named constant beside the
  existing ripple tuning, not a literal.
- Ring density and travel are seeded from the album-art fingerprint already computed for
  the dither, so every track ripples differently without inventing anything.
- A hairline arc around the cell carries real progress.

**The artwork has to be readable.** Today it is not: the disc renders `radius ∝ value`, so
dot *area* — which is what the eye actually integrates — goes as `value²` and every midtone
collapses. A `0.2` alpha floor keeps dark regions from ever reaching black, so the image has
no blacks to read against. And a 32-cell grid is fed from Spotify's *smallest* image, chosen
deliberately at `app/api/now-playing/route.ts:64` on the assumption the grid could not use
more. Four corrections, in order of effect:

1. **Area-linear mapping.** `radius ∝ √value`, so perceived ink is proportional to
   luminance. This is the halftone principle the current code inverts, and it alone
   recovers the whole midtone range.
2. **Real blacks.** Remove the alpha floor for artwork; a cell at zero luminance draws
   nothing. The floor stays for the Spotify mark, where it is doing legitimate work.
3. **Per-artwork auto-level.** Normalise each cover's luminance to its own min and max
   before mapping. Album art is frequently low-contrast or heavily tinted, and a fixed
   ramp wastes most of the available range on tones the image never uses.
4. **A denser grid.** 48 cells rather than 32, with the source image chosen as the
   smallest Spotify offers that is at least 4× the grid — 300px, not 64px — so each cell
   box-averages real samples instead of guessing from one.

The Spotify mark stays legible at 48 cells; it is drawn from primitives and rasterises at
whatever density it is given.

**Card two — the pedometer.** Three pages, matching the reference exactly, with a vertical
three-dot page indicator on the right edge.

1. **The walk.** A dot-matrix figure on a dotted path. Dots behind it render at full size
   and brightness, dots ahead at reduced size and brightness; the figure's position along
   the path is today's steps against the goal. This is the face that carries the idea.
2. **The record.** Today's count in dot-matrix numerals over the label `TOTAL TODAY` and a
   goal percentage, then the 7-day mean over `7-DAY AVERAGE` and its percentage. (The
   reference shows `5,391 / 53%` and `6,987 / 69%`; those are its live values, not fixed
   copy.) Dot-matrix digits, Suisse labels — the site's existing label-and-value structure,
   rendered in dots.
3. **The week.** Seven columns labelled `M T W T F S S`, magnitude encoded as dot size and
   brightness rather than bar height.

Paging: swipe on touch, click or arrow keys on pointer devices. Both cards are keyboard
operable; paging is never the only route to a value.

### The hollow ring

The reference marks days the author did not run with a red dot. A day not run is an
**absence**, and monochrome has a better word for absence than a hue: missed days render
as an **unfilled outline dot**, hit days as filled. Same semantics, legible at dot scale,
correct in both skins, and the locked no-hue invariant survives. Nothing used red because
Nothing has a brand red to spend; this site does not.

## Steps: the data path

Health Connect is device-local and exposes **no REST API**, so no server can pull step
data. The phone must push.

```
Nothing Phone (2a)                        portfolio-v2
┌────────────────────────┐                ┌──────────────────────────┐
│ Health Connect         │                │ POST /api/steps          │
│  └ StepsRecord         │──HTTPS POST───▶│  ├ verify shared secret  │
│ automation app         │   every 30m    │  ├ reject implausible    │
│  (Tasker / MacroDroid) │                │  └ SET steps:<YYYY-MM-DD>│
└────────────────────────┘                └────────────┬─────────────┘
                                                       │
                                       Upstash Redis (KV_REST_API_*, already provisioned)
                                                       │
                                          GET /api/steps ──▶ glyph bay
```

- **Daily keys** (`steps:2026-08-18`), not one counter, so the week view is free and the
  7-day average is a read of seven keys. Keys expire after 60 days.
- **A timestamp travels with the payload**, so the card can report *as of 14 minutes ago*
  rather than implying it is instant. This extends the site's existing `Last updated`
  honesty rather than fighting it.
- **Shared secret** in `STEPS_INGEST_SECRET`, checked in constant time. Without it, anyone
  who finds the route can write the number.
- **Plausibility bounds** reject negative values, values above a daily ceiling, and
  same-day regressions, so one bad automation run cannot corrupt the record.
- **Absent store or absent data is a normal answer**, not an error. The card shows
  placeholder dots, mirroring the existing counter rule that a counter never read is not a
  counter at zero.

Daily goal: **10,000**, in `data/site.ts` where it can be changed without touching logic.

Only steps are collected. All three reference views are step-based, so distance and run
sessions are out of scope — which keeps the phone automation to a single metric.

The author-facing setup guide (install, Health Connect grant, profile settings, secret)
ships as part of this work, written against whichever automation app is chosen. Tasker is
recommended: real Health Connect support, a proper HTTP Request action, and it survives
reboots without drifting.

## The entrance

Cells illuminate in a sweep from centre over ~600ms, once per session
(`sessionStorage`), reduced-motion honoured.

This is not decoration and does not need the reporting clause: both now-playing and steps
are async, so the sweep **is** the loading state — a glyph-native replacement for the
placeholder-digit rule, and it resolves into real data rather than looping. It falls under
the existing *arriving* clause.

## The colophon

The value field is replaced by the **glyph forge**, in its slot.

- A 25×25 grid you draw on directly, with the engine rendering live beneath the pointer.
- Scrub control to preview the drawing through the entrance sweep and the ripple.
- The drawing persists to `localStorage` — Law 3, applied to a thing the visitor made.
- A shared Redis counter reports how many glyphs have been drawn on the site, reusing
  `lib/counters.ts` exactly as the dial count does.
- Clear and reset controls, per the existing rule that persistent mutation without an undo
  is hostile.

A new **Provenance** row states the homage, the absence of Nothing code or assets, and the
403 on Spotify's analysis endpoints — because a colophon that explains the type but hides
the constraint is decoration.

### The easter egg

A hidden **fourth page** on the pedometer card, reached by continuing past the week view.
The page indicator never shows a fourth dot: it is found, not advertised.

Its default content is a glyph authored by the site owner, committed in `data/`. If the
visitor has drawn one in the forge, **theirs replaces it on their own device**,
permanently.

Visitor drawings are never shown to other visitors. This is deliberate: the shared counter
carries the collective trace, while an unmoderated 25×25 canvas rendered on a portfolio
where recruiters land is a liability with no upside.

## Guarantees

Invariants, not preferences. A change that breaks one is a bug.

- No accent hue enters the site.
- Nothing claims to be beat-synchronised.
- A card with no live state to report holds no running animation.
- Every value in the bay is reachable by keyboard; swipe is pointer enhancement only.
- Every card carries an accurate `aria-label` describing its current face and value.
- A failed fetch, an absent store, and absent credentials all degrade to placeholder dots.
  A readout is decoration on top of the page, never a reason to fail it.
- `prefers-reduced-motion` leaves every value readable and every page reachable.
- No Nothing code, assets, or trademarks enter the repository.

## Mobile

Mobile is its own layout, not a stacked desktop. The two cards stack, each keeping its own
paging, and swipe is the primary gesture. Card size is chosen so dot-matrix numerals stay
legible at touch scale rather than scaled down from the desktop cell.

## Build order

Each task is dispatched to its own agent. Task 1 lands first and alone — shipping any face
before the engine is what would turn this into four unrelated widgets.

1. **Engine** — `matrix.ts`, `font.ts`, the disc ported onto it with no visual change.
   The safest possible first step: a refactor with an existing appearance as its test.
2. **Steps path** — `/api/steps`, `lib/steps.ts`, plausibility bounds, setup guide.
   Independent of 1; runs in parallel.
3. **Spotify face** — playhead pulse, art fingerprint seeding, progress arc. Needs 1.
4. **Pedometer faces** — three pages, hollow-ring week, paging and gestures. Needs 1 and 2.
5. **Entrance** — the sweep, session gating, Law 4 amendment written into README and specs.
   Needs 1.
6. **Forge** — colophon section replacing the value field, provenance row, easter egg.
   Needs 1.

## Versioning

Ships as **v1.3.0**. Implementation follows the existing discipline: a `data/changelog.ts`
entry before shipping, `scripts/deploy.sh`, the immutable workshop deployment URL recorded
in the entry, README updated, then commit, tag, and push.
