# Portfolio v2 — The Instrument Wall

Date: 2026-09-03
Status: awaiting approval
Extends: `2026-08-13-design-language.md` (the four laws)
Supersedes: the labelled card grid and the hero of `2026-09-02-the-instrument-bank.md`.

## Why this document exists

The bank fixed the sizing chaos and introduced a new problem. Seen on a screen, the owner's judgement:
*"the footer is too chaotic. there's no need to label the widgets… size currently feels too small…
footer design is really boring."*

Three separate faults, and they compound:

1. **The labels are noise.** Every card prints a mono label above its reading — `LAGOS`, `WEATHER`,
   `MUSIC`, `STEPS` — beside a face that already says what it is. A clock looks like a clock.
2. **96px is too small.** The faces read as icons rather than instruments, and the grid's wide cells
   leave them stranded in dead space.
3. **The arrangement has no personality.** A row of bordered cards under a rule is the default
   answer, and this site's whole argument is that it does not take default answers.

The hero has its own fault: the name is buried in a metadata line beneath the statement, and there
is no way to start a conversation from the page. And the three products never say they are featured.

## What the user chose

Binding.

- **The footer becomes an instrument wall.** The readings ARE the footer — large, edge to edge, no
  labels, like the front of a piece of equipment. Nothing competes with them; the links reduce to
  one quiet line beneath.
- **Faces fill their cell** rather than sitting at a fixed size inside it.
- **The hero leads with the name, in bold**, then the copy, then a **Book a call** control in the
  site's own language.
- **Featured work is announced**, with a heading and the count set in the dot alphabet.
- **No colour.** A different footer ground was considered and declined. The wall is monochrome like
  everything else.

## 1 · The wall

One row of four readings, flush against each other, spanning the full measure. No card borders
between them and no labels above them — a hairline divides one reading from the next, and the
outer edge is the page's own rule.

Each reading is a face and its value, nothing else. **The value carries the meaning the label used
to**: `07:42` is plainly a time, `26°` a temperature, `Silent` a state of playback, `3,600` a step
count. A face that cannot read still says so — the em dash rule is unchanged and is not negotiable.

**The face fills its cell.** No fixed pixel measure: the face takes the width the cell gives it,
square, so the wall grows with the viewport instead of stranding four small discs in wide cells.
Two across on a phone, four from the tablet breakpoint — never one, because a column of readings
is a list.

**Interaction stays touch-driven.** A reading lifts under the pointer; the steps reading turns
between its three faces when pressed or arrowed. The wall plays one staggered arrival on first
view. Nothing idles, loops, or animates on scroll — Law 4 is not amended for this.

**Beneath the wall**, one line: the name, then the links. That line is the whole of the footer's
remaining chrome.

## 2 · The hero

Three parts, in this order:

1. **The name, bold, and first.** It stops being metadata at the bottom of the block and becomes
   the thing that opens the page. The apostrophe mark stays.
2. **The statement.** The existing copy, unchanged in this document — the owner is rewriting that
   sentence himself and it is not this spec's to touch.
3. **Book a call.** A control in the site's own language, not a coloured button: the filled-chip
   treatment `SiteNav` already uses for the current surface, at a size that reads as a call to
   action and meets the 44px touch floor. It links to Calendly.

The email and location stay reachable, beneath or beside the control.

## 3 · Featured work

A heading above the three products: the words, and the count in the 3×5 dot alphabet that already
renders the site's numerals. It sits on the rule that currently separates the hero from the work,
so the page gains a section without gaining a band.

## Out of scope

The hero statement's wording. `/shots`, `/about`, `/colophon`, `/changelog`, `/system`. The case
reel's frame treatments. The type scale and the retuned skins. `data/changelog.ts` and
`docs/specs/`, which are historical records.

## Open dependency

**The Calendly handle.** The owner's handle is `damilareoo` on X, GitHub, LinkedIn, v0, Layers,
Substack and Contra, so `calendly.com/damilareoo` is the well-founded inference and is what ships.
It is recorded here as an inference rather than a fact, and the owner confirms or corrects it.

## Success criteria

1. No reading in the footer carries a text label; the value alone identifies it.
2. Faces scale with their cell rather than sitting at a fixed pixel size, at every breakpoint.
3. The wall is two across on a phone and four from the tablet breakpoint, never one.
4. A reading that cannot read still shows the em dash, and never a stale or invented value.
5. Nothing in the footer moves except under touch, while reporting live state, or in the single arrival.
6. The hero reads name, then statement, then a Book a call control that meets the 44px touch floor.
7. The three products are announced as featured work, with the count in the dot alphabet.
8. No route scrolls horizontally at any width from 320px up.
