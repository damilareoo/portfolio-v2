# Portfolio v2 — The Home Is the Work

Date: 2026-09-01
Status: awaiting approval
Extends: `2026-08-13-design-language.md` (the four laws), `2026-08-25-glyph-icon-language.md`
Supersedes: the home structure in `2026-08-10-portfolio-v2-design.md`, and the case-page route
settled in `2026-08-26-case-record-and-fourth-piece.md`. The token system, typography, shared
primitives, and the case *block vocabulary* in those documents stand unchanged.

## Why this document exists

The home is an index to work rather than the work. It spends its first screen on a lockup and a
section label, then hands out four identical cover tiles that each promise the real thing lives one
click away. Three clicks deep there are three good case pages almost nobody reaches.

`portfolio.chsmc.org` was the reference the user brought, and its insight is structural, not
decorative: **there is no index, because the page is the work.** A lockup, a short record, then
sections grouped by era — company, role, year range, one paragraph — each holding its own frames.
No nav to the work, because there is nowhere else the work could be.

This document moves that structure onto the home and settles what it costs.

## What the user chose

Four decisions, taken before any approach was proposed, and binding on everything below.

1. **`/shots` stays.** The home becomes a feed of work; the shots field keeps its own page and its
   own panel treatment. The nav keeps four surfaces.
2. **The spine is era / client**, not year buckets and not an ungrouped stream.
3. **Everything inline; the case pages retire.** The home carries the case studies themselves.
4. **The creative energy goes into instrument and glyph treatments**, not into a new card system.
   Horizontal card-lists, varied card types, and an asymmetric grid were each offered and passed on.

Decision 4 constrains decision 3 in a way worth stating plainly: without horizontal rails, inline
depth is paid for in page height. That tension is what the chosen approach exists to resolve.

## The approach: progressive dossier

Three approaches were weighed. **A**, every era fully expanded top to bottom, is the reference's
literal reading and degrades with every piece added — and past years are about to be added. **C**, a
sticky era rail tracking scroll, reintroduces a persistent index, which is half of what the
reference removed. **B is chosen.**

Each era shows its head and a short lede inline — its first two blocks. A control marked with a glyph icon
unfolds the rest of that era's blocks **in place**, never navigating. The default page is scannable
and starts in the work; depth is one touch away and stays on one URL.

B is also the only option where "everything inline" and "no horizontal rails" do not fight, and it
sits inside Law 4 without amendment: the unfold is *touched*, and frames arriving through the panel
wipe are *arriving*.

## The era spine

A new `data/eras.ts` sits above the existing work model.

```ts
export type Era = {
  id: string;        // anchor slug — /#chessever
  name: string;
  role?: string;
  period: string;    // as displayed, e.g. "Apr 2026 — Aug 2026"
  sort: string;      // end date, ISO-ish; ordering is derived, never hand-kept
  href?: string;     // the company's own site
  logo?: string;
  blurb: string;     // one paragraph, the era's own description
  entries: string[];  // work slugs, in the order the era shows them
};
```

`data/work.ts` stays the store: it keeps the types and every `WorkItem` with its blocks. `eras.ts`
composes by slug reference rather than re-housing the items, so there is exactly one definition of a
piece and moving it between eras is a one-line edit.

Eras are grounded in `data/experience.ts`, not invented:

| Era | Period | Holds |
| --- | --- | --- |
| Endgame AI | Apr 2026 — Aug 2026 | record only — no public art |
| ChessEver | Apr 2025 — Apr 2026 | the ChessEver case blocks |
| HEX | Mar 2025 — Apr 2026 | record only — no public art |
| Independent | 2025 | Sylvan |
| Side projects | — | Hitman's Library, and past-year pieces as they are added |

Side projects sort last regardless of date, as the reference's do.

**Eras with no art render their head and record and say so plainly.** This is not a new decision; it
is the rule already written into `data/work.ts` — selected work without blocks "renders its record
and says so plainly rather than padding". Endgame AI and HEX exercise it on the home. Neither gets a
placeholder; v1.9.1 deleted one of those on purpose.

`WorkItem` loses `tier`, and the `Tier` type goes with it — era membership is now the only
hierarchy, and two ways to say where a piece belongs is one too many. `blocks` stays a **single
array**. The lede/rest split is derived at `LEDE_BLOCKS = 2`, with an optional per-entry `lede`
override, so a piece is authored as one ordered list and the split is a rendering concern.

## Page architecture

`app/page.tsx` becomes, in order:

1. `SiteNav` — kept. `/shots`, `/about` and `/colophon` still exist, so removing it would hide
   surfaces rather than simplify the page.
2. The lockup, unchanged. The apostrophe stays the mark.
3. A record `dl` built from the shipped `RecordRow`: Location, Expertise, Elsewhere. This pulls the
   email and social links up out of the footer, where the reference carries them.
4. `EraSection` × 5, divided by dot rules.
5. `GlyphBay`, then the footer.

**The expertise row is static.** The reference marquees it; a marquee is precisely the ambient
motion Law 4 forbids, and no clause admits it. It renders as a wrapped list.

