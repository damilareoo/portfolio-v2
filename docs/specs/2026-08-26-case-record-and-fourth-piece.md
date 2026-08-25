# Portfolio v2 — The Case Record, and a Fourth Piece

Date: 2026-08-25
Status: awaiting approval
Extends: `2026-08-25-glyph-icon-language.md` (wave 1), `2026-08-10-portfolio-v2-design.md`
Supersedes: nothing.

## Why this document exists

Wave 1 made the site's marks and rules one language. The case page took those details — glyph
arrows, dotted rules — and still does not read as part of the site, because its **structure** was
never the problem the details could fix.

This is wave 2. It settles why the case page feels foreign, fixes it by subtraction rather than
addition, and adds the fourth selected piece.

## The actual diagnosis

Not "the layout is wrong". The site records facts in label/value rows in three places, and the
case page is the one that disagrees with the other two:

| Surface | Layout | Label | Value |
|---|---|---|---|
| `app/about/page.tsx` | `grid-cols-[72px_minmax(0,1fr)]` | `0.6875rem`, `ink-3` | `0.75rem`, left |
| `app/colophon/page.tsx` | `grid-cols-[72px_minmax(0,1fr)]` | `0.6875rem`, `ink-3` | `0.75rem`, left |
| `app/work/[slug]/page.tsx` | `flex justify-between` | mono, uppercase, `0.625rem` | `0.8125rem`, **right** |

Three local `Row` components, none shared. The repo's own standing rule — shared primitives live
in `components/ui.tsx`, and every surface is built from them rather than from ad-hoc styles — is
already broken here, and the case page is where the break shows.

The case page is not under-designed. It is **differently** designed, which reads as foreign.

## What changes

**One record primitive.** `RecordRow` joins `Chip` / `Sheet` / `SectionLabel` / `Meta` in
`components/ui.tsx`, carrying the shape `about` and `colophon` already use. Those two adopt it
with **zero visual change** — they are the majority, and the primitive is defined to match them.
The case page adopts it and changes: its rail's metadata becomes the same record the rest of the
site keeps.

**The rail becomes a record.** Section headings in the rail use `SectionLabel` rather than the
page's private `RailLabel`, so Overview and Approach are labelled the way every other section on
the site is labelled.

**Nothing structural moves.** The two-column grid stays. The sticky rail stays. The reel stays.
The scroll behaviour stays. This wave changes what the chrome is *made of*, not where it sits —
which is what the diagnosis actually asks for, and no more.

## The fourth piece: Endgame.ai mobile

Joins `selected`, taking the count from three to four. Tier `selected`, so it earns a case page
like the others.

**The artwork is authored, not captured.** Four mockups are drawn as recreations: the live game
board, live match browsing, puzzles and training, and profile with rating history. They are built
in the site's own hand rather than lifted from the product.

**They are labelled as recreations on the page.** A case page that shows fabricated screenshots
as if they were shipped product captures is making a false claim about the work, and this site's
whole register is that it does not claim what it cannot show. The reel carries a caption saying
the frames are redrawn. This is a correctness requirement, not a courtesy — the same standing the
Provenance note has in the glyph-matrix spec.

**Prose is not invented.** `intro` and `approach` are written from what the author supplies about
the work. If nothing is supplied, the entry ships with its record and its reel and no prose, and
the page says so plainly — the existing template already handles a selected piece without blocks
rather than padding it. **No claim about the author's role, the product, or its outcomes is
written by anyone but the author.**

## Out of scope

The feed gallery and Nothing OS toy parity are waves 3 and 4 and are untouched here. The three
project-tier entries (`damilares-skills`, `workbench`, `pixel-soccer`) stay unrendered, as
decided on 2026-08-25 — this wave does not revisit the archive question.

## Success criteria

- `pnpm lint`, `tsc --noEmit`, `pnpm test`, `pnpm build` all clean.
- `about` and `colophon` render byte-identically to before the refactor.
- No local `Row` component remains in `app/about`, `app/colophon`, or `app/work/[slug]`.
- The home shows four selected pieces; `/work/endgame-mobile` builds as SSG.
- The case reel states that the Endgame frames are recreations.
- Nothing new animates.
