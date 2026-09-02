# Portfolio v2 — The Instrument, the Product, and the Mosaic

Date: 2026-09-02
Status: awaiting approval
Extends: `2026-08-13-design-language.md` (the four laws), `2026-08-25-glyph-icon-language.md`
Supersedes: the era spine and the record block in `2026-09-01-home-as-feed-design.md`. That
document's inline-case decision, its retired `/work/[slug]` route and its redirects all stand.

## Why this document exists

The 2026-09-01 rebuild put the work on the home page and proved the idea. Seen on a screen it also
showed three things the spec had not asked hard enough about:

1. **The hero is a data table.** A name, two lines of role, then four ruled rows of Location,
   Expertise, Contact and Elsewhere. It reads as a form. Ten comma-separated skills is the weakest
   thing on the first screen, and the left of the composition sits empty against the controls at the
   right.
2. **Two of five eras had nothing to show.** Grouping by employer is the right shape for a CV and
   the wrong one for a portfolio whose argument is four products.
3. **The greys are not doing enough work.** Light surfaces separate by three points where dark
   separates by ten, and `--text-3` — which carries every label, year and caption on the site —
   fails legibility on both skins.

This document settles the foundations, the hero, the work, and the feed as one program.

## What the user chose

Binding on everything below.

- **Four products, numbered, flat.** Endgame.ai, ChessEver, Sylvan, Hitman's Library. No employer
  or contract framing: the home is product-focused.
- **The hero dives straight into the work** — one band, not a section — but carries **live
  instruments**: a time face and a weather face, echoed in the footer so the page opens and closes
  on the same two readings.
- **The unfold stays and becomes unmissable** — a full-width labelled bar, not a chip.
- **The skins stay pure neutral** and are retuned rather than tinted. Better opacity throughout,
  and typography that actually establishes hierarchy.
- **Shots stay their own surface.** The home is product work; `/shots` is years of design
  exploration. They are different things and do not mix.
- **The feed becomes a formless mosaic** — varied sizes, organic, no controls, no shuffle, no view
  switcher.

## 1 · Foundations

### The two skins

Pure neutral, no hue admitted. `--miss` remains the single exception and keeps its single meaning.

| Token | Light now | Light next | Dark now | Dark next |
| --- | --- | --- | --- | --- |
| `--bg` | `#f4f4f4` | `#f2f2f2` | `#0a0a0a` | `#0a0a0a` |
| `--surface` | `#ffffff` | `#ffffff` | `#141414` | `#161616` |
| `--surface-2` | `#f7f7f7` | `#fbfbfb` | `#1c1c1c` | `#1f1f1f` |
| `--border` | `#e9e9e9` | `#dedede` | `#262626` | `#2e2e2e` |
| `--text-1` | `#111111` | `#0f0f0f` | `#f5f5f5` | `#f5f5f5` |
| `--text-2` | `#6f6f6f` | `#5c5c5c` | `#8a8a8a` | `#9a9a9a` |
| `--text-3` | `#b0b0b0` | `#7d7d7d` | `#4d4d4d` | `#6b6b6b` |

Two defects are being fixed, not two preferences.

**Surfaces separate on both skins.** `--surface-2` sat three points off `--bg` on light and ten on
dark, so a tinted case plate was obvious in the dark and invisible in the light. Raising it to
`#fbfbfb` against a `#f2f2f2` ground gives the light skin the same read.

**`--text-3` becomes legible.** It carried every mono label, year and caption on the site at
0.625rem. `#b0b0b0` on `#f4f4f4` is about 2.0:1 and `#4d4d4d` on `#0a0a0a` about 2.4:1 — both fail
WCAG AA for text at any size. The new values are approximately 3.6:1 and 3.7:1: still plainly
tertiary, no longer guesswork. This is most of what "better opacity all round" will amount to, and
it is a correctness fix wearing an aesthetic hat.

Borders strengthen on both skins so a hairline reads as a drawn line rather than a rendering
artifact.

### The type scale

Sizes today are ad-hoc literals — `0.5625` / `0.625` / `0.75` / `0.8125` / `0.875` / `0.9375` / `1` /
`1.125` / `1.25rem` — chosen per component. Nine steps, no system, and the result is that a project
title at `1rem` sits beside its one-liner at `0.875rem` and reads as no louder.

Named tokens replace them, in `rem` so the DialKit's type dial still reaches everything:

```
--text-2xs  0.5625rem   mono micro-labels
--text-xs   0.6875rem   mono labels, years, captions
--text-sm   0.8125rem   secondary prose
--text-base 0.9375rem   body
--text-lg   1.25rem     the identity line
--text-xl   1.875rem    project titles
```

Seven steps, and every one of them is used. A reserved eighth for work that might arrive is
furniture, which is what the tier vocabulary was.

The jump that matters is `--text-xl` against `--text-base`: a project title is now unmistakably a
heading. No component may introduce a size outside this scale.

## 2 · The hero band

One row, not a section. Work begins immediately beneath it.

**Left** — identity, compressed to two lines: `’Damilare Osofisan · Product designer` and
`Lagos · dosofisan7@gmail.com`. The apostrophe stays the mark.

**Right** — two circular instrument faces, in the site's own dot language:

- **Time.** An analogue face for Africa/Lagos: a disc, an hour hand, a minute hand. It reports live
  external state, so Law 4 permits it to move, and it moves only while it is telling the time.
- **Weather.** Lagos conditions drawn as a dot-matrix glyph on a matching disc — the same cells
  `GlyphCell` and `GlyphIcon` are built from.

