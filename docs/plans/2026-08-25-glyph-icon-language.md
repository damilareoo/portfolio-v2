# Glyph Icon Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dot matrix the site's icon language — six SVG icons and dotted separator rules drawn on the same grid, from the same constants, as the canvas instruments.

**Architecture:** The pixel-drawing constants move out of `components/glyph-cell.tsx` into `lib/glyph/pixel.ts` so both renderers read one source. Icons are 7×7 bit arrays in `lib/glyph/icons.ts`, rendered by `components/glyph-icon.tsx` — a **server** component emitting one SVG rect per lit cell in `currentColor`. Separator borders become a CSS background-image rule on the same cell pitch. Canvas stays for instruments that move; SVG serves marks that do not.

**Tech Stack:** Next.js (see `AGENTS.md` — read `node_modules/next/dist/docs/` before writing framework code), React 19 server components, Tailwind v4 (`@theme inline` in `app/globals.css`), TypeScript, Vitest.

**Spec:** `docs/specs/2026-08-25-glyph-icon-language.md`

## Global Constraints

- **No accent hue.** The site is monochrome; the only exception is `--miss` on the pedometer calendar. Icons draw in `currentColor` and inherit `ink` / `ink-2` / `ink-3`.
- **Law 4:** nothing moves unless touched, arriving, or reporting. Icons never animate on their own and are explicitly denied the arrival sweep.
- **Sizes in `rem` / `em`, never `px`,** or the type dial cannot reach them. (Rule thickness in `globals.css` is the one exception — it is a hairline, not type.)
- **Icons replace a mark, never a word.** No text label becomes an icon.
- **Versioning discipline:** every change gets a `data/changelog.ts` entry before it ships. See Task 7.
- **Unlit icon cells are not drawn.** Per v1.6.0: the widget cards "quote the LED panel rather than imitate it, so a cell that is off is simply not there." Icons follow the card rule, not the field rule.
- Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm test` before every commit. All three pass clean today (181 tests); they must stay that way.

---

### Task 1: The shared pixel hand

Extracts the three pixel constants so canvas and SVG cannot drift apart.

**Files:**
- Create: `lib/glyph/pixel.ts`
- Test: `lib/glyph/pixel.test.ts`
- Modify: `components/glyph-cell.tsx:39-43` (constants), `:107` (`unlit` default), `:208-209` (draw)

**Interfaces:**
- Consumes: nothing.
- Produces: `PIXEL_FILL: number`, `PIXEL_ROUNDING: number`, `PIXEL_FLOOR: number`, `pixelGeometry(cell: number): { side: number; radius: number; offset: number }`.

- [ ] **Step 1: Write the failing test**

Create `lib/glyph/pixel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PIXEL_FILL, PIXEL_FLOOR, PIXEL_ROUNDING, pixelGeometry } from "./pixel";

