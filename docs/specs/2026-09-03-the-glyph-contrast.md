# Portfolio v2 — What the Instruments Are Made Of

Date: 2026-09-03
Status: awaiting approval
Extends: `2026-08-13-design-language.md`, `2026-09-03-the-instrument-wall.md`

## Why this document exists

The owner reported two things: *"theme switching is not so great, mainly on the widgets"* and
*"still believe the widget designs can be much more excellent… it should look exactly like the
nothing glyph language."*

A diagnosis established that the first is not a matter of taste. It is a bug, and a severe one; and
one of the four faces is rendering inverted on the light skin. Those two account for much of the
second complaint. What remains after them is a real design gap, and it has a specific cause.

## 1 · The theme freeze

`next-themes` writes the theme class onto `<html>` inside a ThemeProvider effect. React flushes
effects child-first, so `GlyphCell`'s repaint effect runs **before** that class lands: it reads the
outgoing skin's ink from `getComputedStyle(canvas).color`, paints a bitmap with `invert` already
flipped to the incoming skin, and never repaints. A canvas holds what it was given.

Measured: the canvas paints 0.2–0.6ms before the class mutation, in the same task, with zero frames
between, and zero repaints across the following three seconds and 179 animation frames. Dot
contrast against the card collapses from 5.4:1 to **1.04:1** — white dots on a white ground going
light, black on black going dark. Hovering a field repaints that field alone.

**The fix is to paint on the next frame rather than in the effect**, by which time the class has
landed and the computed colour is the incoming skin's. The system-preference path is already
correct — `next-themes` applies the class synchronously in its `matchMedia` listener — and so is
first load. Only the explicit toggle is broken, in both directions.

## 2 · The inverted weather face

`weather-face.tsx` takes the default `polarity="luminance"`. That polarity is for **photographs**,
where a value says how bright the depicted thing is and therefore must flip with the ground. The
weather frames are **figures** — a sun, a cloud, four dots — where a value says where the marks are,
and a mark is a mark on either skin.

So on the light skin the face renders as a solid black disc with a cloud-shaped hole punched in it.
Every other figure consumer in the codebase already passes `polarity="ink"`; this one was missed.

The now-playing disc has the same inversion for its **silent** state, where it draws the Spotify
mark as a figure. Its *artwork* correctly needs luminance. The polarity there must follow what is
being drawn rather than being fixed for the component.

## 3 · The contrast

The reference the owner named is Nothing's Glyph interface, which this site is already an
acknowledged homage to — the colophon records that no Nothing code, assets or trademarks are used,
and that statement stays true. **This document takes the rendering quality, not the marks.** The
3×5 alphabet stays the site's own; no Nothing typeface, glyph shape or trademark is copied.

The owner chose **contrast over density**: the same number of dots, rendered much harder.

What makes that matrix read is that a lit LED is unambiguously on and the field behind it is
nearly off. This site's field is not. `PIXEL_FLOOR = 0.16` puts **every unlit dot at 16% ink,
permanently** — six hundred of them on a 25×25 field — and the picture sits on top of that grey
wash. A lit dot already reaches full opacity; it is the floor that flattens everything.

Three changes, and one tension to resolve rather than bulldoze:

- **The floor drops**, so an unlit dot reads as off.
- **Pixels become circles.** `PIXEL_ROUNDING = 0.26` draws rounded squares; an LED is round.
- **The gap tightens slightly**, so the lattice reads as a matrix rather than a texture.

**The tension.** The codebase's own reasoning for the floor is that an unlit cell should be *"an
LED, not a hole"* — a panel that is present rather than absent. Nothing's matrix does exactly that
on black plastic, where near-black still reads as a surface. On a light ground it does not: a floor
near zero leaves the field genuinely empty. **The floor therefore differs per skin** — low enough
on dark that the field is nearly off, high enough on light that the panel is still a panel. It stops
being one constant and becomes two, read from the skin like every other colour on the site.

## Out of scope

`CEIL` in `lib/glyph/panel.ts`, which governs the image-dissolve sweep on shots and case frames —
a different renderer, measured and tuned, and not what the owner is looking at. The 3×5 alphabet.
The wall's layout. Anything under `docs/specs/` or `data/changelog.ts`.

## Success criteria

1. Toggling the theme repaints every canvas face to the incoming skin's ink, in both directions,
   with no field left holding the outgoing skin's paint.
2. Dot contrast against its card stays above 4:1 on both skins after a toggle, measured.
3. The weather face draws a figure on both skins — never a solid disc with a hole in it.
4. The now-playing disc draws its artwork as luminance and its silent mark as a figure.
5. An unlit field reads as off on the dark skin and as a present panel on the light one.
6. Every pixel is a circle.
7. No Nothing glyph shape, typeface or trademark enters the codebase, and the colophon's
   provenance statement remains true.
