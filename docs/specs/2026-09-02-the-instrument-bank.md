# Portfolio v2 — The Instrument Bank, and Three Products

Date: 2026-09-02
Status: awaiting approval
Extends: `2026-08-13-design-language.md` (the four laws), `2026-09-02-instrument-and-mosaic-design.md`
Supersedes: that document's hero band (§2), its footer echo, and its four-product home.

## Why this document exists

The instruments shipped and, seen on a screen, they are badly composed. The user's words: *"I think this is badly done."* The screenshot shows why, and it is a composition failure rather than a rendering one:

- **Four widgets at four sizes.** A large Spotify disc, a medium steps card, a small clock face, a medium weather disc. No shared size, no shared baseline, no grid.
- **Two zones that do not relate.** The bay sits above a rule, the clock and weather below it, as though two different people added them.
- **The hero pair adds nothing.** Duplicating the instruments at the top spent the first screen on a reading nobody came for.

Three further judgements, from the same message: the hero *"is flat, says no details"*; the copy across the whole site wants doing properly; and the case images sit flat on the page when they should look considered.

## What the user chose

Binding.

- **The footer becomes a widget grid: every instrument the same card.** Same size, same radius, same baseline, one grid. The reference is footer.design, whose good examples commit to one archetype rather than mixing several.
- **The instruments leave the hero entirely.** They live in the footer, once.
- **Law 4 stands unamended.** Motion is touch-driven — hover, press, drag, swipe — plus the reporting an instrument does while it is live. Nothing idles, loops, or animates on scroll. An amendment was offered and declined.
- **The hero carries a real statement about the work**, not a job title.
- **The case images want better treatment** — plates, insets, captions, framing that makes the work look considered.
- **Three products, in this order: Hitman's Library, Sylvan, ChessEver.** Endgame.ai comes off the home; the user will add a project when they want one.

## 1 · The instrument bank

One grid. Every instrument is a card of identical footprint — same square, same radius, same padding, same label position. What differs is only what the card *reads*.

**Four cards today**, and the model must take a fifth without a redesign:

| Card | Reads | Live? |
| --- | --- | --- |
| Time | Lagos, analogue face | yes, continuously |
| Weather | Lagos conditions, temperature | yes, on a 15-minute cadence |
| Now playing | current track, as the dot disc | yes, while something plays |
| Steps | today against the goal | yes, while the day runs |

Each card carries its reading and one mono label beneath, in the same slot on every card. **A card that cannot read says so** — the unreported state already exists in the glyph engine and is used, never a blank card and never a stale value.

**The grid is the point.** Four across at the full measure, two across on a tablet, two across on a phone — never one, because a single column of four cards is a list rather than a bank. Cards keep their square footprint at every breakpoint; the grid reflows, the card does not distort.

Two-up at 320px puts a card at roughly 140px, which is ample for a face that is legible at 56px today. If measurement contradicts that at the narrowest width, **the card shrinks and the two-column grid holds** — a one-column bank is the thing this section exists to prevent.

**The existing `GlyphBay` is absorbed.** It is a three-face pager holding the Spotify disc, the steps faces and a hidden fourth page. Its faces become cards in the bank; its hidden page — the glyph matrix easter egg, shipped in v1.3.0 — is preserved exactly, reachable by the same means and advertised by none of them. That easter egg is not up for redesign.

### Interaction

Touch-driven, so Law 4 holds without amendment:

- A card lifts under the pointer, the way playground tiles have since the design language was written ("if it looks like a card, it lifts").
- Pressing a card turns it over to a second face where it has one — the steps card between today and the week, the now-playing card between art and title. This is the pager the bay already implements, moved onto a card.
- The bank plays one staggered arrival the first time it enters the viewport, under the law's "arriving" clause, and never again.

Nothing else moves. No idle, no loop, no scroll-linked transform.

## 2 · The hero

The instruments come out. What remains must earn the first screen on its own.

A statement, set large, in the site's own plain register — what the work is, who it is for, what it is after. Not a job title, not a skills list. Beneath it, the identity line and the way to make contact. Then `01` begins.

**Copy is in scope across the site**, not only here: the hero statement, the three product one-liners, the unfold bar, the instrument labels, the footer, and the metadata descriptions. The rule is the one this project already keeps — one line per idea, plain, no literary narration. Short does not mean thin: the current *"Product designer and builder creating 0–1 experiences"* is short and says nothing a hundred other portfolios do not.

The copy in this document's implementation is a **draft for the user to edit**, not a fait accompli. It is their portfolio and their voice; the plan supplies something specific enough to react to.

## 3 · Three products

`01 Hitman's Library` · `02 Sylvan` · `03 ChessEver`, in exactly that order.

The order is **authored, not derived**. It is not reverse chronological — all three are 2025 — and no `sort` field is introduced to justify it: the array's order in `data/work.ts` is the page's order, which is already how the home reads it.

**Endgame.ai is removed from the home**, and its `WorkItem` deleted rather than orphaned. Its authored-empty block list was furniture for artwork that never arrived; when the user adds a project they will add its data with its art. The three redirects in `next.config.ts` are unaffected — Endgame never had one.

### The image treatment

The case reel's blocks — `full`, `pair`, `inset`, `text`, `quote` — stay as a vocabulary. What changes is how a frame *presents*:

- **A plate under the work.** An inset already tints its ground; that treatment extends so a frame reads as held rather than pasted, with generous padding and the surface separation the retuned skins now actually provide on both skins.
- **Captions that say something.** A caption is currently optional and mostly absent. Every frame that benefits from one gets one, in the mono micro-label style already used for years and metadata.
- **Device framing where the artwork is a screen.** A phone capture reads as a phone; a site capture reads as a browser. Drawn in the site's own tokens — a hairline, a radius, no chrome imitation, no shadow.
- **Full-bleed for the piece that deserves it.** One frame per case may break the column and run the full measure. Which one is authored, not computed.

## Out of scope

`/shots` and its mosaic. `/about`, `/colophon`, `/changelog`, `/system`. The DialKit. The glyph matrix easter egg and its hidden page, which are preserved as-is. The redirects. The type scale and the retuned skins, both settled and tested. `data/changelog.ts` and `docs/specs/`, which are historical records.

## Success criteria

1. Every card in the bank has identical footprint, radius, padding and label placement; only the reading differs.
2. The bank reflows to two columns on a tablet and two on a phone, and no card distorts at any width.
3. A card that cannot read says so; no card is ever blank, and no stale reading is shown as current.
4. Nothing in the footer moves except under touch, while reporting live state, or in the single arrival.
5. The hero carries a statement about the work and no instruments.
6. The home shows exactly three products, ordered Hitman's Library, Sylvan, ChessEver.
7. Every case frame is presented — plated, captioned, or framed — rather than sitting flat on the page.
8. No route scrolls horizontally at any width from 320px up, and the bank is legible on a phone.
9. The glyph matrix easter egg remains reachable exactly as before, by the same means, advertised by none of them.