describe("the shared pixel", () => {
  it("keeps a gap — a pixel never fills its cell", () => {
    // At 1 the field becomes a sheet and stops being a matrix at all.
    expect(PIXEL_FILL).toBeGreaterThan(0);
    expect(PIXEL_FILL).toBeLessThan(1);
  });

  it("turns corners by no more than half the pixel", () => {
    // Beyond half a side the rounding would make it a circle, not a pixel.
    const { side, radius } = pixelGeometry(10);
    expect(PIXEL_ROUNDING).toBeGreaterThan(0);
    expect(radius).toBeLessThanOrEqual(side / 2);
  });

  it("centres the pixel in its cell", () => {
    const cell = 10;
    const { side, offset } = pixelGeometry(cell);
    expect(offset * 2 + side).toBeCloseTo(cell);
  });

  it("keeps an unlit pixel present rather than absent", () => {
    // An LED that is off is dark, not missing. The field draws this floor;
    // icons do not, which is a renderer's choice and not this value's.
    expect(PIXEL_FLOOR).toBeGreaterThan(0);
    expect(PIXEL_FLOOR).toBeLessThan(1);
  });

  it("scales with the cell", () => {
    expect(pixelGeometry(20).side).toBeCloseTo(pixelGeometry(10).side * 2);
    expect(pixelGeometry(20).radius).toBeCloseTo(pixelGeometry(10).radius * 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/glyph/pixel.test.ts`
Expected: FAIL — `Failed to resolve import "./pixel"`.

- [ ] **Step 3: Write the implementation**

Create `lib/glyph/pixel.ts`:

```ts
/**
 * How one pixel is drawn, for every renderer in the language.
 *
 * These lived inside glyph-cell.tsx while the canvas was the only thing that
 * drew a pixel. Two renderers only make one language if they draw from the same
 * numbers, so they live here now: tuning the field retunes every icon, and
 * nothing can quietly disagree.
 */

/* How much of its cell a pixel fills, and how far its corners are turned. The
   gap is deliberate and is most of the character: at 1 the field becomes a
   solid sheet, and the language stops being a matrix at all. */
export const PIXEL_FILL = 0.74;
export const PIXEL_ROUNDING = 0.26;

/** What an unlit pixel is still worth. Dark, but present — an LED, not a hole. */
export const PIXEL_FLOOR = 0.16;

export type PixelGeometry = {
  /** The drawn side of the pixel. */
  side: number;
  /** Corner radius. */
  radius: number;
  /** Inset from the cell's edge, so the pixel sits centred in its cell. */
  offset: number;
};

/** The geometry one pixel is given inside a cell of `cell` units. */
export function pixelGeometry(cell: number): PixelGeometry {
  const side = cell * PIXEL_FILL;
  return { side, radius: side * PIXEL_ROUNDING, offset: (cell - side) / 2 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/glyph/pixel.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Rewire the canvas to the shared source**

In `components/glyph-cell.tsx`, delete the three local constants at lines 39–43 (keep the comments by moving them — they now live in `pixel.ts`), and add to the imports:

```ts
import { PIXEL_FLOOR, pixelGeometry } from "@/lib/glyph/pixel";
```

At line ~107 the `unlit` prop default stays `PIXEL_FLOOR` — it now resolves to the import.

Replace the two draw lines (~208–209):

```ts
    const side = cellSize * PIXEL_FILL;
    const radius = side * PIXEL_ROUNDING;
```

with:

```ts
    const { side, radius } = pixelGeometry(cellSize);
```

- [ ] **Step 6: Verify nothing about the instruments changed**

Run: `pnpm test`
Expected: PASS — 186 tests (181 existing + 5 new). The existing `components/glyph-cell.test.tsx` must pass untouched; it asserts one arc per cell and is the guard that the canvas still draws identically.

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: both clean, no output.

- [ ] **Step 7: Commit**

```bash
git add lib/glyph/pixel.ts lib/glyph/pixel.test.ts components/glyph-cell.tsx
git commit -m "The pixel constants become shared, not the canvas's own

Two renderers only make one language if they draw a pixel from the same
numbers. Moving these out of glyph-cell.tsx is what stops an icon and the
field from quietly disagreeing the first time the field is tuned.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The icon set

Six icons as 7×7 bit arrays, authored the way `font.ts` authors letters.

**Files:**
- Create: `lib/glyph/icons.ts`
- Test: `lib/glyph/icons.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ICON_GRID: 7`, `type IconName = "light" | "dark" | "system" | "arrow-out" | "arrow-left" | "arrow-right"`, `type Symmetry = "both" | "leftRight" | "topBottom" | "none"`, `ICONS: Record<IconName, { bits: number[]; symmetry: Symmetry }>`, `litCells(name: IconName): { x: number; y: number }[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/glyph/icons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ICON_GRID, ICONS, litCells, type IconName } from "./icons";

const names = Object.keys(ICONS) as IconName[];

/** Rows of the icon, top to bottom. */
const rows = (name: IconName) => {
  const { bits } = ICONS[name];
  return Array.from({ length: ICON_GRID }, (_, r) =>
    bits.slice(r * ICON_GRID, r * ICON_GRID + ICON_GRID),
  );
};

describe("the icon set", () => {
  it("draws every icon on the same square grid", () => {
    expect(ICON_GRID).toBe(7);
    for (const name of names) {
      expect(ICONS[name].bits, name).toHaveLength(ICON_GRID * ICON_GRID);
    }
  });

  it("admits only lit or unlit — an icon has no half tones", () => {
    for (const name of names) {
      for (const bit of ICONS[name].bits) expect([0, 1], name).toContain(bit);
    }
  });

  it("draws something, and never everything", () => {
    // An empty icon is a bug that renders as nothing; a full one is a square.
    for (const name of names) {
      const lit = ICONS[name].bits.filter(Boolean).length;
      expect(lit, name).toBeGreaterThan(0);
      expect(lit, name).toBeLessThan(ICON_GRID * ICON_GRID);
    }
  });

  it("mirrors exactly where it claims to — 49 bits by hand is a typo waiting", () => {
    for (const name of names) {
      const { symmetry } = ICONS[name];
      const grid = rows(name);

      if (symmetry === "both" || symmetry === "leftRight") {
        for (const row of grid) expect([...row].reverse(), name).toEqual(row);
      }
      if (symmetry === "both" || symmetry === "topBottom") {
        expect([...grid].reverse(), name).toEqual(grid);
      }
    }
  });

  it("makes the two arrows each other's reflection", () => {
    const left = rows("arrow-left");
    const right = rows("arrow-right");
    expect(left.map((row) => [...row].reverse())).toEqual(right);
  });

  it("reports lit cells as coordinates, unlit ones not at all", () => {
    const cells = litCells("arrow-left");
    expect(cells).toHaveLength(ICONS["arrow-left"].bits.filter(Boolean).length);
    // The shaft is the middle row, running the full width.
    const middle = cells.filter((cell) => cell.y === 3).map((cell) => cell.x);
    expect(middle).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/glyph/icons.test.ts`
Expected: FAIL — `Failed to resolve import "./icons"`.

- [ ] **Step 3: Write the implementation**

Create `lib/glyph/icons.ts`:

```ts
/**
 * The site's icon language: 7x5 is the alphabet, 7x7 is the icon.
 *
 * Seven cells square, for three reasons that agree. Odd, so it has a true
 * centre — a sun needs one and an even grid has to break its own symmetry to
 * find a middle. Five plus one above and one below, so an icon standing beside
 * a word inherits the letterform's optical alignment instead of being nudged.
 * And seven is the fewest cells that keeps a diagonal arrow and a chevron
 * distinct; at five they resolve to the same shape.
 *
 * Authored as seven rows of seven, laid out so the icon reads as a picture in
 * the source — the same hand font.ts draws its letters with.
 */
export const ICON_GRID = 7;

export type IconName =
  | "light"
  | "dark"
  | "system"
  | "arrow-out"
  | "arrow-left"
  | "arrow-right";

/**
 * Which reflections an icon claims. Declared rather than inferred, so the test
 * can catch a one-cell slip that is invisible in review and obvious on the page.
 */
export type Symmetry = "both" | "leftRight" | "topBottom" | "none";

export type Icon = { bits: number[]; symmetry: Symmetry };

export const ICONS: Record<IconName, Icon> = {
  // A hollow disc with four cardinal and four diagonal rays.
  light: {
    symmetry: "both",
    bits: [
      0,0,0,1,0,0,0,
      0,1,0,0,0,1,0,
      0,0,1,1,1,0,0,
      1,0,1,0,1,0,1,
      0,0,1,1,1,0,0,
      0,1,0,0,0,1,0,
      0,0,0,1,0,0,0,
    ],
  },

  // A crescent opening to the right. Mirrors top to bottom and not side to
  // side, which is what makes it a crescent rather than a bracket.
  dark: {
    symmetry: "topBottom",
    bits: [
      0,0,1,1,1,0,0,
      0,1,1,1,0,0,0,
      1,1,1,0,0,0,0,
      1,1,1,0,0,0,0,
      1,1,1,0,0,0,0,
      0,1,1,1,0,0,0,
      0,0,1,1,1,0,0,
    ],
  },

  // A display on a stand: "whatever the machine is doing".
  system: {
    symmetry: "leftRight",
    bits: [
      1,1,1,1,1,1,1,
      1,0,0,0,0,0,1,
      1,0,0,0,0,0,1,
      1,0,0,0,0,0,1,
      1,1,1,1,1,1,1,
      0,0,0,1,0,0,0,
      0,1,1,1,1,1,0,
    ],
  },

  /* Leaving for somewhere else: the head is the corner it is heading into and
     the shaft is the diagonal, which is the one arrow shape that reads at 7
     cells without an arrowhead of its own. */
  "arrow-out": {
    symmetry: "none",
    bits: [
      0,0,0,1,1,1,1,
      0,0,0,0,0,1,1,
      0,0,0,0,1,0,1,
      0,0,0,1,0,0,1,
      0,0,1,0,0,0,0,
      0,1,0,0,0,0,0,
      1,0,0,0,0,0,0,
    ],
  },

  "arrow-left": {
    symmetry: "topBottom",
    bits: [
      0,0,0,1,0,0,0,
      0,0,1,0,0,0,0,
      0,1,0,0,0,0,0,
      1,1,1,1,1,1,1,
      0,1,0,0,0,0,0,
      0,0,1,0,0,0,0,
      0,0,0,1,0,0,0,
    ],
  },

  "arrow-right": {
    symmetry: "topBottom",
    bits: [
      0,0,0,1,0,0,0,
      0,0,0,0,1,0,0,
      0,0,0,0,0,1,0,
      1,1,1,1,1,1,1,
      0,0,0,0,0,1,0,
      0,0,0,0,1,0,0,
      0,0,0,1,0,0,0,
    ],
  },
};

/**
 * The lit cells of an icon, as grid coordinates. Unlit cells are not returned
 * at all: a cell that is off is simply not there, as the widget cards have
 * drawn it since v1.6.0. An icon quotes the panel rather than imitating it.
 */
export function litCells(name: IconName): { x: number; y: number }[] {
  const { bits } = ICONS[name];
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (!bits[i]) continue;
    cells.push({ x: i % ICON_GRID, y: Math.floor(i / ICON_GRID) });
  }
  return cells;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/glyph/icons.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/glyph/icons.ts lib/glyph/icons.test.ts
git commit -m "The icon set: six marks on a 7x7 grid

Seven is odd so it has a true centre, is the font's five rows with one above
and one below so an icon aligns with a letterform on its own, and is the
fewest cells that keeps a diagonal arrow and a chevron apart.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The icon renderer

A server component. No state, no effects, no client boundary.

**Files:**
- Create: `components/glyph-icon.tsx`
- Test: `components/glyph-icon.test.tsx`

**Interfaces:**
- Consumes: `ICON_GRID`, `litCells`, `type IconName` from `lib/glyph/icons`; `pixelGeometry` from `lib/glyph/pixel`.
- Produces: `GlyphIcon({ name, size?, className? }: { name: IconName; size?: string; className?: string })`.

- [ ] **Step 1: Write the failing test**

Create `components/glyph-icon.test.tsx`:

```tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GlyphIcon } from "@/components/glyph-icon";
import { ICONS, ICON_GRID } from "@/lib/glyph/icons";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("GlyphIcon", () => {
  it("draws one rect per lit cell and none for the unlit ones", () => {
    render(<GlyphIcon name="arrow-left" />);
    const lit = ICONS["arrow-left"].bits.filter(Boolean).length;
    expect(host.querySelectorAll("rect")).toHaveLength(lit);
  });

  it("sits on the icon grid, so it scales with whatever box it is given", () => {
    render(<GlyphIcon name="light" />);
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${ICON_GRID} ${ICON_GRID}`);
  });

  it("takes its colour from the text around it, so both skins need no variant", () => {
    render(<GlyphIcon name="dark" />);
    expect(host.querySelector("svg")!.getAttribute("fill")).toBe("currentColor");
  });

  it("defaults to one em, so the type dial reaches it", () => {
    render(<GlyphIcon name="system" />);
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("1em");
    expect(svg.getAttribute("height")).toBe("1em");
  });

  it("is hidden from the accessibility tree — the control it sits in carries the name", () => {
    render(<GlyphIcon name="arrow-out" />);
    expect(host.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps a gap between pixels — a rect never fills its cell", () => {
    render(<GlyphIcon name="system" />);
    const rect = host.querySelector("rect")!;
    expect(Number(rect.getAttribute("width"))).toBeLessThan(1);
    expect(Number(rect.getAttribute("width"))).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/glyph-icon.test.tsx`
Expected: FAIL — cannot resolve `@/components/glyph-icon`.

- [ ] **Step 3: Write the implementation**

Create `components/glyph-icon.tsx`. Note there is **no `"use client"` directive** — that absence is the point of the component.

```tsx
import { ICON_GRID, litCells, type IconName } from "@/lib/glyph/icons";
import { pixelGeometry } from "@/lib/glyph/pixel";

/* One cell is one unit of the viewBox, so the icon scales with its box and the
   geometry is computed once for every icon on the site rather than per render. */
const { side, radius, offset } = pixelGeometry(1);

/**
 * A mark in the site's own language, drawn as SVG rather than on a canvas.
 *
 * GlyphCell carries pointer tracking, springs, ripples and an arrival sweep —
 * everything an instrument needs and an icon must not have. This has no state
 * and no effects, which is what lets it stand inside a server component: an
 * icon in the nav costs nothing at runtime and adds nothing to the bundle.
 *
 * Unlit cells are not drawn at all. A cell that is off is simply not there, as
 * the widget cards have had it since v1.6.0 — an icon quotes the panel, it does
 * not imitate one.
 *
 * Nothing here animates. An icon neither reports nor arrives, so Law 4 leaves
 * it still; a hover change belongs to the control around it, which was touched.
 */
export function GlyphIcon({
  name,
  size = "1em",
  className,
}: {
  name: IconName;
  /** Any CSS length. Defaults to the text size, so the type dial reaches it. */
  size?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {litCells(name).map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x + offset}
          y={cell.y + offset}
          width={side}
          height={side}
          rx={radius}
        />
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run components/glyph-icon.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the whole suite and the types**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: 198 tests pass (186 + 6 icons + 6 renderer); lint and types clean.

- [ ] **Step 6: Commit**

```bash
git add components/glyph-icon.tsx components/glyph-icon.test.tsx
git commit -m "The icon renderer: SVG for marks that do not move

Canvas for instruments, SVG for icons. No state and no effects, so an icon
can stand in a server component and the nav pays nothing for it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: The theme controls take the language

Removes all six generic SVGs — the first visible change.

**Files:**
- Modify: `components/theme-control.tsx` (the three `path` entries in `MODES`)
- Modify: `components/theme-toggle.tsx` (the two inline SVGs)

**Interfaces:**
- Consumes: `GlyphIcon` from Task 3, `type IconName` from Task 2.
- Produces: nothing new.

- [ ] **Step 1: Rewrite the MODES table in `theme-control.tsx`**

Replace the whole `MODES` constant — each mode now names an icon instead of carrying SVG paths — and add the import `import { GlyphIcon } from "@/components/glyph-icon";` plus `import type { IconName } from "@/lib/glyph/icons";`:

```tsx
/**
 * Three states, three targets — light, dark, and system as separate controls
 * rather than one button that cycles. A cycling toggle hides where you are and
 * makes "follow the system" unreachable without guessing.
 */
const MODES: { value: string; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "light" },
  { value: "dark", label: "Dark", icon: "dark" },
  { value: "system", label: "System", icon: "system" },
];
```

- [ ] **Step 2: Render the icon instead of the inline `svg`**

In the same file, replace the `<svg width="14" height="14" …>{mode.path}</svg>` element inside the button with:

```tsx
            <GlyphIcon name={mode.icon} size="0.875rem" />
```

- [ ] **Step 3: Rewrite `theme-toggle.tsx`'s two SVGs**

Replace the whole `{!mounted ? … : isDark ? <svg…/> : <svg…/>}` expression inside the button with:

```tsx
      {!mounted ? (
        <span className="size-4" />
      ) : (
        <GlyphIcon name={isDark ? "dark" : "light"} size="1rem" />
      )}
```

Add `import { GlyphIcon } from "@/components/glyph-icon";` to the top of the file.

- [ ] **Step 4: Verify no SVG paths remain**

Run: `grep -rn '<svg' components/theme-control.tsx components/theme-toggle.tsx`
Expected: no output — both files are free of hand-drawn SVG.

Run: `grep -rn '<svg' --include='*.tsx' app components`
Expected: only `components/glyph-icon.tsx`, `components/now-playing-disc.tsx` and `components/glyph-bay.tsx`. The last two are instruments, not icons, and stay.

- [ ] **Step 5: Check it in the browser, in both skins**

Run: `pnpm dev`, open `http://localhost:3000`, and confirm: the three theme dials in the nav show dot-matrix marks; switching light/dark/system still works and still marks the active one; the header toggle shows a sun and a crescent; nothing flashes on first paint.

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: all clean, 198 tests.

```bash
git add components/theme-control.tsx components/theme-toggle.tsx
git commit -m "The theme dials speak the language

Six hand-drawn SVGs in a generic hand, replaced by marks on the site's own
grid. The remaining SVG on the site belongs to instruments.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: The arrows

Converts the Unicode arrows — marks already doing a mark's job in a typeface with nothing to do with this site — and marks the outbound links that carry no mark at all.

**Files:**
- Modify: `app/work/[slug]/page.tsx:83-85` (back `←`), `:174-176` (next `→`), the `Live` row
- Modify: `components/feed-gallery.tsx` (lightbox `←` and `→` buttons)
- Modify: `components/site-footer.tsx` (X / GitHub / Email links)

**Interfaces:**
- Consumes: `GlyphIcon` from Task 3.
- Produces: nothing new.

- [ ] **Step 1: The case page's back link**

In `app/work/[slug]/page.tsx`, add `import { GlyphIcon } from "@/components/glyph-icon";` and replace:

```tsx
            <span className="inline-block transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
```

with:

```tsx
            <span className="inline-block transition-transform group-hover:-translate-x-0.5">
              <GlyphIcon name="arrow-left" size="0.625rem" />
            </span>
```

The hover translate stays: it is the control being touched, which Law 4 permits.

- [ ] **Step 2: The case page's next-piece link**

Replace:

```tsx
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
```

with:

```tsx
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">
                    <GlyphIcon name="arrow-right" size="0.6875rem" />
                  </span>
```

- [ ] **Step 3: Mark the Live row as outbound**

In the same file, inside the `Live` row's `<a>`, append the mark after the hostname text:

```tsx
                  {new URL(item.href).hostname.replace(/^www\./, "")}{" "}
                  <GlyphIcon name="arrow-out" size="0.5625rem" className="inline-block align-baseline" />
```

- [ ] **Step 4: The lightbox arrows**

In `components/feed-gallery.tsx`, add `import { GlyphIcon } from "@/components/glyph-icon";` and replace the bare `←` in the Previous button with `<GlyphIcon name="arrow-left" size="0.8125rem" />` and the bare `→` in the Next button with `<GlyphIcon name="arrow-right" size="0.8125rem" />`.

Both buttons keep their existing `aria-label="Previous"` / `aria-label="Next"` — the icon is `aria-hidden`, so the name still comes from the button.

- [ ] **Step 5: Mark the footer's outbound links**

In `components/site-footer.tsx`, add `import { GlyphIcon } from "@/components/glyph-icon";`. For the X, GitHub, and Email anchors, append the mark inside each anchor after its text, e.g.:

```tsx
              X <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
```

Do the same for `GitHub` and `Email`. Leave the `/changelog` chip alone — it is an internal link and takes no outbound mark.

- [ ] **Step 6: Verify no Unicode arrow survives as an interface mark**

Run: `grep -rnE '←|→' --include='*.tsx' app components`
Expected: no output.

- [ ] **Step 7: Check it in the browser**

Run `pnpm dev` and confirm: `/work/chessever` shows a dot back-arrow that still slides left on hover, a dot next-arrow at the foot, and an outbound mark on the Live row; `/feed` lightbox arrows step through frames and still announce "Previous"/"Next" to a screen reader; the footer's three outbound links carry the mark and the version chip does not.

- [ ] **Step 8: Verify and commit**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: all clean.

```bash
git add app/work/\[slug\]/page.tsx components/feed-gallery.tsx components/site-footer.tsx
git commit -m "The arrows join the language, and the outbound links gain a mark

The Unicode arrows were marks doing a mark's job in a typeface with nothing
to do with this site. The word Close stays a word.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Dotted rules

A border that separates becomes dots. A border that contains stays solid.

**Files:**
- Modify: `app/globals.css` (add `--pixel-fill`, `--rule-cell`, and the `.rule-b` / `.rule-t` classes)
- Modify: 15 separator sites across `app/page.tsx`, `app/about/page.tsx`, `app/colophon/page.tsx`, `app/work/[slug]/page.tsx`, `components/counters.tsx`, `components/site-footer.tsx`, `components/site-header.tsx`, `components/feed-gallery.tsx`, `components/colophon-instruments.tsx`
- Test: `lib/glyph/pixel.test.ts` (extend — guards the CSS against the TS)

**Interfaces:**
- Consumes: `PIXEL_FILL` from Task 1.
- Produces: CSS classes `.rule-b`, `.rule-t`.

- [ ] **Step 1: Write the failing drift test**

The one number CSS and TypeScript must both know is the fill ratio.

First add these two imports **at the top** of `lib/glyph/pixel.test.ts`, beside the existing
ones — an `import` after other statements is hoisted but trips `import/first` and reads badly:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
```

Then append the new block to the end of the same file. Note `process.cwd()` rather than
`__dirname`, which is not defined in an ESM test module; Vitest runs from the repo root:

```ts
describe("the rule shares the pixel's hand", () => {
  it("declares the same fill ratio in CSS as in TypeScript", () => {
    // globals.css cannot import a constant, so this is the seam where the two
    // can drift. A rule drawn at a different fill is a second language.
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const declared = css.match(/--pixel-fill:\s*([\d.]+)/);
    expect(declared, "globals.css must declare --pixel-fill").not.toBeNull();
    expect(Number(declared![1])).toBe(PIXEL_FILL);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/glyph/pixel.test.ts`
Expected: FAIL — "globals.css must declare --pixel-fill", because it does not yet.

- [ ] **Step 3: Add the tokens and the rule classes**

In `app/globals.css`, add to the `:root` block (after `--radius-tile: 12px;`):

```css
  /* One cell of a rule, and how much of it the dot fills. The fill is the same
     number lib/glyph/pixel.ts draws every pixel with — CSS cannot import it, so
     pixel.test.ts asserts the two agree. */
  --pixel-fill: 0.74;
  --rule-cell: 2px;
```

Then add, after the `:focus-visible` block:

```css
/* A border that separates is a mark; a border that contains is an edge. Rules
   are drawn as pixels on the icon's own pitch, square rather than round,
   because the field has drawn square pixels since v1.5.0. Containment borders
   — frames, cards, chips, inputs — are untouched and stay hairlines. */
.rule-b,
.rule-t {
  background-image: repeating-linear-gradient(
    to right,
    var(--border) 0,
    var(--border) calc(var(--rule-cell) * var(--pixel-fill)),
    transparent calc(var(--rule-cell) * var(--pixel-fill)),
    transparent var(--rule-cell)
  );
  background-repeat: repeat-x;
  background-size: 100% calc(var(--rule-cell) * var(--pixel-fill));
}

.rule-b {
  background-position: bottom left;
}

.rule-t {
  background-position: top left;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/glyph/pixel.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Swap the 15 separator sites**

In each site below, remove `border-b border-line` and add `rule-b`, or remove `border-t border-line` and add `rule-t`. Where `last:border-b-0` appears, replace it with `last:bg-none` — a background image is switched off with `bg-none`, not with a border utility.

| File | Current | Becomes |
| --- | --- | --- |
| `app/page.tsx` | `border-b border-line pb-2` | `rule-b pb-2` |
| `app/page.tsx` | `border-t border-line pt-5 pb-8` | `rule-t pt-5 pb-8` |
| `app/colophon/page.tsx` | `border-b border-line py-2.5 last:border-b-0` | `rule-b py-2.5 last:bg-none` |
| `app/about/page.tsx` (2 sites) | `border-b border-line py-2.5 last:border-b-0` | `rule-b py-2.5 last:bg-none` |
| `app/work/[slug]/page.tsx` | `border-b border-line py-2.5 last:border-b-0` | `rule-b py-2.5 last:bg-none` |
| `app/work/[slug]/page.tsx` | `mt-16 border-t border-line pt-5` | `mt-16 rule-t pt-5` |
| `components/counters.tsx` (3 sites) | `border-t border-line pt-3` | `rule-t pt-3` |
| `components/site-footer.tsx` | `border-t border-line pt-6` | `rule-t pt-6` |
| `components/site-header.tsx` | `border-b border-line bg-surface` | `rule-b bg-surface` |
| `components/feed-gallery.tsx` | `border-b border-line pb-3` | `rule-b pb-3` |
| `components/colophon-instruments.tsx` | `border-b border-line py-2` | `rule-b py-2` |
| `components/colophon-instruments.tsx` | `border-b border-line py-6 last:border-b-0` | `rule-b py-6 last:bg-none` |

- [ ] **Step 6: Confirm the containment borders were left alone**

Run: `grep -rn 'border-b border-line\|border-t border-line' --include='*.tsx' app components`
Expected: no output — every separator has moved.

Run: `grep -rc 'border-line' --include='*.tsx' app components | grep -v ':0'`
Expected: `border-line` still present in the files that draw boxes (`components/frame.tsx`, `components/ui.tsx`, `components/copy-email.tsx`, `app/system/page.tsx`, `components/glyph-toys.tsx`). These are edges, not rules, and must not have changed.

- [ ] **Step 7: Check it in the browser, in both skins and at all three densities**

Run `pnpm dev` and confirm on `/`, `/about`, `/colophon`, `/feed` and a case page: every separator reads as a row of square dots; the last row in each list has no rule under it; the sticky header's rule sits at its bottom edge and does not tile over the surface; card and chip edges are still solid hairlines. Check dark as well as light — the rule draws in `var(--border)`, which both skins define.

- [ ] **Step 8: Verify and commit**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build`
Expected: all clean, 199 tests.

```bash
git add app/globals.css app components lib/glyph/pixel.test.ts
git commit -m "Rules become marks; edges stay edges

A border that separates is drawn on the icon's own pitch. A border that
contains is an edge and does not move. The fill ratio is declared twice,
once in CSS and once in TypeScript, and a test holds them together.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Ship v1.8.0

The repo's versioning discipline is not optional: every change gets an entry before it ships.

**Files:**
- Modify: `data/changelog.ts` (new entry at the head of the array)
- Modify: `README.md` if it describes the icon situation

- [ ] **Step 1: Add the changelog entry**

Insert at the head of the `changelog` array in `data/changelog.ts`, in the house voice — what changed and why, not a task list. Leave `deployment` off for now:

```ts
  {
    version: "1.8.0",
    date: "2026-08-25",
    title: "The marks join the matrix",
    notes: [
      "The dot matrix stops being the instrument panel and becomes the site's icon language. Six icons on a 7x7 grid — the theme dials, the arrows, and a mark for a link that leaves — drawn from the same numbers the instruments draw a pixel with",
      "Seven cells because it is odd and so has a true centre, because it is the alphabet's five rows with one above and one below so an icon aligns with a word on its own, and because at five cells a diagonal arrow and a chevron are the same shape",
      "Icons are SVG and the instruments stay on canvas. GlyphCell carries pointer tracking, springs and an arrival sweep, which is everything a live field needs and everything a 14px mark must not have — so an icon has no state, no effects, and costs the nav nothing",
      "A cell that is off is not drawn. The field keeps its unlit lattice because the lattice is the instrument's face; an icon quotes the panel rather than imitating it, which is the rule the widget cards have followed since v1.6.0",
      "Rules are marks now. A border that separates is drawn as square pixels on the icon's own pitch; a border that contains is an edge and has not moved. Fifteen separators changed and thirty-eight box edges did not",
      "Nothing new animates. An icon neither reports nor arrives, so Law 4 leaves it still — the arrival sweep stays with the instruments, which are the things that were not there a moment ago",
      "The word Close is still a word. Turning it into a cross would have traded a label for a mark and made the control worse for anyone who benefits from the label, which is the same reason the four nav chips keep their names",
    ],
  },
```

- [ ] **Step 2: Full verification before shipping**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`
Expected: all four clean.

- [ ] **Step 3: Deploy both faces**

Run: `./scripts/deploy.sh`

Never use a bare `vercel deploy --prod` — it targets the wrong project and doubles the path. The script prints the immutable workshop URL at the end.

- [ ] **Step 4: Record the deployment URL**

Add `deployment: "<the workshop URL the script printed>"` as the last field of the v1.8.0 entry in `data/changelog.ts`.

- [ ] **Step 5: Commit, tag, push**

```bash
git add -A
git commit -m "v1.8.0: the marks join the matrix

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git tag v1.8.0
git push origin glyph-matrix --tags
git checkout main && git merge --ff-only glyph-matrix && git push origin main
git checkout glyph-matrix
```

- [ ] **Step 6: Final deploy, so the live build contains its own recorded URL**

Run: `./scripts/deploy.sh`

Then confirm: `curl -s https://damilareoo-xyz.vercel.app/changelog | grep -o '1\.8\.0'` returns a match.

---

## Self-Review

**Spec coverage.** The shared hand → Task 1. Two renderers → Task 3. The 7×7 grid and its three reasons → Task 2. The six icons → Tasks 2, 4, 5. Nav and `close` cuts → honoured by omission, and stated in the Task 7 changelog entry. Structural furniture → Task 6. Motion → no animation is added in any task; the two hover translates in Task 5 already existed and fall under *touched*. Theme and access → Task 3 (`currentColor`, `aria-hidden`) and Task 5 (buttons keep their `aria-label`). Testing → Tasks 1, 2, 3, 6. Success criteria → verified across Tasks 4 Step 4, 5 Step 6, 6 Step 6, and 7 Step 2.

**Type consistency.** `pixelGeometry` returns `{ side, radius, offset }` in Task 1 and is destructured with exactly those names in Tasks 1 and 3. `litCells` returns `{ x, y }[]` in Task 2 and is consumed as `cell.x` / `cell.y` in Task 3. `IconName` is defined in Task 2 and imported in Tasks 3 and 4. `ICON_GRID` is used in Tasks 2 and 3.

**Known risk.** `--rule-cell: 2px` gives a dot of 1.48px against today's 1px hairline, so rules will read slightly heavier. This is deliberate and tunable at one token; check it at Task 6 Step 7 and adjust before committing if it shouts.
