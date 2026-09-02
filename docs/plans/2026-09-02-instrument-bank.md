# The Instrument Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scattered footer widgets with one grid of identical instrument cards, take the instruments out of the hero, cut the home to three authored-order products, and give case frames real presentation.

**Architecture:** A single `InstrumentCard` shell enforces footprint, radius, padding and label placement; the four readings render *inside* it. The existing `NowPlayingDisc` and the bay's `Pedometer` are **wrapped, not rewritten** — they carry measured paint behaviour and a pager, and re-deriving them would lose it. The pager's unadvertised fourth page is deleted.

**Tech Stack:** Next 16.3 (App Router, RSC), React 19, TypeScript, Tailwind v4, Vitest (node + jsdom), pnpm.

**Spec:** `docs/specs/2026-09-02-the-instrument-bank.md`

## Global Constraints

- **Law 4 stands unamended: nothing moves unless touched, arriving, or reporting live external state.** Cards lift on hover and turn on press — that is "touched". The bank plays ONE staggered arrival on first view and never again. No idle, no loop, no scroll-linked transform.
- **A card that cannot read says so.** Never blank, never a stale value shown as current. The unreported state already exists (`UNREPORTED` in `lib/glyph/steps-frames.ts`).
- **The hidden fourth page is removed** (user's instruction, mid-plan). The step pager returns to its three real faces, every one of them advertised by an indicator dot. The `/colophon` forge is a visible section on an out-of-scope page and stays.
- Pure monochrome. `--miss` is the single admitted hue and means one thing: a day the step goal was missed.
- **Every font size comes from the six-step scale** (`text-2xs` … `text-xl`) in `rem`. Never `px`, never a viewport unit or `clamp()` with a viewport term. `lib/type-scale.test.ts` enforces this — add every new component to its `GOVERNED` array.
- Spacing and radii read `--pg-gap`, `--pad`, `--radius-tile`, `--radius-window`.
- Build from the shared primitives in `components/ui.tsx`.
- An icon accompanies a word, never replaces one.
- **Responsive:** no route scrolls horizontally from 320px up; mobile is its own layout, not a squished desktop; touch targets at least 44px.
- `data/changelog.ts` and `docs/specs/` are historical records — never edited to match the present.
- This repo's AGENTS.md warns its Next.js has breaking changes versus what you may expect; read `node_modules/next/dist/docs/` before writing Next-API-shaped code. `next/image` uses `preload`, not `priority`.
- Every task ends green on `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`.

## File structure

| File | Responsibility |
| --- | --- |
| `components/instrument-card.tsx` + test | The shell: one footprint, one radius, one padding, one label slot, the lift, the unreported state. |
| `components/instrument-bank.tsx` + test | The grid: four cards, 4/2/2 columns, one staggered arrival. |
| `components/clock-face.tsx`, `weather-face.tsx` | Existing faces, resized to the card's measure. |
| `components/now-playing-disc.tsx`, `components/glyph-bay.tsx` | Existing instruments, WRAPPED into cards. `GlyphBay` retires as a layout; its two instruments survive. |
| `app/page.tsx` | Hero without instruments; three products; footer renders the bank. |
| `data/work.ts` | Endgame removed; three items in authored order. |
| `components/case-reel.tsx` | Frame presentation — plates, captions, device framing, one full-bleed. |

---

### Task 1: The card shell

**Files:**
- Create: `components/instrument-card.tsx`, `components/instrument-card.test.tsx`
- Modify: `lib/type-scale.test.ts` (add the new component to `GOVERNED`)

**Interfaces:**
- Produces: `CARD_FACE` (the face's pixel measure), `<InstrumentCard label={string} reading={string} children={ReactNode} interactive?={boolean} />`.

The card is the whole point of this plan: identical footprint, identical label slot, only the reading differs. Everything else in the bank composes it.

- [ ] **Step 1: Write the failing test**

```tsx
// components/instrument-card.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InstrumentCard } from "@/components/instrument-card";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentCard", () => {
  it("prints its label and its reading", () => {
    render(<InstrumentCard label="Lagos" reading="07:42"><span /></InstrumentCard>);
    expect(host.textContent).toContain("Lagos");
    expect(host.textContent).toContain("07:42");
  });

  it("says so when it has no reading, rather than going blank", () => {
    // An instrument that cannot read admits it. A blank card reads as broken.
    render(<InstrumentCard label="Weather"><span /></InstrumentCard>);
    expect(host.textContent).toContain("Weather");
    expect(host.textContent).toContain("—");
  });

  it("gives every card the same footprint, whatever it holds", () => {
    // The defect this guards: four widgets at four sizes with no shared
    // baseline, which is what the bank exists to replace.
    render(
      <>
        <InstrumentCard label="A" reading="1"><span /></InstrumentCard>
        <InstrumentCard label="B"><span>a much longer child</span></InstrumentCard>
      </>,
    );
    const [one, two] = [...host.querySelectorAll("[data-card]")];
    expect(one.className).toBe(two.className);
  });

  it("keeps the face square so the grid cannot distort it", () => {
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    const face = host.querySelector("[data-face]")!;
    expect(face.className).toContain("aspect-square");
  });

  it("is a button only when it has a second face to turn to", () => {
    // A card with one face is not a control, and a control that does nothing
    // is a lie told with a cursor.
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    expect(host.querySelector("button")).toBeNull();
    render(<InstrumentCard label="A" reading="1" interactive><span /></InstrumentCard>);
    expect(host.querySelector("button")).not.toBeNull();
  });

  it("meets the touch-target floor when it is a control", () => {
    render(<InstrumentCard label="A" reading="1" interactive><span /></InstrumentCard>);
    expect(host.querySelector("button")!.className).toMatch(/min-h-\[2\.75rem\]/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run components/instrument-card.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/instrument-card"`.

- [ ] **Step 3: Write the shell**

```tsx
// components/instrument-card.tsx
import type { ReactNode } from "react";

/**
 * The measure every face is drawn at. One number, because the defect this
 * component exists to fix was four instruments at four sizes — a large disc, a
 * medium card, a small clock — with no shared baseline between them.
 */
export const CARD_FACE = 96;

/**
 * One instrument, in the shape every instrument takes.
 *
 * The card owns footprint, radius, padding and where the label sits; the face
 * inside owns only what it reads. That division is the whole argument: a bank
 * of readings rather than a collection of widgets.
 *
 * `reading` absent is not the same as empty. A card with nothing to say prints
 * an em dash and keeps its label, because an instrument that cannot read must
 * say so — a blank card reads as broken, and a stale one lies.
 */
export function InstrumentCard({
  label,
  reading,
  interactive = false,
  onPress,
  children,
}: {
  label: string;
  /** The value, if there is one. Absent renders the unreported dash. */
  reading?: string;
  /** True only when the card has a second face to turn to. */
  interactive?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  const body = (
    <>
      <div
        data-face
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--radius-tile)] bg-surface-2"
      >
        {children}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-ink-3">{label}</span>
        <span className="font-mono text-2xs tabular-nums text-ink-2">{reading ?? "—"}</span>
      </div>
    </>
  );

  /* "If it looks like a card, it lifts" — the design language's second law, and
     the only motion here: it happens because the pointer arrived, not on its
     own. A card with one face is not a control and does not pretend to be. */
  const lift =
    "block w-full text-left transition-transform duration-200 ease-out hover:-translate-y-0.5";

  if (!interactive) return <div data-card className={lift}>{body}</div>;

  return (
    <button
      type="button"
      data-card
      onClick={onPress}
      className={`${lift} min-h-[2.75rem] cursor-pointer`}
    >
      {body}
    </button>
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run components/instrument-card.test.tsx && pnpm exec tsc --noEmit`
Expected: PASS. Note the "same footprint" test compares `className` on `[data-card]`, so the interactive and non-interactive variants deliberately differ — the test renders two non-interactive cards.

- [ ] **Step 5: Add to the type-scale guard, then commit**

Add `"components/instrument-card.tsx"` to `GOVERNED` in `lib/type-scale.test.ts`.

```bash
pnpm test && pnpm lint
git add components/instrument-card.tsx components/instrument-card.test.tsx lib/type-scale.test.ts
git commit -m "One shape for every instrument"
```

---

### Task 2: The bank

**Files:**
- Create: `components/instrument-bank.tsx`, `components/instrument-bank.test.tsx`
- Modify: `components/clock-face.tsx`, `components/weather-face.tsx` (accept the card's measure), `lib/type-scale.test.ts`

**Interfaces:**
- Consumes: `InstrumentCard`, `CARD_FACE`; `useWeather` from `@/lib/use-weather`; `handAngles` from `@/lib/clock`; `NowPlayingDisc` from `@/components/now-playing-disc`; the pedometer from `@/components/glyph-bay`.
- Produces: `<InstrumentBank />`.

**Read `components/glyph-bay.tsx` in full before writing this.** Wrap the `Pedometer`; do not re-derive it. `GlyphBay` retires as a layout wrapper only: export `Pedometer` so the bank can place it, and delete the `GlyphBay` flex row.

**Delete the hidden fourth page while you are in there** — the user asked for it directly. In `components/glyph-bay.tsx`: set `PAGES = FACES.length` (dropping the `+ 1`), delete `HIDDEN_FACE`, delete the `AUTHORED` frame and the `authoredGlyph` import, and remove the branch in the accessible label that announces "one page past the week". Then `git rm data/glyph.ts` if nothing else imports it — check with `grep -rn "data/glyph" app components lib`. The pager keeps its three real faces, each with its own indicator dot. Do not touch `components/glyph-toys.tsx` or `app/colophon/page.tsx`: that forge is a visible section on an out-of-scope page.

- [ ] **Step 1: Write the failing test**

```tsx
// components/instrument-bank.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstrumentBank } from "@/components/instrument-bank";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentBank", () => {
  it("shows every instrument as a card", () => {
    render(<InstrumentBank />);
    expect(host.querySelectorAll("[data-card]")).toHaveLength(4);
  });

  it("names each reading for someone who cannot see it", () => {
    render(<InstrumentBank />);
    const text = host.textContent ?? "";
    for (const label of ["Lagos", "Weather", "Playing", "Steps"]) {
      expect(text).toContain(label);
    }
  });

  it("never falls to one column, because a column of cards is a list", () => {
    render(<InstrumentBank />);
    const grid = host.querySelector("[data-bank]")!;
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-4");
    expect(grid.className).not.toMatch(/grid-cols-1\b/);
  });

  it("gives every card the same shell", () => {
    render(<InstrumentBank />);
    const faces = [...host.querySelectorAll("[data-face]")];
    expect(faces).toHaveLength(4);
    for (const face of faces) expect(face.className).toContain("aspect-square");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run components/instrument-bank.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Export the pedometer**

In `components/glyph-bay.tsx`: change `function Pedometer(` to `export function Pedometer(`, delete the `GlyphBay` component at the end of the file, and update its file docblock to say the instruments now stand in the bank. Do not touch the pedometer's internals, its pager, or its hidden page.

- [ ] **Step 4: Let the faces take a size**

`ClockFace` and `WeatherFace` already accept `size`. Confirm both render at `CARD_FACE` without clipping; if either has a hard-coded internal size, make it follow the prop.

- [ ] **Step 5: Write the bank**

```tsx
// components/instrument-bank.tsx
"use client";

import { ClockFace } from "@/components/clock-face";
import { CARD_FACE, InstrumentCard } from "@/components/instrument-card";
import { Pedometer } from "@/components/glyph-bay";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { WeatherFace } from "@/components/weather-face";
import { Reveal } from "@/lib/reveal";
import { useWeather } from "@/lib/use-weather";

/**
 * Every reading the site takes, in one grid.
 *
 * What this replaces: a large disc, a medium card, a small clock and a medium
 * weather face, split across two zones by a rule, at four sizes and on no
 * shared baseline. They read as widgets somebody collected. One card shape and
 * one grid make them a bank of instruments instead.
 *
 * Two columns is the floor. A single column of four cards is a list, and a list
 * of readings is the thing this is not.
 */
export function InstrumentBank({ className = "" }: { className?: string }) {
  const reading = useWeather();

  return (
    <div
      data-bank
      className={`grid grid-cols-2 gap-[var(--pg-gap)] lg:grid-cols-4 ${className}`}
    >
      {/* The stagger is the law's "arriving" clause, once and never again. */}
      <Reveal index={0}>
        <InstrumentCard label="Lagos" reading={undefined}>
          <ClockFace size={CARD_FACE} />
        </InstrumentCard>
      </Reveal>

      <Reveal index={1}>
        <InstrumentCard
          label="Weather"
          reading={reading ? `${Math.round(reading.temperature)}°` : undefined}
        >
          <WeatherFace face={reading?.condition ?? "unreported"} size={CARD_FACE} />
        </InstrumentCard>
      </Reveal>

      <Reveal index={2}>
        <NowPlayingDisc />
      </Reveal>

      <Reveal index={3}>
        <Pedometer />
      </Reveal>
    </div>
  );
}
```

**`NowPlayingDisc` and `Pedometer` must render their own `InstrumentCard`** so all four share the shell — give each one an `InstrumentCard` wrapper inside its own file, passing its label (`Playing`, `Steps`) and its reading, and rendering its existing face as the child at `CARD_FACE`. The pedometer's card is `interactive` and its `onPress` advances the existing pager across its three faces. Strip each component's own outer flex/label markup — the card owns that now.

- [ ] **Step 6: Run the tests**

Run: `pnpm exec vitest run components/instrument-bank.test.tsx && pnpm test && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS. `glyph-cell.test.tsx` and any bay test must still pass — if one fails because `GlyphBay` is gone, update the test to mount `Pedometer` directly rather than restoring the wrapper.

- [ ] **Step 7: Add to the guard and commit**

Add `"components/instrument-bank.tsx"` to `GOVERNED`.

```bash
git add -A
git commit -m "The readings become a bank"
```

---

### Task 3: The hero, and the footer that holds the bank

**Files:**
- Modify: `app/page.tsx`, `components/site-footer.tsx`

The instruments leave the hero entirely. The footer holds the bank, once.

- [ ] **Step 1: Take the instruments out of the hero**

In `app/page.tsx`, remove `<InstrumentPair size={56} />` from the header. The band becomes the statement plus the identity line — nothing else.

- [ ] **Step 2: Write the statement**

Replace the hero's copy with this draft. It is deliberately specific, and the user will edit it — the point is to give them something to react to rather than another job title:

```tsx
        <h1 className="max-w-[24ch] text-xl font-medium leading-[1.15] tracking-tight">
          I design and build the parts of a product people actually touch.
        </h1>
        <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-2">
          Interfaces, identity, and the systems underneath them — taken from
          nothing to shipped. Most recently for chess platforms and a revenue
          intelligence tool.
        </p>
        <p className="mt-5 text-sm text-ink-3">
          &rsquo;{site.name} · Lagos ·{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
          >
            {site.email}
          </a>
        </p>
```

- [ ] **Step 3: Put the bank in the footer**

In `app/page.tsx`'s own footer, replace `<InstrumentPair size={72} />` with `<InstrumentBank />`, and delete the `<GlyphBay className="mt-20" />` line above it — the bay's instruments are in the bank now. The `elsewhere` links stay beneath.

In `components/site-footer.tsx`, swap `InstrumentPair` for `InstrumentBank` so `/changelog` and `/system` match.

- [ ] **Step 4: Retire `InstrumentPair`**

`git rm components/instrument-pair.tsx components/instrument-pair.test.tsx`. Its shared-fetch behaviour lives in `lib/use-weather.ts` and is unaffected; confirm with `grep -rn "InstrumentPair" app components` that nothing references it.

- [ ] **Step 5: Verify and commit**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
git add -A
git commit -m "The hero says something, and the readings sit at the foot"
```

---

### Task 4: Three products

**Files:**
- Modify: `data/work.ts`

- [ ] **Step 1: Remove Endgame and set the order**

Delete the `endgame` `WorkItem` entirely — its authored-empty block list was furniture for artwork that never arrived. Reorder the remaining three so the array reads `hitmans-library`, `sylvan`, `chessever`.

Replace the docblock above `work` with:

```ts
/**
 * The work, in the order the home shows it.
 *
 * Authored rather than derived: all three are 2025, so a date cannot order
 * them and a `sort` field invented to justify a hand-picked sequence would be
 * a field that exists to be overridden. The array is the order.
 */
```

- [ ] **Step 2: Confirm nothing dangles**

Run `grep -rn "endgame" app components lib data --include='*.ts' --include='*.tsx'`. Expect hits only in `data/experience.ts` (the role is real and stays on `/about`) and `data/changelog.ts` (history, never edited). `public/work/endgame/` does not exist, so there is nothing to delete; `public/companies/endgame.png` is used by `/about` and stays.

- [ ] **Step 3: Verify and commit**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
git add data/work.ts
git commit -m "Three products, in the order they are meant to be read"
```

Expected: the three redirects in `next.config.ts` are unaffected — Endgame never had one — and `data/eras.test.ts` no longer exists to complain about coverage.
