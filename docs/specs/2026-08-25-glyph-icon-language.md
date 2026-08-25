# Portfolio v2 — The Glyph Icon Language

Date: 2026-08-25
Status: approved direction
Extends: `2026-08-18-glyph-matrix-design.md` (the glyph engine), `2026-08-13-design-language.md` (Law 4)
Supersedes: nothing. The token system, typography, and the canvas instruments stand unchanged.

## Why this document exists

The glyph matrix shipped as a set of **instruments** — the Spotify disc, the pedometer
faces, the toys. They are large, live, animated, and confined to their own cards. Away
from them the site speaks a different language: six inline SVG icons drawn in a generic
hand, and hairline CSS borders that could belong to any site.

This document makes the dot matrix the site's **icon language** rather than its instrument
panel — the marks and rules everywhere else, at 14px, on the same grid the instruments
use. It is wave 1 of a larger programme (case layout, feed gallery, toy parity), and it
comes first because the other waves consume it.

## Scope

Locked and out of scope: the monochrome two-skin token system, Suisse Int'l + Suisse Mono,
the shared primitives in `components/ui.tsx`, every canvas instrument's behaviour, and the
single `--miss` red exception on the pedometer calendar.

Open and settled here: where the pixel-drawing constants live, the icon grid, which icons
exist, which borders become dotted, and what motion an icon is allowed.

Explicitly deferred: the refined case layout, the fourth selected piece (Endgame.ai
mobile), the feed gallery, and Nothing OS toy parity. Each gets its own spec.

## The state this replaces

Six inline SVGs exist site-wide — three theme modes in `components/theme-control.tsx`,
two in `components/theme-toggle.tsx`, and the Spotify mark, which is already rasterised
from our own primitives in `lib/glyph/glyphs.ts` and is therefore already correct.

There are **no icons at all** in the nav, the case-page metadata rows, the footer links, or
the feed controls. So this wave is mostly *introducing* a language, not converting one.
That distinction matters: it means restraint is the risk to manage, not consistency.

Borders, counted: 38 uses of `border-line`, and roughly 21 of `border-b` / `border-t`.

## The shared hand

`PIXEL_FILL` (0.74), `PIXEL_ROUNDING` (0.26) and `PIXEL_FLOOR` (0.16) are today local
constants inside `components/glyph-cell.tsx`. They move to `lib/glyph/pixel.ts`, and both
renderers read them from there.

This is the load-bearing decision in the document. Two renderers only constitute one
language if they draw a pixel from the same numbers; left as they are, the first person to
tune the canvas silently desyncs every icon on the site, and nothing would catch it.

`pixel.ts` also exports the geometry a single pixel is given — its inset within its cell
and its corner radius — so neither renderer computes it independently.

## Two renderers, deliberately

`GlyphCell` is a 457-line client component carrying pointer tracking, spring physics,
ripples and an arrival sweep. That is everything an instrument needs and everything an icon
must not have.

Icons therefore get their own renderer: `components/glyph-icon.tsx`, a **server** component
emitting one SVG rect per lit cell, coloured by `currentColor`. It has no state, no effects
and no client boundary, which is what lets an icon appear inside the nav, the case-page
metadata rows and the footer without dragging those surfaces into the client bundle.

The frame vocabulary is shared. The machinery is not. Canvas for marks that move, SVG for
marks that do not.

## The grid — 7×7

Seven cells square, for three reasons that happen to agree:

- **Odd, so it has a true centre.** Symmetric marks — the sun, a target, a dot — need one.
  An even grid has to break its own symmetry to find a middle.
- **5 + 1 + 1.** The dot alphabet in `lib/glyph/font.ts` is 3×5. Seven is the font's five
  cap-height rows with one above and one below, so an icon standing beside a word inherits
  the letterform's optical alignment instead of needing to be nudged into place.
- **Seven is the floor for distinctness.** At five cells a diagonal arrow and a chevron
  resolve to the same shape. Seven is the fewest that tells them apart.

Icons are authored the way `font.ts` authors letters: as seven rows of seven in the source,
laid out so the icon reads as a picture in the code rather than as a run of digits.

Size is set in `em`, never `px`, so the type dial reaches them — the same invariant the
type scale has carried since v0.4.0. Below roughly 14px a 7×7 grid stops resolving; the nav
and the metadata rows sit at 14–16px, and the language does not claim to work smaller.

## The set — six icons

Only icons with a call site that exists today, and only where the mark replaces a *mark*
rather than a word:

