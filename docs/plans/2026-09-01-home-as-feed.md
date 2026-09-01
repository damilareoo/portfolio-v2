# The Home Is the Work — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home's selected-work grid with an era-grouped feed that carries the case studies inline, and retire `/work/[slug]` behind explicit redirects.

**Architecture:** A new `Era` groups existing `WorkItem`s by slug reference. Each era renders a head, a blurb, and its entries; each entry shows its first two blocks inline and unfolds the rest in place with `grid-template-rows: 0fr → 1fr`, never navigating. The block-splitting and era-ordering arithmetic lives in a pure, tested `lib/eras.ts`; the panel sweep already shipped in `ShotsField` is extracted so both the shots page and the home's frames can use it.

**Tech Stack:** Next 16 (App Router, RSC), React 19, TypeScript, Tailwind v4, Vitest (node + jsdom), pnpm.

**Spec:** `docs/specs/2026-09-01-home-as-feed-design.md`

## Global Constraints

- **Law 4 — nothing moves unless touched, arriving, or reporting.** No marquee, no autoplay, no parallax, no scroll-linked transforms. The unfold is *touched*; the panel sweep is *arriving*.
- **Monochrome.** No new hue. `--miss` remains the only one, on the one instrument that earned it.
- **Type sizes in `rem`, never `px`**, or the DialKit's type dial cannot reach them. Spacing and radii read `--pg-gap` / `--pad` / `--radius-tile`.
- **Anything meant to be overridable by a Tailwind utility must sit inside `@layer utilities`**, or unlayered author styles beat it regardless of specificity.
- **Build from the shared primitives** in `components/ui.tsx` (`RecordRow`, `SectionLabel`, `Sheet`, `Chip`, `Tags`, `Meta`) — never ad-hoc styles.
- **An icon replaces a mark, never a word.** `Open` / `Close` keep their labels.
- **The reading position is not a setting.** The unfold uses `useState` and must not touch `localStorage` or `lib/settings.tsx`.
- **Anything backed by `localStorage` is read through `useSyncExternalStore`**; the client-only check is `useMounted` from `lib/use-mounted.ts`. No mounted-flag effects.
- Every task ends green on `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm test`.

---

### Task 1: The era arithmetic

**Files:**
- Create: `lib/eras.ts`
- Test: `lib/eras.test.ts`

**Interfaces:**
- Consumes: `CaseBlock` from `@/data/work` (already exported).
- Produces: `type Era`, `LEDE_BLOCKS`, `orderEras(eras: Era[]): Era[]`, `blockAssetCost(block: CaseBlock): number`, `splitBlocks(blocks: CaseBlock[], lede?: number): { lede: CaseBlock[]; rest: CaseBlock[]; restAssetOffset: number }`.

**Why `restAssetOffset` exists.** `CaseReel` fills any block without a `src` from the project's asset folder using a positional counter that starts at zero. Split one reel into two and the second starts counting from zero again — the tail would re-show the frames the lede already used. The offset is how many assets the lede consumed, so the caller can hand the tail `assets.slice(restAssetOffset)`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/eras.test.ts
import { describe, expect, it } from "vitest";
import { blockAssetCost, orderEras, splitBlocks, type Era } from "./eras";
import type { CaseBlock } from "@/data/work";

const era = (id: string, sort: string): Era => ({
  id, name: id, period: "", sort, blurb: "", entries: [],
});

