# What the Instruments Are Made Of — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the theme freeze and the inverted weather face, then raise the dot field's contrast toward the Nothing Glyph reference the owner named.

**Architecture:** Three defects and one rendering change. The defects are two one-line fixes and a prop; the rendering change turns `PIXEL_FLOOR` from a single constant into a per-skin value read the way every other colour on the site is read, and makes pixels round.

**Tech Stack:** Next 16.3, React 19, TypeScript, Tailwind v4, Vitest, pnpm.

**Spec:** `docs/specs/2026-09-03-the-glyph-contrast.md`

## Global Constraints

- **Only the rendering quality is taken from the reference, never the marks.** No Nothing glyph shape, typeface or trademark enters the codebase. The site's own 3×5 alphabet stays. The colophon's provenance statement must remain true.
- **`CEIL` in `lib/glyph/panel.ts` is out of scope** — it governs the image-dissolve sweep on shots and case frames, a different renderer that was measured and tuned. Do not touch it.
- Pure monochrome; `--miss` is the single admitted hue, meaning a day the step goal was missed.
- **Law 4** — nothing moves unless touched, arriving, or reporting live external state.
- Font sizes from the six-step scale (`text-2xs` … `text-xl`); `lib/type-scale.test.ts` guards a `GOVERNED` list naming only files that exist.
- **Never drive the owner's real browser, take screenshots, or run `screencapture`** — an earlier agent on this branch captured his actual desktop. Start your own server, drive your own headless browser, and prove server identity by matching `.next/BUILD_ID` in the served HTML before trusting a number.
- Every task ends green on `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` (310 tests, 30 files), `pnpm build`.

---

### Task 1: The theme freeze, and the inverted face

**Files:**
- Modify: `components/glyph-cell.tsx` (the repaint effect, around line 349)
- Modify: `components/weather-face.tsx` (around line 27)
- Modify: `components/now-playing-disc.tsx` (around line 288)
- Test: `components/glyph-cell.test.tsx`

Three defects, established by measurement. The diagnosis is at `.superpowers/sdd/theme-diagnosis.md` — **read it before starting.**

**Defect 1 — the freeze.** `next-themes` writes the theme class onto `<html>` in a ThemeProvider effect, and React flushes effects child-first. So `GlyphCell`'s `[invert, draw]` effect runs *before* the class lands: it reads the outgoing skin's ink from `getComputedStyle(canvas).color` at line 171, paints a bitmap with `invert` already flipped, and never repaints. Measured: 0 frames between the paint and the class mutation, 0 repaints across the next 179 frames, and dot contrast collapsing from 5.4:1 to 1.04:1.

Fix: paint on the next animation frame instead of inside the effect, so the class has landed and the computed colour is the incoming skin's. Cancel the frame on cleanup, or a rapid double-toggle leaves an orphaned paint.

**Defect 2 — the weather face renders inverted on light.** It takes the default `polarity="luminance"`, which is for photographs, where a value says how bright the depicted thing is and must flip with the ground. Its frames are figures — a sun, a cloud, four dots — where a value says where the marks are, and a mark is a mark on either skin. On the light skin it draws a solid black disc with a cloud-shaped hole. Every other figure consumer already passes `"ink"`. Fix: pass `polarity="ink"`.

**Defect 3 — the now-playing disc has the same inversion for its silent state**, where it draws the Spotify mark as a figure. Its artwork correctly needs luminance. The polarity must follow what is being drawn rather than being fixed for the component.

- [ ] **Step 1: Write the failing test**

The freeze is a timing bug, so the test asserts the mechanism rather than the pixels: that the repaint is scheduled on a frame rather than run synchronously in the effect.

```tsx
  it("repaints on the next frame, not inside the effect", () => {
    // next-themes writes the <html> class in its own effect, and React flushes
    // effects child-first — so painting synchronously here reads the OUTGOING
    // skin's ink and freezes it into the bitmap for good. Measured at 1.04:1
    // contrast: white dots on a white card.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    render(<GlyphCell grid={5} size={50} frame={new Float32Array(25).fill(1)} label="A" />);
    expect(frames.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
```