| Icon | Replaces or fills |
| --- | --- |
| `light` | SVG in `theme-control.tsx`, `theme-toggle.tsx` |
| `dark` | SVG in `theme-control.tsx`, `theme-toggle.tsx` |
| `system` | SVG in `theme-control.tsx` |
| `arrow-out` | the case-page Live row, footer x/github/mail — currently unmarked |
| `arrow-left` | the case page's `←` back-to-home, the lightbox's `←` previous |
| `arrow-right` | the case page's `→` next-piece link, the lightbox's `→` next |

The Unicode arrows are the honest targets here: `←` and `→` are already marks doing a
mark's job, set in a typeface that has nothing to do with this site's language. Replacing
them is conversion. Replacing a word is not.

**Nav surface marks are cut.** The nav is four text chips that work. Giving them icons is
adding, not refining, and the site's standing instruction is to refine. If the nav is later
judged too plain against the rest of the system, that is a decision for its own wave with
its own four icons.

**A `close` icon is cut for the same reason.** The lightbox dismisses through a button
reading `Close`, which is a word and works. Turning it into an `×` would trade a label for
a mark and make the control worse for anyone who benefits from the word — the opposite of
what the nav cut is protecting.

The Spotify mark is untouched. It is already drawn from our own primitives, it lives on a
canvas instrument, and it is not an icon.

## Structural furniture

**A border that separates becomes dots. A border that contains stays solid.**

A rule is a mark; a box edge is an edge. The inventory divides almost exactly along this
line already: the ~21 `border-b` / `border-t` uses are separators, and the 38 `border-line`
uses are overwhelmingly containment.

Separators become a `--rule-dots` background-image utility defined once in
`app/globals.css`. Containment borders — frames, cards, chips, inputs — do not move. The
dot pitch matches the icon cell so that a rule and an icon sit on one grid rather than two
that nearly agree.

This is a CSS utility swapped in at ~21 call sites, not a component rewrite across fifteen
files. The two `border-dashed` empty states already signal absence in their own register
and are left alone.

## Motion

Law 4 stands unamended: nothing moves unless touched, arriving, or reporting.

An icon reports nothing and does not arrive. A hover or press change falls under *touched*
and is permitted. Icons are explicitly **denied the arrival sweep** that the instruments
carry — a sweep across the nav on every navigation would be motion the visitor did not
cause, and the entrance belongs to the instruments precisely because they are the things
that were not there a moment ago.

No icon animates on its own, in any state, ever.

## Theme and access

Every icon draws in `currentColor` and therefore inherits `ink` / `ink-2` / `ink-3` and
both skins with no per-theme variant and no second asset.

The accessibility contract does not change. An icon beside a label is `aria-hidden`, since
the label already says it. Where an icon *is* the control — the lightbox dismiss, the three
theme buttons — the button keeps the `aria-label` it carries today. No icon becomes the
sole carrier of meaning that was previously in text.

## Testing

One test file per glyph module, as every module in `lib/glyph/` already has.

`lib/glyph/icons.test.ts` asserts that every icon is exactly 49 bits of 0 or 1, that none
is empty, that none is fully lit, and that icons declared symmetric actually mirror. That
last one is the realistic failure: 49 bits authored by hand is a typo waiting to happen,
and a one-cell asymmetry is invisible in review and obvious on the page.

`lib/glyph/pixel.test.ts` asserts a pixel never exceeds its cell and a corner radius never
exceeds half a pixel — the two ways the shared geometry could produce something that is no
longer a dot matrix.

## Files

New: `lib/glyph/pixel.ts`, `lib/glyph/pixel.test.ts`, `lib/glyph/icons.ts`,
`lib/glyph/icons.test.ts`, `components/glyph-icon.tsx`.

Modified: `components/glyph-cell.tsx` (reads the shared constants), `theme-control.tsx`,
`theme-toggle.tsx`, `app/globals.css`, `app/work/[slug]/page.tsx`,
`components/feed-gallery.tsx`, `components/site-footer.tsx`, and the separator borders
where they occur.

## Success criteria

- `pnpm lint`, `tsc --noEmit`, `pnpm build` and `pnpm test` all pass.
- No new client component boundary is introduced by an icon.
- The six generic SVGs are gone, and no Unicode arrow remains as an interface mark.
- Turning the type dial changes icon size along with the type.
- Both skins render every icon with no per-theme asset.
- Nothing on the site animates that did not animate before.