New components: `components/era-section.tsx` (server — head, record, entries) and
`components/era-entry.tsx` (client — owns the unfold). `components/case-reel.tsx` is **repurposed,
not deleted**: it already renders the `CaseBlock` union and needs only to accept a subset.

`lib/site-mode.ts` gates layout chrome and the colophon only, so the portfolio and workshop faces
share this home. One design, no branching.

## The unfold

State is `useState`, per-visit, and deliberately **not** persisted. Law 3 — "if it changes, it
remembers" — governs layout the visitor sets, like the DialKit. A reading position is not a setting,
and a portfolio that reopens five dossiers on arrival has forgotten what the collapsed state was for.

The rest of the blocks are **always in the DOM**, collapsed with `grid-template-rows: 0fr → 1fr`
rather than `hidden`. This is the mitigation for retiring the case pages: every case study stays
crawlable and findable with cmd-F. Frames are `next/image` and lazy by default, so a collapsed era
downloads nothing.

The control is a `<button>` reading `Open` / `Close`, carrying a glyph icon **beside** the word.
An icon replaces a mark, never a word — the rule from v1.8.0 holds here.

## Retiring the case pages

`app/work/[slug]/page.tsx` is deleted. `next.config` gains three permanent redirects — **written
out, not patterned**. A `/work/:slug → /#:slug` rule would be wrong: only ChessEver has an era of its
own name. Sylvan sits in Independent and Hitman's Library in Side projects, so the map is explicit:

| From | To |
| --- | --- |
| `/work/chessever` | `/#chessever` |
| `/work/sylvan` | `/#independent` |
| `/work/hitmans-library` | `/#side-projects` |

Retiring a case page in future means adding a line here. A missing line is a 404, which is the
correct failure — better than a pattern that silently sends every unknown slug to the top of the
home.

`data/changelog.ts` is **not** rewritten. Old deployment URLs are immutable and keep serving the
builds they recorded; that is exactly why deployment protection is off, and repairing history
silently is the mistake v1.12.1 already refused to make.

What is lost, accepted knowingly: one `<title>` and one OG image where there were four, and a case
study can no longer be sent as its own link. The always-in-DOM collapse recovers the crawlability
but not the shareability.

The `dynamicParams = false` fix from v1.11.0 leaves with the route. The trap it documents — a route
that must 404 sitting behind a `loading.tsx` — still applies to any future route and stays in the
README.

## Glyph treatments

Four, and only one new asset among them.

1. Era periods set in dot-matrix digits from `lib/glyph/font.ts`.
2. Era divisions drawn as dot rows via the shipped `.rule-b` / `.rule-t` utilities.
3. Frames arriving through `paintPanel` in `lib/glyph/panel.ts` — the same batched wipe the shots
   field runs, at most sixteen fills per panel per frame.
4. **New:** a `chevron-down` icon in `ICONS`, seven by seven, `leftRight` symmetry declared so
   `icons.test.ts` catches a one-cell slip.

Anything meant to be overridable by a Tailwind utility sits inside `@layer utilities`, or unlayered
author styles beat it regardless of specificity.

## Testing

`lib/eras.ts` carries the pure parts — era ordering and the lede/rest split — and is tested the way
`lib/shots-layout.ts` is: pure functions, exhaustive over the lengths that matter.

A component test asserts the unfold's `aria-expanded` and that collapsed blocks remain in the DOM,
because the second is the whole SEO argument and a refactor to `hidden` would silently undo it.

Existing tests referencing `/work/` routes are updated rather than deleted. `pnpm lint`,
`pnpm exec tsc --noEmit`, `pnpm build` and `pnpm test` pass clean before anything ships.

## Ship

Three public URLs change behaviour, so this is **v2.0.0**, not a minor. The discipline is unchanged:
changelog entry first, `vercel deploy --prod` to capture the immutable URL, record it in the entry,
commit, tag, push, final deploy — and both faces go out through `scripts/deploy.sh`, never a plain
`vercel deploy` against the portfolio project.

## Authoring, afterwards

Adding a past-year piece: drop art in `public/work/<slug>/`, run `pnpm manifest`, add the `WorkItem`
to `data/work.ts`, then list its slug in the right era's `entries` in `data/eras.ts`. Adding an era: one object, `sort` set to its end date. Ordering follows.

## Out of scope

The `/shots` page and its field. The token system, Suisse Int'l, and the shared primitives. The
DialKit. The glyph matrix and its toys. `/about` and `/colophon`. No new hue — `--miss` remains the
only one, on the one instrument that earned it.

## Success criteria

1. The first screen of the home contains work, not an index of work.
2. Every frame that lived on a case page is reachable on the home without navigating.
3. A collapsed era downloads no images, and its text is still found by cmd-F.
4. `/work/chessever`, `/work/sylvan` and `/work/hitmans-library` resolve to their eras, not to 404s.
5. Nothing on the page moves that was not touched, arriving, or reporting.
6. A new past-year piece can be added by editing data and running `pnpm manifest`, with no
   component changes.