Add an `afterEach(() => vi.unstubAllGlobals())` if the file does not already have one, so a stub cannot leak into a sibling test.

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm exec vitest run components/glyph-cell.test.tsx`
Expected: FAIL — nothing schedules a frame today.

- [ ] **Step 3: Fix all three defects**

In `components/glyph-cell.tsx`'s `[invert, draw]` effect, schedule `draw` on a frame and cancel it on cleanup. Keep the docblock's reasoning about why ink flips with the skin, and add why the paint is deferred — a future reader will otherwise "simplify" it straight back into the bug.

In `components/weather-face.tsx`, pass `polarity="ink"`.

In `components/now-playing-disc.tsx`, make the polarity follow the content: luminance while artwork is showing, ink for the silent mark.

- [ ] **Step 4: Verify by measurement**

Build, start your own server on a free port, prove identity via `.next/BUILD_ID`, and drive your own headless browser. Toggle the theme **both** directions with the site's own control, and after each toggle sample the canvas pixels of all four faces and compute their contrast against the card behind them. Every face must clear 4:1 on both skins. Also confirm the weather face draws a figure rather than a disc-with-a-hole on the light skin.

- [ ] **Step 5: Commit**

```bash
pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "A canvas cannot repaint itself: flip the ink on the next frame"
```

---

### Task 2: The contrast

**Files:**
- Modify: `lib/glyph/pixel.ts`, `lib/glyph/pixel.test.ts`
- Modify: `components/glyph-cell.tsx` (reads the floor)
- Modify: `app/globals.css` (the per-skin floor)

The owner named Nothing's Glyph interface and chose **contrast over density** — the same number of dots, rendered much harder.

**What is actually flattening the field.** A lit dot already reaches full opacity: `alpha = floor + value * (1 - floor)`. It is the floor. `PIXEL_FLOOR = 0.16` puts every unlit dot at 16% ink permanently — around six hundred of them on a 25×25 field — and the picture sits on a grey wash.

**Three changes:**
1. **The floor drops**, so an unlit dot reads as off.
2. **Pixels become circles.** `PIXEL_ROUNDING = 0.26` draws rounded squares; an LED is round. Note `GlyphCell` already draws a true arc when `pixel="round"` — the rounding constant governs the square path and the SVG renderers (`GlyphIcon`, `GlyphText`), so changing it changes those too. Decide deliberately whether the icons and numerals should also become circular, and say what you chose.
3. **The gap tightens slightly** via `PIXEL_FILL`, so the lattice reads as a matrix rather than a texture.

**The tension, which must be resolved rather than bulldozed.** The codebase's own reasoning is that an unlit cell should be *"an LED, not a hole"* — present rather than absent. That holds on the dark skin, where near-black still reads as a surface. On the light skin a floor near zero leaves the field genuinely empty. **So the floor differs per skin**: low on dark, higher on light. It stops being one constant and becomes two, read from the skin the way every other colour on this site is read — a CSS custom property in `app/globals.css`, defined in `:root` and overridden in `.dark`, which `GlyphCell` reads alongside the ink it already reads at line 171.

- [ ] **Step 1: Write the failing test**

```ts
// lib/glyph/pixel.test.ts — add
describe("the pixel", () => {
  it("is a circle, because an LED is", () => {
    const { side, radius } = pixelGeometry(10);
    expect(radius).toBeCloseTo(side / 2, 5);
  });

  it("leaves a gap, or the field stops being a matrix", () => {
    const { side } = pixelGeometry(10);
    expect(side).toBeLessThan(10);
    expect(side).toBeGreaterThan(6);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails, then make the changes**

Set `PIXEL_ROUNDING` so a pixel is a true circle, tighten `PIXEL_FILL`, and move the floor into `app/globals.css` as a custom property with a light and a dark value. Have `GlyphCell` read it beside the ink, falling back to a constant when the property is missing so a test environment without the stylesheet still paints. Keep `PIXEL_FLOOR` exported as that fallback.

Update the docblock in `lib/glyph/pixel.ts`: it currently asserts a single floor and says why. It now needs to say why there are two, and that the reasoning behind the floor was right and is preserved rather than discarded.

- [ ] **Step 3: Verify by measurement**

Same discipline as Task 1. On each skin, sample an unlit region and a lit region of a face and report both, so the contrast between them is a number rather than an impression. Confirm the unlit field still reads as a present panel on the light skin — that is the constraint that stops this becoming a bulldoze.

- [ ] **Step 4: Commit**

```bash
pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "An unlit dot is off, and a pixel is round"
```

---

### Task 3: Ship — requires the owner's explicit go-ahead

Unchanged from the previous plan and still withheld: README, changelog entry, `vercel deploy --prod`, record the immutable URL, commit, tag `v2.0.0`, push, then `./scripts/deploy.sh` for both faces.

## Success criteria

1. Toggling the theme repaints every canvas face to the incoming skin's ink, both directions, no field left holding the outgoing paint.
2. Dot contrast against its card stays above 4:1 on both skins after a toggle, measured.
3. The weather face draws a figure on both skins — never a solid disc with a hole.
4. The now-playing disc draws artwork as luminance and its silent mark as a figure.
5. An unlit field reads as off on dark and as a present panel on light.
6. Every pixel is a circle.
7. No Nothing glyph shape, typeface or trademark enters the codebase, and the colophon's provenance statement remains true.
