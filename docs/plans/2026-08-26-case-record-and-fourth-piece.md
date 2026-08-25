# Case Record and Fourth Piece — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Unify the site's three divergent record-row implementations into one shared primitive, have the case rail adopt it, and add Endgame.ai mobile as a placeholder fourth selected piece with drawn mockups.

**Architecture:** `RecordRow` joins the primitives in `components/ui.tsx`, defined to match what `about` and `colophon` already render so those two change by zero pixels. The case page drops its private `Row` and `RailLabel` and adopts `RecordRow` + `SectionLabel`. No structural change to any layout.

**Tech Stack:** Next.js (see `AGENTS.md`; read `node_modules/next/dist/docs/` before framework code), React 19 server components, Tailwind v4, TypeScript, Vitest.

**Spec:** `docs/specs/2026-08-26-case-record-and-fourth-piece.md`

## Global Constraints

- Monochrome only; the sole hue is `--miss` on the pedometer calendar. Mockups are monochrome too.
- Law 4: nothing moves unless touched, arriving, or reporting. Add no motion.
- Sizes in `rem`/`em`, never `px`.
- Shared primitives live in `components/ui.tsx`. Build from them; never ad-hoc styles.
- Separator borders use `rule-b` / `rule-t` with `last:bg-none`; containment borders stay `border-line`.
- **No prose is invented about the author's work.** Endgame.ai mobile ships as a placeholder: record and reel, no `intro`, no `approach`, no claims.
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` clean before every commit. Baseline: 199 tests / 14 files.
- Changelog entry required before shipping.

---

### Task 1: The record primitive

**Files:**
- Modify: `components/ui.tsx` (add `RecordRow`)
- Modify: `app/about/page.tsx` (delete local `Row`, import the primitive)
- Modify: `app/colophon/page.tsx` (same)
- Test: `components/ui.test.tsx` (new)

**Interfaces:**
- Produces: `RecordRow({ label, children }: { label: string; children: ReactNode })`

- [ ] **Step 1: Write the failing test**

Create `components/ui.test.tsx`:

```tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RecordRow } from "@/components/ui";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("RecordRow", () => {
  it("puts the label and its value in one grid row", () => {
    render(<RecordRow label="Year">2025</RecordRow>);
    const row = host.firstElementChild!;
    expect(row.className).toContain("grid-cols-[72px_minmax(0,1fr)]");
    expect(row.textContent).toBe("Year2025");
  });

  it("draws a dotted separator that the last row clears", () => {
    // The rule is a background image, so it is cleared with bg-none, never a border utility.
    render(<RecordRow label="Year">2025</RecordRow>);
    const cls = host.firstElementChild!.className;
    expect(cls).toContain("rule-b");
    expect(cls).toContain("last:bg-none");
  });

  it("renders a value that is markup, not only a string", () => {
    render(<RecordRow label="Live"><a href="https://example.com">example.com</a></RecordRow>);
    expect(host.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm exec vitest run components/ui.test.tsx`
Expected: FAIL — `RecordRow` is not exported from `@/components/ui`.

- [ ] **Step 3: Add the primitive**

Append to `components/ui.tsx`:

```tsx
/**
 * A fact, recorded. The site keeps facts in label/value rows on `/about`, on
 * `/colophon`, and on a case page, and until now each surface drew its own —
 * which is why the case page read as foreign rather than as under-designed.
 * This is the shape the majority already used.
 */
export function RecordRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 rule-b py-2.5 last:bg-none sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="text-[0.6875rem] text-ink-3">{label}</span>
      <span className="min-w-0 text-[0.75rem] text-ink">{children}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm exec vitest run components/ui.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Adopt it in `about` and `colophon`**

In `app/about/page.tsx` and `app/colophon/page.tsx`, delete the local `Row` function and import `RecordRow` from `@/components/ui`, renaming usages. `about`'s `Row` is byte-identical to the primitive; `colophon`'s differs only by lacking the `sm:` breakpoint, which it gains.

- [ ] **Step 6: Prove those two pages did not move**

Run `pnpm build`, then compare the rendered markup of both pages before and after. From a clean checkout of the previous commit, save `curl`-equivalent output via `pnpm build && pnpm start` on port 3001, or simpler: diff the built static HTML in `.next/server/app/about.html` and `about.html` from a stashed build. State plainly in the report which method was used and what the result was. **A visual difference on `/about` or `/colophon` is a failure**, not an improvement — those two pages define the shape.

- [ ] **Step 7: Verify and commit**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` — 202 tests expected.

```bash
git add components/ui.tsx components/ui.test.tsx app/about/page.tsx app/colophon/page.tsx
git commit -m "One record row, kept where the primitives live

Three surfaces drew their own label/value row. This is the shape two of the
three already used, so about and colophon change by nothing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The case rail adopts the record

**Files:**
- Modify: `app/work/[slug]/page.tsx` — delete local `Row` and `RailLabel`, use `RecordRow` and `SectionLabel`

**Interfaces:**
- Consumes: `RecordRow`, `SectionLabel` from `@/components/ui`

- [ ] **Step 1: Replace the private components**

Delete the `Row` and `RailLabel` function declarations. Import `RecordRow` and `SectionLabel` from `@/components/ui`. Replace every `<Row label="X">` with `<RecordRow label="X">` and every `<RailLabel>` with `<SectionLabel>`.

- [ ] **Step 2: Confirm nothing structural moved**

Run: `grep -n 'lg:grid-cols-\[264px_minmax(0,1fr)\]\|lg:sticky' app/work/\[slug\]/page.tsx`
Expected: both still present. The two-column grid and the sticky rail are explicitly NOT part of this change.

Run: `grep -cE 'function Row|function RailLabel' app/work/\[slug\]/page.tsx`
Expected: `0`.

- [ ] **Step 3: Verify and commit**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` — all clean, 202 tests.

```bash
git add app/work/\[slug\]/page.tsx
git commit -m "The case rail keeps its facts the way the site does

The layout does not move. What the chrome is made of does.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Endgame.ai mobile — the placeholder piece

**Files:**
- Create: `public/work/endgame-mobile/01-board.svg`, `02-browse.svg`, `03-puzzles.svg`, `04-profile.svg`
- Modify: `data/work.ts` (new entry), `scripts/manifest.mjs` output via `pnpm manifest`

- [ ] **Step 1: Draw the four mockups**

Each is a monochrome SVG phone frame, 390×844 (iPhone viewport), drawn in the site's own hand:
tokens `#0A0A0A` ink on `#F4F4F4`, Suisse-like geometric sans via `font-family="system-ui"`, 12px
corner radii, hairline `#E9E9E9` separators. No colour, no gradients, no shadows.

- `01-board.svg` — an 8×8 board (alternating `#E9E9E9` / `#F4F4F4` squares), two player rows with clocks, a move list column.
- `02-browse.svg` — a list of five in-progress games: player pair, a result/clock column, a thin rule between rows.
- `03-puzzles.svg` — a board with one highlighted square, a streak counter, a difficulty row.
- `04-profile.svg` — an avatar block, a rating number, a line chart of rating over time (polyline, no fill), a games-played list.

Keep each under 8KB. They are diagrams, not illustrations.

- [ ] **Step 2: Add the work entry**

Insert into `data/work.ts` in the `work` array, before `damilares-skills`:

```ts
  {
    slug: "endgame-mobile",
    title: "Endgame.ai Mobile",
    oneLiner: "Chess on a phone, for people who follow the game.",
    year: "2026",
    period: "2026 — Now",
    tier: "selected",
    disciplines: ["Product Design"],
    domain: "endgame.ai",
    category: "Mobile",
    mark: "E",
    tone: "strong",
  },
```

No `intro`, no `approach`, no `blocks`, no `href`. The template already renders a selected piece
without blocks by showing its record and saying so, rather than padding.

- [ ] **Step 3: Regenerate the asset manifest**

Run: `pnpm manifest`
Expected: `data/assets.generated.ts` gains a `endgame-mobile` key with the four SVGs in filename order.

- [ ] **Step 4: Confirm four selected pieces and a built route**

Run: `pnpm build`
Expected: the route list shows `/work/endgame-mobile` as SSG alongside the other three.

Run: `grep -c 'tier: "selected"' data/work.ts`
Expected: `4`.

- [ ] **Step 5: Verify and commit**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`

```bash
git add public/work/endgame-mobile data/work.ts data/assets.generated.ts
git commit -m "Endgame.ai mobile joins the selected work, as a placeholder

Four frames drawn rather than captured, and no prose: the piece carries its
record and says plainly that there is nothing else to show yet.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Say the frames are drawn

**Files:**
- Modify: `app/work/[slug]/page.tsx` (a caption under the reel when a piece's artwork is authored)
- Modify: `data/work.ts` (a `recreated?: boolean` field on `WorkItem`)

- [ ] **Step 1: Add the field**

In `data/work.ts`, add to the `WorkItem` type:

```ts
  /**
   * True when the artwork is drawn rather than captured. The page says so: this
   * site does not show a frame it did not make and let it read as a screenshot.
   */
  recreated?: boolean;
```

Set `recreated: true` on the `endgame-mobile` entry.

- [ ] **Step 2: Say it on the page**

In `app/work/[slug]/page.tsx`, immediately after the reel renders, add:

```tsx
          {item.recreated && (
            <p className="mt-6 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-3">
              Frames drawn for this page, not captured from the product
            </p>
          )}
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`

```bash
git add data/work.ts app/work/\[slug\]/page.tsx
git commit -m "A drawn frame says it is drawn

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Ship v1.9.0

- [ ] **Step 1: Changelog entry** at the head of `data/changelog.ts`, version `1.9.0`, date `2026-08-25`, title `"One record, and a fourth piece"`, in the house voice: why three divergent rows was the real reason the case page read as foreign; that about and colophon changed by nothing because they defined the shape; that the layout did not move; that Endgame.ai mobile is a placeholder whose frames are drawn and say so.
- [ ] **Step 2:** `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`
- [ ] **Step 3:** STOP. Deploying, tagging, and pushing to `main` are outward-facing and need the repo owner's explicit go-ahead. Do not run `./scripts/deploy.sh`, `git tag`, or `git push`.

## Self-Review

**Spec coverage.** Diagnosis → Task 1's primitive. Rail becomes a record → Task 2. Nothing structural moves → Task 2 Step 2 asserts it. Fourth piece → Task 3. Frames labelled as recreations → Task 4. Prose not invented → Task 3 Step 2 ships no `intro`/`approach`. Out-of-scope items (feed, toys, archive) appear in no task.

**Type consistency.** `RecordRow({label, children})` defined in Task 1, consumed in Tasks 1 and 2 with those names. `recreated?: boolean` defined in Task 4 Step 1, read in Step 2.

**Known risk.** Task 1 Step 6's before/after comparison is the weak point — if it cannot be done cleanly, the fallback is to diff the two `Row` implementations by hand and state that the primitive is character-identical to `about`'s. Say which was done.