describe("orderEras", () => {
  it("puts the most recently ended era first", () => {
    const ordered = orderEras([era("old", "2025-04"), era("new", "2026-08")]);
    expect(ordered.map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("sorts an undated era last, however it was authored", () => {
    // Side projects have no end date and must not float to the top of a page
    // whose whole argument is reverse chronology.
    const ordered = orderEras([era("side", ""), era("dated", "2025-04")]);
    expect(ordered.map((e) => e.id)).toEqual(["dated", "side"]);
  });

  it("breaks a tie on authored order, and does not mutate its input", () => {
    const input = [era("first", "2026-04"), era("second", "2026-04")];
    expect(orderEras(input).map((e) => e.id)).toEqual(["first", "second"]);
    expect(input.map((e) => e.id)).toEqual(["first", "second"]);
  });
});

describe("blockAssetCost", () => {
  it("costs nothing for a block that carries no media", () => {
    expect(blockAssetCost({ kind: "text", body: ["a"] })).toBe(0);
    expect(blockAssetCost({ kind: "quote", body: "a" })).toBe(0);
  });

  it("costs nothing for media that names its own src", () => {
    expect(blockAssetCost({ kind: "full", src: "/work/a/1.png" })).toBe(0);
  });

  it("counts every slot that will fall through to the folder", () => {
    expect(blockAssetCost({ kind: "full" })).toBe(1);
    expect(blockAssetCost({ kind: "pair", items: [{}, {}] })).toBe(2);
    expect(blockAssetCost({ kind: "inset", items: [{ src: "/x.png" }, {}] })).toBe(1);
  });
});

describe("splitBlocks", () => {
  const blocks: CaseBlock[] = [
    { kind: "full" },
    { kind: "pair", items: [{}, {}] },
    { kind: "full" },
  ];

  it("keeps the first two blocks as the lede", () => {
    const { lede, rest } = splitBlocks(blocks);
    expect(lede).toHaveLength(2);
    expect(rest).toHaveLength(1);
  });

  it("tells the tail how many assets the lede already took", () => {
    // The regression this guards: two reels over one folder, the second
    // starting its counter at zero and re-showing the lede's frames.
    expect(splitBlocks(blocks).restAssetOffset).toBe(3);
  });

  it("honours a per-entry override", () => {
    expect(splitBlocks(blocks, 1).rest).toHaveLength(2);
    expect(splitBlocks(blocks, 1).restAssetOffset).toBe(1);
  });

  it("leaves an empty tail when the lede is the whole reel", () => {
    const { rest, restAssetOffset } = splitBlocks(blocks, 9);
    expect(rest).toEqual([]);
    expect(restAssetOffset).toBe(4);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/eras.test.ts`
Expected: FAIL — `Failed to resolve import "./eras"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/eras.ts
import type { CaseBlock } from "@/data/work";

/**
 * An era is a stretch of working life — a company, a contract, or the standing
 * category side projects fall into. It groups work by *when and for whom*,
 * which is the only hierarchy the home has now that tiers are gone.
 *
 * Entries are slugs rather than items: `data/work.ts` stays the one place a
 * piece is defined, and moving a piece between eras is a one-line edit.
 */
export type Era = {
  /** Anchor slug — the home links to `/#<id>` and the redirects land there. */
  id: string;
  name: string;
  role?: string;
  /** As displayed, e.g. "Apr 2026 — Aug 2026". Never parsed. */
  period: string;
  /**
   * The era's end, as a sortable prefix ("2026-08"). Empty means undated, and
   * an undated era sorts last — descending compare puts "" behind every real
   * date without a special case. Ordering is derived from this, never from the
   * order eras happen to be written in; ties fall back to authored order,
   * because Array.prototype.sort is stable.
   */
  sort: string;
  href?: string;
  logo?: string;
  blurb: string;
  entries: string[];
};

/** How many blocks stand above the fold of an entry before it must be opened. */
export const LEDE_BLOCKS = 2;

export function orderEras(eras: Era[]): Era[] {
  return [...eras].sort((a, b) => b.sort.localeCompare(a.sort));
}

/**
 * How many frames a block will take from its project's asset folder.
 *
 * Media that names its own `src` costs nothing: `CaseReel` only reaches for the
 * folder when a slot is empty.
 */
export function blockAssetCost(block: CaseBlock): number {
  switch (block.kind) {
    case "text":
    case "quote":
      return 0;
    case "pair":
    case "inset":
      return block.items.filter((media) => !media.src).length;
    default:
      return block.src ? 0 : 1;
  }
}

export function splitBlocks(blocks: CaseBlock[], lede: number = LEDE_BLOCKS) {
  const head = blocks.slice(0, lede);
  return {
    lede: head,
    rest: blocks.slice(lede),
    restAssetOffset: head.reduce((total, block) => total + blockAssetCost(block), 0),
  };
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `pnpm exec vitest run lib/eras.test.ts && pnpm exec tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/eras.ts lib/eras.test.ts
git commit -m "Eras: the ordering and the split, as arithmetic"
```

---

### Task 2: The era data

**Files:**
- Create: `data/eras.ts`
- Test: `data/eras.test.ts`
- Modify: `data/site.ts` (add the `expertise` list the home's record row needs)

**Interfaces:**
- Consumes: `type Era` from `@/lib/eras`; `work` from `@/data/work`.
- Produces: `eras: Era[]` from `@/data/eras`; `expertise: string[]` from `@/data/site`.

Two eras carry no public art. They are authored with empty `entries` on purpose — `data/work.ts` already holds the rule that work without blocks "renders its record and says so plainly rather than padding", and v1.9.1 deleted a placeholder for exactly this reason. Do not invent entries for them.

- [ ] **Step 1: Write the failing test**

```ts
// data/eras.test.ts
import { describe, expect, it } from "vitest";
import { eras } from "./eras";
import { work } from "./work";
import { orderEras } from "@/lib/eras";

describe("the eras", () => {
  it("names only slugs that exist", () => {
    const slugs = new Set(work.map((item) => item.slug));
    for (const era of eras) {
      for (const slug of era.entries) expect(slugs, era.id).toContain(slug);
    }
  });

  it("gives every piece of work exactly one era", () => {
    // A piece in two eras renders twice; a piece in none is invisible, and the
    // home is the only surface work has now.
    const placed = eras.flatMap((era) => era.entries);
    expect([...placed].sort()).toEqual(work.map((item) => item.slug).sort());
  });

  it("uses each id once, because ids are anchors", () => {
    const ids = eras.map((era) => era.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reads newest first with side projects last", () => {
    const ordered = orderEras(eras).map((era) => era.id);
    expect(ordered[0]).toBe("endgame");
    expect(ordered.at(-1)).toBe("side-projects");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run data/eras.test.ts`
Expected: FAIL — `Failed to resolve import "./eras"`.

- [ ] **Step 3: Write the data**

```ts
// data/eras.ts
import type { Era } from "@/lib/eras";

/**
 * Work grouped by when it was made and who it was for.
 *
 * Periods and roles are the ones recorded in `data/experience.ts`; nothing here
 * invents a history. `sort` is the era's end, and side projects carry no date
 * because they never ended.
 */
export const eras: Era[] = [
  {
    id: "endgame",
    name: "Endgame AI",
    role: "Product Designer",
    period: "Apr 2026 — Aug 2026",
    sort: "2026-08",
    href: "https://endgame.ai",
    logo: "/companies/endgame.png",
    blurb: "Product design on contract for an online chess platform.",
    entries: [],
  },
  {
    id: "chessever",
    name: "ChessEver",
    role: "Product Designer",
    period: "Apr 2025 — Apr 2026",
    sort: "2026-04",
    href: "https://chessever.com",
    blurb:
      "A year of product design on real-time coverage of professional chess — tournament tracking, live boards, and the app that carries them.",
    entries: ["chessever"],
  },
  {
    id: "hex",
    name: "HEX",
    role: "Design Partner",
    period: "Mar 2025 — Apr 2026",
    sort: "2026-04",
    href: "https://hex.inc",
    logo: "/companies/hex.png",
    blurb: "Design partner on contract.",
    entries: [],
  },
  {
    id: "independent",
    name: "Independent",
    period: "2025",
    sort: "2025-12",
    blurb: "Identity and site work taken on directly.",
    entries: ["sylvan"],
  },
  {
    id: "side-projects",
    name: "Side projects",
    period: "Ongoing",
    sort: "",
    blurb: "Built to find out whether they could be.",
    entries: ["hitmans-library"],
  },
];
```

- [ ] **Step 4: Add the expertise list**

In `data/site.ts`, after the `site` object, add:

```ts
/**
 * The record row's second line. Static and wrapped — the reference marquees
 * its equivalent, and a marquee is exactly the ambient motion Law 4 forbids.
 */
export const expertise = [
  "Product design",
  "Interaction",
  "Design systems",
  "Identity",
  "Prototyping",
  "Motion",
  "Next.js",
  "React",
  "TypeScript",
  "Figma",
];
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `pnpm exec vitest run data/eras.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

Note: `vitest.config.ts` currently includes only `lib/**/*.test.ts` and `components/**/*.test.tsx`. Add `"data/**/*.test.ts"` to the `include` array or this file never runs in `pnpm test`.

- [ ] **Step 6: Commit**

```bash
git add data/eras.ts data/eras.test.ts data/site.ts vitest.config.ts
git commit -m "Eras: five of them, from the record"
```

---

### Task 3: The chevron

**Files:**
- Modify: `lib/glyph/icons.ts`
- Test: `lib/glyph/icons.test.ts` (existing suite covers every icon automatically; add one case)

**Interfaces:**
- Produces: `"chevron-down"` as a member of `IconName`, renderable by the existing `<GlyphIcon name="chevron-down" />`.

- [ ] **Step 1: Add the case to the existing test**

Append inside the existing `describe("the icon set", ...)` block in `lib/glyph/icons.test.ts`:

```ts
  it("carries a chevron that points down", () => {
    // The unfold's mark. It must be mirror-symmetric or it reads as an arrow
    // leaning, and its lowest lit cell must be the centre column or it is not
    // pointing anywhere.
    const bits = ICONS["chevron-down"].bits;
    expect(ICONS["chevron-down"].symmetry).toBe("leftRight");
    const lit = litCells("chevron-down");
    const bottom = Math.max(...lit.map((cell) => cell.y));
    const onBottom = lit.filter((cell) => cell.y === bottom);
    expect(onBottom).toHaveLength(1);
    expect(onBottom[0].x).toBe((ICON_GRID - 1) / 2);
    expect(bits.filter(Boolean).length).toBeGreaterThan(4);
  });
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/glyph/icons.test.ts`
Expected: FAIL — `ICONS["chevron-down"]` is undefined.

- [ ] **Step 3: Add the icon**

In `lib/glyph/icons.ts`, add `| "chevron-down"` to the `IconName` union, and add this entry to `ICONS` after `"arrow-right"`:

```ts
  /* The unfold's mark. Four rows rather than the arrows' seven-cell shaft: a
     chevron says "there is more below this", where an arrow says "go". */
  "chevron-down": {
    symmetry: "leftRight",
    bits: [
      0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,
      1,1,0,0,0,1,1,
      0,1,1,0,1,1,0,
      0,0,1,1,1,0,0,
      0,0,0,1,0,0,0,
      0,0,0,0,0,0,0,
    ],
  },
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `pnpm exec vitest run lib/glyph/icons.test.ts`
Expected: PASS — including the suite's existing symmetry, half-tone, and non-empty assertions applied to the new icon.

- [ ] **Step 5: Commit**

```bash
git add lib/glyph/icons.ts lib/glyph/icons.test.ts
git commit -m "Icons: a chevron, for the thing that unfolds"
```

---

### Task 4: Dot-matrix numerals in SVG

**Files:**
- Modify: `lib/glyph/font.ts`
- Create: `components/glyph-text.tsx`
- Test: `lib/glyph/font.test.ts` (existing file — add cases)

**Interfaces:**
- Consumes: `pixelGeometry` from `@/lib/glyph/pixel` (already used by `components/glyph-icon.tsx`).
- Produces: `GLYPH_HEIGHT`, `GLYPH_GAP`, `glyphBits(char: string): { w: number; bits: number[] } | null` from `@/lib/glyph/font`; `<GlyphText text="01" size="0.5rem" />` from `@/components/glyph-text`.

The 3×5 alphabet in `font.ts` is currently reachable only through `stampText`, which writes into a canvas frame. The era index needs the same letterforms as SVG, standing still beside a heading, the way `GlyphIcon` does.

- [ ] **Step 1: Write the failing test**

Append to `lib/glyph/font.test.ts`:

```ts
import { GLYPH_GAP, GLYPH_HEIGHT, glyphBits } from "./font";

describe("glyphBits", () => {
  it("hands back a glyph the same size the alphabet declares", () => {
    const zero = glyphBits("0");
    expect(zero).not.toBeNull();
    expect(zero!.bits).toHaveLength(zero!.w * GLYPH_HEIGHT);
  });

  it("returns null for a character the alphabet does not have", () => {
    // Callers skip what they cannot draw rather than drawing a blank box.
    expect(glyphBits("é")).toBeNull();
  });

  it("agrees with textWidth about how wide a string is", () => {
    // The SVG renderer lays glyphs out itself and sizes its viewBox from
    // textWidth; if the two disagree the numerals sit off-centre in their box.
    const text = "01";
    let width = 0;
    for (const char of text) {
      const glyph = glyphBits(char)!;
      if (width > 0) width += GLYPH_GAP;
      width += glyph.w;
    }
    expect(width).toBe(textWidth(text));
  });
});
```

(`textWidth` is already imported at the top of the existing file; if not, add it to that import.)

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/glyph/font.test.ts`
Expected: FAIL — `glyphBits is not a function`.

- [ ] **Step 3: Export the alphabet**

In `lib/glyph/font.ts`, immediately after the `GLYPHS` object, add:

```ts
export const GLYPH_HEIGHT = HEIGHT;
export const GLYPH_GAP = GAP;

/**
 * One character's cells, for renderers that draw rather than stamp.
 *
 * `stampText` writes into a canvas frame, which is what the matrix wants and
 * what an icon standing beside a heading cannot use. Unknown characters return
 * null so a caller skips them, exactly as `textWidth` does.
 */
export function glyphBits(char: string): { w: number; bits: number[] } | null {
  return GLYPHS[char] ?? null;
}
```

- [ ] **Step 4: Write the renderer**

```tsx
// components/glyph-text.tsx
import { GLYPH_GAP, GLYPH_HEIGHT, glyphBits, textWidth } from "@/lib/glyph/font";
import { pixelGeometry } from "@/lib/glyph/pixel";

/* One cell is one unit of the viewBox, as GlyphIcon has it, so the geometry is
   computed once for every numeral on the site rather than per render. */
const { side, radius, offset } = pixelGeometry(1);

/**
 * A short string in the matrix's own 3x5 alphabet, drawn as SVG.
 *
 * Sized off the text height so the type dial reaches it, and `aria-hidden`
 * because it never says anything a heading beside it has not already said —
 * an era's index is ordering made visible, not information.
 */
export function GlyphText({
  text,
  size = "1em",
  className,
}: {
  text: string;
  /** Any CSS length; sets the glyph height, width follows the string. */
  size?: string;
  className?: string;
}) {
  const width = textWidth(text);
  const cells: { x: number; y: number }[] = [];

  let cursor = 0;
  for (const char of text) {
    const glyph = glyphBits(char);
    if (!glyph) continue;
    if (cursor > 0) cursor += GLYPH_GAP;
    for (let row = 0; row < GLYPH_HEIGHT; row++) {
      for (let col = 0; col < glyph.w; col++) {
        if (glyph.bits[row * glyph.w + col]) cells.push({ x: cursor + col, y: row });
      }
    }
    cursor += glyph.w;
  }

  if (!width) return null;

  return (
    <svg
      height={size}
      width={`calc(${size} * ${width} / ${GLYPH_HEIGHT})`}
      viewBox={`0 0 ${width} ${GLYPH_HEIGHT}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {cells.map((cell) => (
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

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `pnpm exec vitest run lib/glyph/font.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/glyph/font.ts lib/glyph/font.test.ts components/glyph-text.tsx
git commit -m "Glyph text: the alphabet, standing still"
```

---

### Task 5: The entry that unfolds

**Files:**
- Modify: `components/case-reel.tsx` (one new prop)
- Create: `components/era-entry.tsx`
- Test: `components/era-entry.test.tsx`

**Interfaces:**
- Consumes: `splitBlocks` from `@/lib/eras`; `CaseReel` from `@/components/case-reel`; `GlyphIcon` from `@/components/glyph-icon`; `RecordRow`, `SectionLabel`, `Tags` from `@/components/ui`; `WorkItem` from `@/data/work`; `Asset` from `@/data/assets.generated`.
- Produces: `<EraEntry item={item} assets={assets} index={i} />` from `@/components/era-entry`.

**Two traps this task exists to avoid.**

1. The tail must be **in the DOM while collapsed**, not `hidden`. That is the whole mitigation for retiring the case pages — it keeps the case studies crawlable and findable with cmd-F. Collapse with `grid-template-rows: 0fr → 1fr` over an `overflow-hidden` child. A refactor to `hidden` silently undoes it, which is why the test asserts it.
2. `CaseReel` sets `priority` on its first block. The tail's first block is below the fold by definition, so it must not claim priority, or Next preloads an image nobody has asked for.

- [ ] **Step 1: Write the failing test**

```tsx
// components/era-entry.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EraEntry } from "@/components/era-entry";
import type { WorkItem } from "@/data/work";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

/* Text blocks only: this test is about the unfold, and mounting a Frame would
   drag next/image into a unit test that has nothing to say about it. */
const item: WorkItem = {
  slug: "example",
  title: "Example",
  oneLiner: "One line.",
  year: "2025",
  // `tier` is still required here; Task 7 removes the field and this line with it.
  tier: "selected",
  disciplines: ["Product Design"],
  blocks: [
    { kind: "text", body: ["Lede one."] },
    { kind: "text", body: ["Lede two."] },
    { kind: "text", body: ["Buried treasure."] },
  ],
};

describe("EraEntry", () => {
  it("shows the first two blocks without being asked", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Lede one.");
    expect(host.textContent).toContain("Lede two.");
  });

  it("keeps the collapsed tail in the DOM so it stays findable", () => {
    // Retiring the case pages cost three URLs; it must not also cost the text.
    render(<EraEntry item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Buried treasure.");
    expect(host.querySelector("[hidden]")).toBeNull();
  });

  it("reports its state on the control, and flips it when touched", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.textContent).toContain("Open");

    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toContain("Close");
  });

  it("points the control at the region it opens", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    const id = host.querySelector("button")!.getAttribute("aria-controls")!;
    expect(host.querySelector(`#${CSS.escape(id)}`)).not.toBeNull();
  });

  it("offers no control when there is nothing more to show", () => {
    render(<EraEntry item={{ ...item, blocks: item.blocks!.slice(0, 2) }} assets={[]} index={0} />);
    expect(host.querySelector("button")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run components/era-entry.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/era-entry"`.

- [ ] **Step 3: Give CaseReel a way to decline priority**

In `components/case-reel.tsx`, change the signature and the one `priority` usage:

```tsx
export function CaseReel({
  blocks,
  assets,
  firstIsPriority = true,
}: {
  blocks: CaseBlock[];
  assets: Asset[];
  /** The tail of a split reel is below the fold by definition and declines it. */
  firstIsPriority?: boolean;
}) {
```

and, in the final `full` branch:

```tsx
                priority={firstIsPriority && i === 0}
```

- [ ] **Step 4: Write the entry**

```tsx
// components/era-entry.tsx
"use client";

import { useId, useState } from "react";
import { CaseReel } from "@/components/case-reel";
import { GlyphIcon } from "@/components/glyph-icon";
import { RecordRow, SectionLabel, Tags } from "@/components/ui";
import { splitBlocks } from "@/lib/eras";
import type { CaseBlock, WorkItem } from "@/data/work";
import type { Asset } from "@/data/assets.generated";

/**
 * One piece of work, inside its era.
 *
 * The lede stands open; everything else — the rail prose the case page used to
 * carry, and the rest of the reel — waits behind one control. It waits in the
 * DOM rather than out of it: collapsed with grid rows, not `hidden`, so the
 * whole case study is still crawlable and still found by cmd-F. That is the
 * only thing that survived retiring /work/[slug], and `hidden` would spend it.
 *
 * The open state is deliberately not persisted. Law 3 governs layout the
 * visitor sets, as the DialKit does; a reading position is not a setting, and a
 * portfolio that reopens five dossiers on arrival has forgotten what the
 * collapsed state was for.
 */
export function EraEntry({
  item,
  assets,
  index,
}: {
  item: WorkItem;
  assets: Asset[];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  /* Art with no blocks authored for it is still worth showing: fall back to one
     full frame per asset, in filename order — as the case page did. */
  const blocks: CaseBlock[] =
    item.blocks && item.blocks.length > 0
      ? item.blocks
      : assets.map<CaseBlock>((asset) => ({ kind: "full", alt: asset.title }));

  const { lede, rest, restAssetOffset } = splitBlocks(blocks);
  const prose = (item.intro?.length ?? 0) + (item.approach?.length ?? 0) > 0;
  const more = rest.length > 0 || prose;

  return (
    <article className="min-w-0">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[1rem] font-medium tracking-tight">{item.title}</h3>
        <SectionLabel>{item.year}</SectionLabel>
      </div>
      <p className="mb-5 max-w-[42rem] text-[0.875rem] leading-relaxed text-ink-2">
        {item.oneLiner}
      </p>

      {lede.length > 0 && <CaseReel blocks={lede} assets={assets} />}

      {more && (
        <>
          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            aria-controls={panelId}
            className="mt-5 inline-flex items-center gap-1.5 rounded-[4px] bg-surface-2 px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-ink"
          >
            {open ? "Close" : "Open"}
            <span
              className={`inline-block transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            >
              <GlyphIcon name="chevron-down" size="0.625rem" />
            </span>
          </button>

          <div
            id={panelId}
            data-open={open || undefined}
            className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out data-[open]:grid-rows-[1fr]"
          >
            <div className="overflow-hidden">
              <div className="pt-8">
                {item.intro && item.intro.length > 0 && (
                  <div className="mx-auto max-w-[34rem]">
                    <SectionLabel>Overview</SectionLabel>
                    <div className="mt-2.5 space-y-3">
                      {item.intro.map((paragraph) => (
                        <p key={paragraph} className="text-[0.8125rem] leading-[1.6] text-ink-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mx-auto mt-7 max-w-[34rem]">
                  {item.client && <RecordRow label="Client">{item.client}</RecordRow>}
                  {item.role && <RecordRow label="Role">{item.role}</RecordRow>}
                  <RecordRow label="Discipline">
                    <Tags items={item.disciplines} />
                  </RecordRow>
                  {item.stack && <RecordRow label="Stack">{item.stack}</RecordRow>}
                  {item.href && (
                    <RecordRow label="Live">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
                      >
                        {new URL(item.href).hostname.replace(/^www\./, "")}{" "}
                        <GlyphIcon
                          name="arrow-out"
                          size="0.5625rem"
                          className="inline-block align-baseline"
                        />
                      </a>
                    </RecordRow>
                  )}
                </div>

                {item.approach && item.approach.length > 0 && (
                  <div className="mx-auto mt-7 max-w-[34rem]">
                    <SectionLabel>Approach</SectionLabel>
                    <div className="mt-2.5 space-y-3">
                      {item.approach.map((paragraph) => (
                        <p key={paragraph} className="text-[0.8125rem] leading-[1.6] text-ink-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="mt-10">
                    {/* The tail takes the assets the lede did not, or it re-shows them. */}
                    <CaseReel
                      blocks={rest}
                      assets={assets.slice(restAssetOffset)}
                      firstIsPriority={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
```

**`index` is consumed, not carried.** It is the entry's arrival stagger, so entries in an era read as a sequence rather than one texture — the same rule `lib/reveal.tsx` uses, capped the same way. Give the outer `<article>` both of these:

```tsx
    <article
      className="arrive min-w-0"
      style={{ "--arrive-delay": `${Math.min(index, 12) * 45}ms` } as React.CSSProperties}
    >
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `pnpm exec vitest run components/era-entry.test.tsx && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add components/era-entry.tsx components/era-entry.test.tsx components/case-reel.tsx
git commit -m "The entry unfolds, and the tail keeps its assets"
```

---

### Task 6: The era section, and the home

**Files:**
- Create: `components/era-section.tsx`
- Modify: `app/page.tsx` (full rewrite of the body)
- Modify: `app/layout.tsx` only if its metadata description needs the new home's words (check; change nothing if not)

**Interfaces:**
- Consumes: `orderEras`, `type Era` from `@/lib/eras`; `eras` from `@/data/eras`; `findWork`, `type WorkItem` from `@/data/work`; `workAssets` from `@/data/assets.generated`; `EraEntry`; `GlyphText`; `SectionLabel`, `RecordRow`; `site`, `elsewhere`, `expertise` from `@/data/site`.
- Produces: `<EraSection era={era} index={i} />` from `@/components/era-section`.

- [ ] **Step 1: Write the section**

```tsx
// components/era-section.tsx
import { EraEntry } from "@/components/era-entry";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { SectionLabel } from "@/components/ui";
import { findWork, type WorkItem } from "@/data/work";
import { workAssets } from "@/data/assets.generated";
import type { Era } from "@/lib/eras";

/**
 * A stretch of working life, with its work under it.
 *
 * An era with nothing public says so. It gets no placeholder tile — v1.9.1
 * deleted one of those on purpose, and a frame that stands for work nobody can
 * see is padding wearing the shape of evidence.
 */
export function EraSection({ era, index }: { era: Era; index: number }) {
  const entries = era.entries
    .map((slug) => findWork(slug))
    .filter((item): item is WorkItem => Boolean(item));

  return (
    <section id={era.id} className="rule-t scroll-mt-6 pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <div className="flex items-baseline gap-3">
          <GlyphText
            text={String(index + 1).padStart(2, "0")}
            size="0.5rem"
            className="shrink-0 text-ink-3"
          />
          <h2 className="text-[1.125rem] font-medium tracking-tight">
            {era.href ? (
              <a
                href={era.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink-2"
              >
                {era.name}{" "}
                <GlyphIcon
                  name="arrow-out"
                  size="0.5625rem"
                  className="inline-block align-baseline text-ink-3"
                />
              </a>
            ) : (
              era.name
            )}
          </h2>
          {era.role && <SectionLabel>{era.role}</SectionLabel>}
        </div>
        <SectionLabel>{era.period}</SectionLabel>
      </div>

      <p className="max-w-[44rem] text-[0.875rem] leading-relaxed text-ink-2">{era.blurb}</p>

      {entries.length > 0 ? (
        <div className="mt-9 space-y-16">
          {entries.map((item, i) => (
            <EraEntry
              key={item.slug}
              item={item}
              assets={workAssets[item.slug] ?? []}
              index={i}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[var(--radius-tile)] border border-dashed border-line p-[var(--pad)] font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          Nothing public from this one yet.
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Rewrite the home**

Replace the whole body of `app/page.tsx` with:

```tsx
import Link from "next/link";
import { EraSection } from "@/components/era-section";
import { GlyphBay } from "@/components/glyph-bay";
import { SiteNav } from "@/components/site-nav";
import { RecordRow } from "@/components/ui";
import { orderEras } from "@/lib/eras";
import { eras } from "@/data/eras";
import { elsewhere, expertise, site } from "@/data/site";

/**
 * The home is the work.
 *
 * There is no index and no selected grid: a lockup, a short record, then the
 * eras themselves. The reference this came from removes its nav for the same
 * reason — if the work is the page, there is nowhere else it could be. The nav
 * stays here only because /shots, /about and /colophon still exist.
 */
export default function Home() {
  const ordered = orderEras(eras);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6">
      <SiteNav current="/" />

      {/* The lockup. The apostrophe is the mark — a name in quotation. */}
      <header className="mt-12">
        <h1 className="text-[1.25rem] font-medium leading-tight tracking-tight">
          &rsquo;{site.name}
        </h1>
        <p className="mt-1.5 max-w-[38rem] text-[0.9375rem] font-medium leading-snug text-ink">
          Product designer and builder creating 0&ndash;1 experiences.
        </p>
        <p className="max-w-[38rem] text-[0.9375rem] leading-snug text-ink-2">
          Specialising in interfaces, systems, and shipping them.
        </p>

        {/* The record the reference carries under its lockup. Static: a marquee
            is exactly the ambient motion Law 4 forbids. */}
        <div className="mt-8 max-w-[44rem]">
          <RecordRow label="Location">{site.coordinates} &middot; Lagos</RecordRow>
          <RecordRow label="Expertise">{expertise.join(" · ")}</RecordRow>
          <RecordRow label="Contact">
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
            >
              {site.email}
            </a>
          </RecordRow>
          <RecordRow label="Elsewhere">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {elsewhere.map((place) => (
                <a
                  key={place.label}
                  href={place.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  {place.label}
                </a>
              ))}
            </span>
          </RecordRow>
        </div>
      </header>

      <div className="mt-14 space-y-16">
        {ordered.map((era, i) => (
          <EraSection key={era.id} era={era} index={i} />
        ))}
      </div>

      <GlyphBay className="mt-20" />

      <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 rule-t pt-5 pb-8">
        <Link
          href="/shots"
          className="text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
        >
          Shots
        </Link>
        <Link
          href="/colophon"
          className="text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
        >
          Colophon
        </Link>
      </footer>
    </main>
  );
}
```

- [ ] **Step 3: Check the whole thing builds and renders**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: clean. `app/page.tsx` no longer imports `Frame`, `Tags`, `Reveal`, `selected`, or `workAssets` — remove any import the linter reports as unused.

- [ ] **Step 4: Look at it**

Run: `pnpm dev`, open `http://localhost:3000`, and confirm by eye: five era sections newest-first with side projects last; Endgame AI and HEX each showing "Nothing public from this one yet."; ChessEver, Sylvan and Hitman's Library each showing two blocks and an `Open` control; opening one reveals its prose, record and remaining frames without the page navigating; the frames after the fold are not the same frames as the lede.

- [ ] **Step 5: Commit**

```bash
git add components/era-section.tsx app/page.tsx
git commit -m "The home is the work"
```

---

### Task 7: Retire the case route

**Files:**
- Delete: `app/work/[slug]/page.tsx` (and the now-empty `app/work/` tree)
- Modify: `next.config.ts`
- Modify: `data/work.ts`
- Modify: any file `grep` finds still referencing the removed exports

**Interfaces:**
- Removes: `Tier`, the `tier` field on `WorkItem`, and the `selected` export from `@/data/work`. `findWork` and `work` stay — `EraSection` uses `findWork`.

- [ ] **Step 1: Find every consumer before removing anything**

Run:

```bash
grep -rn "selected\|Tier\|tier\|/work/" app components lib data --include='*.ts' --include='*.tsx'
```

Expected consumers: `app/work/[slug]/page.tsx` (about to be deleted), `data/work.ts` itself, and comment text in `data/site.ts`. Anything else found must be handled in this task, not left for later.

- [ ] **Step 2: Add the redirects**

In `next.config.ts`, extend the `redirects()` array:

```ts
  /* /feed shipped in v1.0.0 and is linked from outside, so it moves rather than
     disappears — a live URL is a promise, and renaming a surface is not a reason
     to break one. The case pages are the same promise: they retired into the
     home, so their URLs land on the era that holds them.

     Written out rather than patterned. `/work/:slug -> /#:slug` would be wrong:
     only ChessEver has an era of its own name. A missing line here is a 404,
     which is the correct failure — better than a pattern that silently sends
     every unknown slug to the top of the home. */
  async redirects() {
    return [
      { source: "/feed", destination: "/shots", permanent: true },
      { source: "/work/chessever", destination: "/#chessever", permanent: true },
      { source: "/work/sylvan", destination: "/#independent", permanent: true },
      { source: "/work/hitmans-library", destination: "/#side-projects", permanent: true },
    ];
  },
```

- [ ] **Step 3: Delete the route**

```bash
git rm -r 'app/work'
```

- [ ] **Step 4: Purge the tier vocabulary**

In `data/work.ts`: delete the `Tier` type, delete `tier` from `WorkItem`, delete the `tier` line from each of the three items, and delete the `selected` export. Replace the file's header docblock with:

```ts
// One model for every piece of work.
//
// Where a piece sits is decided by its era, in data/eras.ts, which references
// it by slug. There is no tier: two ways to say where a piece belongs is one
// too many, and the tier that survived v1.11.0 had only ever held one name.
//
// See docs/specs/2026-09-01-home-as-feed-design.md.
```

Also update the trailing comment in `data/site.ts` ("Work lives in data/work.ts, tiered as selected / project / index.") to:

```ts
// Work lives in data/work.ts and is grouped into eras in data/eras.ts.
```

- [ ] **Step 5: Retire the field from the test fixture too**

`components/era-entry.test.tsx` sets `tier: "selected"` on its fixture. Delete that line and its comment, or the suite stops compiling the moment the field is gone.

- [ ] **Step 6: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`
Expected: all clean, all 181-plus tests passing. If `data/eras.test.ts` fails on "gives every piece of work exactly one era", an entry was dropped — fix the data, not the test.

- [ ] **Step 7: Check the redirects actually redirect**

Run `pnpm build && pnpm start`, then:

```bash
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/chessever
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/sylvan
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/hitmans-library
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/work/nonexistent
```

Expected: `308` with the era anchor for the first three; `404` for the fourth.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "The case pages retire into the home"
```

---

### Task 8: The panel arrives on the home

**Files:**
- Create: `lib/glyph/sweep.ts`
- Create: `components/panel-field.tsx`
- Modify: `components/shots-field.tsx` (lift its effect out; behaviour unchanged)
- Modify: `components/frame.tsx` (a `panel` variant)
- Modify: `components/case-reel.tsx` (lede frames opt in)
- Modify: `components/era-entry.tsx` (wrap each reel in a `PanelField`)
- Test: `lib/glyph/sweep.test.ts`

**Interfaces:**
- Produces: `runPanelSweep(host: HTMLElement): () => void` from `@/lib/glyph/sweep`; `<PanelField>{children}</PanelField>` from `@/components/panel-field`; `panel?: boolean` on `Frame`.

**What this is.** `ShotsField` lines 99–203 are already generic: the effect queries `[data-frame]` inside a root and sweeps a front across whatever it finds. Nothing in it knows about shots. Lifting it out is a simplification that happens to be what lets the home's frames arrive the same way.

- [ ] **Step 1: Lift the effect verbatim into `lib/glyph/sweep.ts`**

Move `SWEEP`, `BATCH`, `type Tile`, `measure`, and the entire body of the `useEffect` at `components/shots-field.tsx:99-203` into a new module, along with the `sample` and `paint` helpers from lines 66–97. The exported shape:

```ts
// lib/glyph/sweep.ts
import { BAND, PITCH, SKEW, cellsAcross, paintPanel, panelFrom, smoothstep, type Panel, type PanelBox } from "@/lib/glyph/panel";

/**
 * Sweep a dot-matrix front across every `[data-frame]` inside `host`.
 *
 * Lifted out of ShotsField unchanged: the effect never knew what a shot was, it
 * only knew how to find a frame, sample it, and dissolve a photograph out of a
 * panel. Returns its own teardown, so a caller's effect is one line.
 *
 * Every frame it touches must contain a <canvas> and an <img>, and the image
 * must start at opacity 0 — the sweep is what makes it visible.
 */
export function runPanelSweep(host: HTMLElement): () => void { /* the lifted body */ }
```

Keep every comment from the original — the notes about page-coordinate boxes, the ink being read once, and reduced motion being "given the value, never the journey to it" are load-bearing and were paid for in measurement.

- [ ] **Step 2: Write the guard test**

```ts
// lib/glyph/sweep.test.ts
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { runPanelSweep } from "./sweep";

describe("runPanelSweep", () => {
  it("does nothing and cleans up when the host holds no frames", () => {
    const host = document.createElement("div");
    expect(() => runPanelSweep(host)()).not.toThrow();
  });

  it("shows the photograph outright when motion is reduced", () => {
    // Reduced motion is given the value, never the journey to it.
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const host = document.createElement("div");
    host.innerHTML = `<div data-frame><canvas></canvas><img alt=""></div>`;
    const stop = runPanelSweep(host);
    expect(host.querySelector("img")!.style.opacity).toBe("1");
    stop();
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 3: Run it — red, then green as the lift lands**

Run: `pnpm exec vitest run lib/glyph/sweep.test.ts`
Expected: FAIL before the lift, PASS after.

- [ ] **Step 4: Write the wrapper**

```tsx
// components/panel-field.tsx
"use client";

import { useEffect, useRef } from "react";
import { runPanelSweep } from "@/lib/glyph/sweep";

/**
 * Any group of frames that should arrive as panels.
 *
 * `revision` rebuilds the sweep: the shots grid passes its column count, because
 * crossing the breakpoint rebuilds the columns and the observer has to be
 * rebuilt with them or it spends the rest of the page watching frames that are
 * no longer in the document. An unfolding entry passes its open state, because
 * frames that were collapsed when the effect ran were never observed.
 */
export function PanelField({
  revision,
  className,
  style,
  children,
}: {
  revision?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    return runPanelSweep(host);
  }, [revision]);

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Put ShotsField back together on top of it**

In `components/shots-field.tsx`, delete the lifted code and the now-unused imports, and replace the returned root `<div ref={root} className="grid ...">` with `<PanelField revision={columns} className="grid grid-cols-2 gap-[21px] lg:grid-cols-4" style={{ alignItems: "start" }}>`. The component keeps `useMediaQuery`, `bucketShots`, `DRIFT` and its markup, and loses `useCallback`, `useEffect`, `useRef` and the panel imports.

- [ ] **Step 6: Give Frame a panel variant**

In `components/frame.tsx`, add `panel = false` to the props, and when it is true: put `data-frame` on the wrapper, render `<canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />` above the `<Image>`, and add `opacity-0` to the image's class. Document the known limitation in a comment — an image that starts at zero opacity depends on the sweep to reveal it, exactly as the shots grid has since v1.10.0, and the sweep's own failure paths (no panel, tainted canvas, reduced motion) all set it back to 1.

- [ ] **Step 7: Opt the reels in**

In `components/case-reel.tsx`, pass `panel` to the `Frame` in the `full` branch only — a full-bleed frame is the one that reads as arriving; a pair or an inset plate dissolving four ways at once is a performance. In `components/era-entry.tsx`, wrap the lede reel in `<PanelField>` and the tail reel in `<PanelField revision={String(open)}>`.

- [ ] **Step 8: Verify, by eye and by suite**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`, then `pnpm dev` and confirm: `/shots` behaves exactly as before; the home's full-bleed frames resolve out of a dot panel on first scroll past and never re-run; opening an entry sweeps its newly revealed frames; `prefers-reduced-motion: reduce` shows every photograph outright.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "The sweep leaves the shots field, and the home arrives"
```

---

### Task 9: Ship v2.0.0

**Files:**
- Modify: `README.md`
- Modify: `data/changelog.ts`

- [ ] **Step 1: Update the README**

Record three things: the home is the work and there is no case route; `/work/:slug` redirects are written out per era, not patterned, and retiring a future case page means adding a line; and the panel sweep now lives in `lib/glyph/sweep.ts` and is used by both `/shots` and the home. Keep the existing `dynamicParams = false` note — the route it described is gone, but the trap it documents (a route that must 404 behind a `loading.tsx`) still applies to any future route.

- [ ] **Step 2: Add the changelog entry, newest first**

Prepend to the `changelog` array in `data/changelog.ts`. The field is `deployment`, not `url`, and it is filled in the next step:

```ts
  {
    version: "2.0.0",
    date: "2026-09-01",
    title: "The home is the work",
    notes: [
      "The home was an index to work rather than the work. It spent its first screen on a lockup and a section label, then handed out four identical covers that each promised the real thing lived one click away — and three clicks deep were three case pages almost nobody reached",
      "So the index is gone. The page is a lockup, a short record, then the eras themselves: a company, a role, a year range, a paragraph, and its work under it. Where a piece sits is decided by its era now, which is why the tier vocabulary went with the grid — two ways to say where a piece belongs is one too many",
      "An entry stands open at its first two blocks and unfolds the rest in place. It unfolds rather than navigates, and the part that is folded away is still in the document: collapsed with grid rows rather than hidden, so every word of every case study is still found by a search on the page. That is the only thing retiring the case pages did not cost",
      "It did cost three URLs, and they are redirected rather than dropped — written out one per era, because only one of the three has an era of its own name. A pattern would have sent every unknown slug to the top of the home, and a missing redirect ought to be a 404",
      "The frames arrive as panels on the home the way they always have on Shots, because the sweep never knew what a shot was. It only knew how to find a frame and dissolve a photograph out of a lattice, so it moved into the glyph engine and both surfaces call it",
      "Two eras carry nothing public and say so. No placeholder tile — a frame standing in for work nobody can see is padding wearing the shape of evidence",
    ],
  },
```

- [ ] **Step 3: Capture the deployment URL**

Run: `vercel deploy --prod` from the repo root, take the immutable deployment URL it prints, and put it in the `2.0.0` entry's `deployment` field. Old deployment URLs stay publicly viewable — deployment protection is off on this project on purpose, so do not re-enable it.

- [ ] **Step 4: Commit, tag, push**

```bash
git add README.md data/changelog.ts
git commit -m "v2.0.0: the home is the work"
git tag v2.0.0
git push origin main --tags
```

- [ ] **Step 5: Deploy both faces**

Run: `./scripts/deploy.sh`

Never a plain `vercel deploy --prod` against the portfolio project — the script swaps the `.vercel` / `.vercel-portfolio` link directories, and skipping it deploys the wrong project.

- [ ] **Step 6: Confirm on the live site**

Check on the deployed URL, not localhost — the Bash sandbox's localhost is not reachable from the browser. Confirm the five eras render, the three old case URLs land on their anchors, `/shots` is untouched, and both faces are up.

## Success criteria

1. The first screen of the home contains work, not an index of work.
2. Every frame that lived on a case page is reachable on the home without navigating.
3. A collapsed era downloads no images, and its text is still found by cmd-F.
4. `/work/chessever`, `/work/sylvan` and `/work/hitmans-library` resolve to their eras, not to 404s.
5. Nothing on the page moves that was not touched, arriving, or reporting.
6. A new past-year piece can be added by editing data and running `pnpm manifest`, with no component changes.
