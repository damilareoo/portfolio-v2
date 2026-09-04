# The Second Pass

The first pass built the instruments. This one makes them worth looking at, and
takes the parts of the site that were left as scaffolding — the hero, the About
page, the colophon — and finishes them.

Reference named by the owner: `sophia-liu.work`. What is taken from it is the
*shape* of a hero that states experience and curiosity in two sentences, the
case-study card that carries a logo and an explicit way in, and the light
ground. Nothing of her content, and none of her accent hues.

## The four decisions

**1. The neutral ramp goes warm.** Her palette is not pure grey: `#32312f`
text, `#8e8d86` muted, `#f5f3f2` frames, on a `#fcfcfc` ground. The owner chose
to adopt it rather than only borrow the brightness.

This retires *pure monochrome* as a law of the language. Three things assert it
today and all three must move in the same commit, or the site starts lying
about itself:

- `app/colophon/page.tsx` states the monochrome claim in prose.
- `app/system/page.tsx` prints the tokens and has printed stale values before.
- `app/layout.tsx`'s `themeColor` carries `--bg` by hand for both skins.

`--miss` remains the one admitted *hue* and still means exactly one thing: a day
the step goal was missed. A warm neutral is not a hue for this purpose — but the
colophon must say so in words rather than leaving the old claim standing.

The glyph floors (`--pixel-floor`, `0.1` light / `0.05` dark) were tuned against
pure-neutral grounds days ago. A warmer, brighter ground changes what they read
as. They are re-measured after the ramp lands, not before.

**2. The type dial is removed entirely.** The control, `lib/settings.tsx`,
`lib/dial-turns.tsx` and `app/api/dial-turns` all go. The visitor turn-count is
lost, and the owner accepted that.

The dial is the reason every size on the site is in `rem` and the reason
`lib/type-scale.test.ts` forbids arbitrary sizes. With it gone, `clamp()` and
viewport units become available to type for the first time. The six-step scale
stays as the vocabulary; the test is relaxed to permit fluid steps, not
abandoned — the defect it was written against was nine sizes chosen per
component, and that defect is unrelated to the dial.

**3. The colophon gets a game with a shared register and public comments.**
Persistence is real, not `localStorage`: every visitor sees the same record.

Provider selection runs through Vercel marketplace discovery rather than being
hardcoded. Two things are required before it is public, and neither is
optional: rate limiting on the write path, and a moderation route for comments.
A free-text field on a personal site that anyone can write to is an abuse
surface, and shipping it without a way to remove what lands there is not a
finished feature.

**4. The About ladder is built from the three roles that exist.** Endgame AI
(Apr–Aug 2026), ChessEver (Apr 2025–Apr 2026), HEX (Mar 2025–Apr 2026). Two run
concurrently and the whole span is sixteen months.

This is recorded because it constrains the design, and the owner chose it
knowingly: a line animation travelling "from where I started to my last role"
has almost no distance to cover, and two of the three roles overlap, so a
strict ladder would draw a rung that is not there. The honest form is a
*timeline that admits concurrency* — two tracks that run beside each other and
converge — rather than a staircase. If earlier history arrives, the same
component takes it without redesign.

## What is wrong now, measured

Captured from a headless instance on localhost, not from the owner's screen.

**The clock has no seconds hand.** `lib/clock.ts` returns `{hour, minute}`;
seconds exist only as a fraction folded into the minute hand. The tick is a bare
`setInterval(…, 1000)`, which drifts and never lands on the second boundary.

**The disc's progress arc cuts through the artwork.** `ARC_SCALE = 1.09` is
meant to hold the ring clear of the dots at any size. It does not: the disc
width (`DISC`) and the arc scale are computed independently from the same
intent, so they can collide. The comment above `ARC_SCALE` already describes
this exact failure as fixed. It is not.

**The sleeve is unreadable.** The 48×48 luminance mapping flattens most covers
to a grey blob. The image is present and carries no information.

**The pedometer slides a sprite.** `walkFrame` translates a figure along a
static dotted track over 1100ms, on an out-cubic, retriggered only by turning to
the page. There is no gait: nothing about the figure changes as it travels, so
it reads as a decal on a wire rather than something walking.

**"Open case study" is styled as a footnote.** `text-2xs` — the smallest size on
the site — uppercase mono in `text-ink-3`, with a small glyph pushed to the far
right. It is the primary action on the page's most important element and it is
quieter than every caption around it.

## The order

Each phase ends green and is reviewable on its own.

1. **The instruments.** Clock seconds, the arc geometry, sleeve legibility, the
   pedometer's gait. No new surfaces; the defects above, fixed.
2. **The ramp and the dial.** Warm neutrals, the dial removed, type re-set on a
   fluid scale. Colophon and `/system` corrected in the same commit. Glyph
   floors re-measured after.
3. **The hero and the case-study card.** Two sentences — what was owned, what is
   being done now — company marks, and a way into a case study that reads as an
   action. Collaborators become a field on the case data.
4. **About.** The timeline, its line animation, and the personal images.
5. **Colophon.** Succinct rewrite, then the game, the register, and comments.

The footer's own redesign rides with phase 3, where the hero settles what the
page's voice is.

## What does not change

- Law 4. A second hand reports live external state, which is the clause that
  admits continuous motion. A gait cycle driven by distance walked is the same
  arrival the walk already is, not a new loop.
- The frame cap at 78svh, and the dotted-rule vocabulary.
- The glyph engine's two-renderer split, and `CEIL` in `lib/glyph/panel.ts`.
- `data/changelog.ts` and everything under `docs/specs/` remain historical
  records. Neither is edited to match the present.

## Amendment, 2026-09-04: decision 1 is reversed in part

The warm ramp shipped, the owner looked at it, and did not want the cast. The
hue is out; the ground stays.

What this keeps from decision 1: `--bg` is `#fcfcfc`, the frame crosses below
the ground, and every contrast gain the ramp made. Each grey now in the
stylesheet was chosen by matching the relative luminance of the warm value it
replaces, level for level, so no ratio moved by more than 0.02.

What it reverses: pure monochrome is the law again. `lib/contrast.test.ts`
enforces equal channels, and the colophon and `/system` say grey rather than
warm. `--miss` remains the single admitted hue.

The section above is left as written. It records what was decided at the time
and why, which is the part worth keeping.