**The `Expertise` row is cut.** Ten skills in a comma list is the least evidential thing on the
page; four products argue it better. Contact and Elsewhere move to the footer.

**No hue.** The reference image for these faces carries a red dot. The design language admits one
hue with one meaning — a day the step goal was missed — and its own governing text says a second
meaning "would be a second hue in all but name." The dot ships in `--text-1`. Reopening this means
amending the design language on purpose, not in passing.

### The footer echoes the hero

The same two instruments, larger, beside the existing `GlyphBay` readouts, with Contact and
Elsewhere beneath. The page therefore opens and closes on the same two live readings — which is
what gives the footer a design language rather than inventing a second one for it.

### Weather data

**Open-Meteo**, `api.open-meteo.com/v1/forecast`, current temperature and WMO weather code for the
lat/long already recorded in `site.coordinates`. No API key, no account, CORS-clean, free for
non-commercial use.

Conditions collapse to a small set of drawn glyphs — clear, partly cloudy, cloudy, rain, storm,
haze — because the matrix cannot draw forty WMO codes and should not try.

**It must fail honestly.** No network, a refused request, or a stale response renders the
unreported state the glyph engine already has (`UNREPORTED` in `lib/glyph/steps-frames.ts`) rather
than a guess or a blank disc. An instrument that invents a reading is worse than one that admits it
has none. Fetched once on mount and refreshed no more often than every fifteen minutes: weather is
not a thing that changes in a second, and Law 4's reporting clause covers motion that *is* the
reading, not motion around it.

## 3 · The work

Four products, numbered `01`–`04`, newest first, flat. No client, no period, no era.

Each carries: the number, the title, the year, the mini write-up, then its frames. Beneath them, a
**full-width labelled bar** — the unfold, which now says what is behind it and how much of it
(`OPEN CASE STUDY · 12 FRAMES`), spanning the column with a rule and the chevron. The chip was
easy to miss; a bar is not. Everything the 2026-09-01 spec settled about the unfold still holds:
the tail stays in the DOM, collapsed by grid rows and never `hidden`, so the case studies remain
findable by search-in-page; the state is not persisted; the arrival fires once.

`data/eras.ts` and `lib/eras.ts`'s `Era` type retire. The ordering and block-splitting arithmetic
in `lib/eras.ts` survives — `orderEras` goes, `splitBlocks`, `blockAssetCost` and `LEDE_BLOCKS`
stay, and the module is renamed to what it now is.

The three `/work/*` redirects added on 2026-09-01 must be repointed: their era anchors are being
deleted. `/work/chessever`, `/work/sylvan` and `/work/hitmans-library` land on their product
anchors — `/#chessever`, `/#sylvan`, `/#hitmans-library`.

They stay written out, though the reason has changed. On 2026-09-01 a pattern was *wrong*: only one
slug matched its era's id. Flat products make slug and anchor identical, so `/work/:slug → /#:slug`
would now resolve correctly — and is still refused, because it would also send every slug that
never existed to the top of the home page. A URL that was never real should 404, and three
explicit lines say which three were.

**Endgame.ai has no art in the repository.** Until files land in `public/work/endgame/` and
`pnpm manifest` runs, `01` renders its record and says so plainly. It does not get a placeholder
frame; v1.9.1 deleted one of those on purpose.

## 4 · The feed

`/shots` becomes a **formless mosaic**: shots at varied sizes, composed rather than dealt.

The reference builds this by hand — a six-column grid with fixed row heights where each shot is
authored with a `col-span` and `row-span`. This site will not author sizes per shot. Formless means
the composition emerges:

- A shot's **height** comes from its own aspect ratio, as it does today.
- A shot's **width** varies across a small set of spans on a twelve-column grid.
- Spans are assigned so that **no two adjacent shots share a width** and each band fills, which is
  what produces an organic rhythm rather than a repeating one.
- Order remains **newest first**. It is the only thing the order does, and a mosaic still reads in
  document order.

No shuffle. No view switcher. No captions — a shot's name lives in its alt text, serving the reader
who needs it without being drawn over the work.

`lib/shots-layout.ts` and its column-bucketing are replaced. Its guarantee — that a column ends at
most one shot taller than the shortest — belonged to a four-column deal and does not survive the
change. The replacement gets its own pure module and its own tests, holding the properties that
matter now: every shot placed exactly once, order preserved, no band left underfilled, and no two
neighbours the same width.

The dot-matrix panel sweep stays. It is the site's signature and it is already extracted into
`lib/glyph/sweep.ts`, where both surfaces reach it.

## Out of scope

`/about` and `/colophon`. The DialKit. The glyph matrix and its toys. The Spotify disc. The
`SiteHeader` workshop chrome, which already renders only on the workshop face. The changelog and
the specs directory, which are historical records.

## Open dependencies

1. **Endgame.ai artwork** — the user supplies it; `01` is honest until then.
2. **The red dot** — ships monochrome unless the design language is deliberately amended.

## Success criteria

1. The first screen carries an identity line, two live instruments, and the start of `01`.
2. `--text-3` reaches at least 3:1 against `--bg` on both skins, and no component sets a font size
   outside the scale.
3. A tinted case plate is as visible on the light skin as on the dark.
4. The time face reads Lagos time; the weather face reads Lagos weather, or admits it cannot.
5. Nothing on the page moves that was not touched, arriving, or reporting live external state.
6. The three retired `/work/*` URLs resolve to their product anchors, not to deleted era anchors.
7. The feed places every shot exactly once, newest first, with no two adjacent shots the same width.
8. A collapsed case study's text is still found by search-in-page, and a collapsed product
   downloads none of its images.
