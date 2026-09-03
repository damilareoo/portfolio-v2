# The Instrument Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the labelled card grid into an unlabelled instrument wall whose faces fill their cells, lead the hero with the name and a Book a call control, and announce the three products as featured work.

**Architecture:** `InstrumentCard` loses its label row and its fixed `CARD_FACE`; the face becomes a square that fills its cell via `aspect-square w-full`, and the value moves beneath the face as the sole identifier. `InstrumentBank` becomes `InstrumentWall` — one flush row divided by hairlines rather than four bordered cards.

**Tech Stack:** Next 16.3 (App Router, RSC), React 19, TypeScript, Tailwind v4, Vitest (node + jsdom), pnpm.

**Spec:** `docs/specs/2026-09-03-the-instrument-wall.md`

## Global Constraints

- **A reading that cannot read still says so.** The em dash rule is unchanged and not negotiable: never blank, never a stale or invented value.
- **Law 4 — nothing moves unless touched, arriving, or reporting live external state.** A reading lifts under the pointer; the steps reading turns when pressed or arrowed; the wall plays ONE staggered arrival on first view. Nothing idles, loops, or animates on scroll.
- Pure monochrome. `--miss` is the single admitted hue, meaning a day the step goal was missed. **No coloured footer ground** — considered and declined.
- Every font size from the six-step scale (`text-2xs` … `text-xl`) in `rem`; never `px`, never a viewport unit or `clamp()` with a viewport term. Add every new component to `GOVERNED` in `lib/type-scale.test.ts`, and remove any file that stops existing.
- Touch targets at least 44px in their smallest dimension.
- Two across on a phone, four from the tablet breakpoint, **never one**.
- No route scrolls horizontally at any width from 320px up; mobile is its own layout, not a squished desktop.
- `data/changelog.ts` and `docs/specs/` are historical records, never edited to match the present.
- This repo's AGENTS.md warns its Next.js has breaking changes versus what you may expect; read `node_modules/next/dist/docs/` before writing Next-API-shaped code.
- **Never drive the user's real browser, take screenshots, or run `screencapture`** — an earlier agent on this branch captured the user's actual desktop. Start your own server and drive a headless browser you launch yourself, proving server identity before trusting a number.
- Every task ends green on `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`.

---

### Task 1: The reading loses its label and fills its cell

**Files:**
- Modify: `components/instrument-card.tsx`, `components/instrument-card.test.tsx`
- Modify: `components/clock-face.tsx`, `components/weather-face.tsx`, `components/now-playing-disc.tsx`, `components/glyph-bay.tsx` (the faces stop taking a fixed pixel size)

**Interfaces:**
- Produces: `<InstrumentReading value?={string} onPress?={() => void} pressLabel?={string} srLabel={string}>{face}</InstrumentReading>` — renamed from `InstrumentCard`. `CARD_FACE` is deleted.

Two changes, and the second is what makes the wall possible.

**The label row goes.** The mono label above each reading is noise beside a face that already says what it is. The value takes its place beneath the face and becomes the sole identifier — but a screen reader still needs the word, so the component takes `srLabel` and renders it `sr-only`. Removing a visible label must not remove the accessible one.

**The face stops being 96px.** `CARD_FACE` is deleted. The face element becomes `aspect-square w-full`, so it takes whatever the cell gives it. Every face component that currently accepts a pixel `size` prop must instead fill its container: `ClockFace` and `WeatherFace` render SVG/canvas that already scale by viewBox, so they take `100%`; `NowPlayingDisc` and the `Pedometer` render `GlyphCell`, which takes a numeric `size` — give those a container-measuring approach (a `ResizeObserver` or a CSS-driven square with the canvas at `w-full h-full`) rather than a hard number. Read `components/glyph-cell.tsx` before deciding which.

- [ ] **Step 1: Rewrite the component's tests to the new shape**

Replace the label assertions in `components/instrument-card.test.tsx`:

```tsx
  it("shows the value, and no visible label beside it", () => {
    render(<InstrumentReading srLabel="Lagos" value="07:42"><span /></InstrumentReading>);
    expect(host.textContent).toContain("07:42");
    // The face says what it is; a word above it repeats the picture.
    const visible = host.querySelector("[data-value]")!.parentElement!;
    expect(visible.textContent).toBe("07:42");
  });

  it("still names itself for a screen reader", () => {
    // Removing a visible label must not remove the accessible one.
    render(<InstrumentReading srLabel="Lagos" value="07:42"><span /></InstrumentReading>);
    const named = host.querySelector(".sr-only");
    expect(named?.textContent).toContain("Lagos");
  });

  it("says so when it cannot read", () => {
    render(<InstrumentReading srLabel="Weather"><span /></InstrumentReading>);
    expect(host.querySelector("[data-value]")!.textContent).toBe("—");
  });

  it("treats an empty or blank value as no reading", () => {
    render(<InstrumentReading srLabel="Weather" value="   "><span /></InstrumentReading>);
    expect(host.querySelector("[data-value]")!.textContent).toBe("—");
  });

  it("lets the face fill whatever cell it is given", () => {
    // The defect this guards: four small discs stranded in wide cells.
    render(<InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>);
    const face = host.querySelector("[data-face]")!;
    expect(face.className).toContain("aspect-square");
    expect(face.className).toContain("w-full");
    expect(face.getAttribute("style") ?? "").not.toMatch(/width:\s*\d+px/);
  });

  it("is a control only when it has somewhere to turn", () => {
    render(<InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>);
    expect(host.querySelector("button")).toBeNull();
    render(<InstrumentReading srLabel="A" value="1" onPress={() => {}}><span /></InstrumentReading>);
    expect(host.querySelector("button")).not.toBeNull();
  });

  it("meets the touch floor when it is a control", () => {
    render(<InstrumentReading srLabel="A" value="1" onPress={() => {}}><span /></InstrumentReading>);
    expect(host.querySelector("button")!.className).toMatch(/min-h-\[2\.75rem\]/);
  });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm exec vitest run components/instrument-card.test.tsx`
Expected: FAIL — `InstrumentReading` does not exist and the label row still renders.

- [ ] **Step 3: Rewrite the component**

Rename `InstrumentCard` to `InstrumentReading` and rewrite it: delete `CARD_FACE`, delete the label row, put the value beneath the face carrying `data-value`, add the `sr-only` name, and make the face `aspect-square w-full`. Keep everything that already works — interactivity derived from `onPress`, the whitespace-aware em dash, the truncation, `pressLabel` reaching the button's `aria-label`, the touch floor, and the pointer lift. Keep the docblock's reasoning and extend it to say why the label went.

- [ ] **Step 4: Make every face fill its container**

`ClockFace`, `WeatherFace`, `NowPlayingDisc` and the `Pedometer` stop taking a pixel size. Do not change any paint logic, sampling, batching or pulse arithmetic — those were measured and tuned. Only how the face learns its size changes.

- [ ] **Step 5: Run everything and commit**

```bash
pnpm exec vitest run components/instrument-card.test.tsx && pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "A reading needs no label, and takes the room it is given"
```

---

### Task 2: The wall

**Files:**
- Rename: `components/instrument-bank.tsx` → `components/instrument-wall.tsx`, and its test
- Modify: `app/page.tsx`, `components/site-footer.tsx`, `lib/type-scale.test.ts`

**Interfaces:**
- Produces: `<InstrumentWall className?={string} />`.

Four readings flush against each other, spanning the full measure, divided by hairlines rather than sitting as four bordered cards. The outer edge is the page's own rule. Beneath: one line carrying the name and the links.

- [ ] **Step 1: Write the failing test**

```tsx
  it("shows every reading", () => {
    render(<InstrumentWall />);
    expect(host.querySelectorAll("[data-reading]")).toHaveLength(4);
  });

  it("names each one for a screen reader, though none is labelled on screen", () => {
    render(<InstrumentWall />);
    const named = [...host.querySelectorAll(".sr-only")].map((n) => n.textContent).join(" ");
    for (const name of ["Lagos", "Weather", "Music", "Steps"]) expect(named).toContain(name);
  });

  it("never falls to one column", () => {
    render(<InstrumentWall />);
    const wall = host.querySelector("[data-wall]")!;
    expect(wall.className).toContain("grid-cols-2");
    expect(wall.className).toContain("sm:grid-cols-4");
    expect(wall.className).not.toMatch(/grid-cols-1\b/);
  });

  it("divides readings with a rule rather than boxing each one", () => {
    // The chaos this replaces: four bordered cards floating under a rule.
    render(<InstrumentWall />);
    const wall = host.querySelector("[data-wall]")!;
    expect(wall.className).toMatch(/divide-x|border/);
  });
```

- [ ] **Step 2: Run it, confirm it fails, then build the wall**

`git mv` the component and its test, rename the export, and rewrite the markup: a `grid grid-cols-2 sm:grid-cols-4` with `divide-x divide-line` and a `rule-t` above, each cell holding one `InstrumentReading` with no gap between cells. Keep the `Reveal` stagger — one arrival, never again.

- [ ] **Step 3: Place it**

In `app/page.tsx`, the wall replaces the bank and spans the measure; the existing `elsewhere` link row becomes the single quiet line beneath it, joined by the name. Same swap in `components/site-footer.tsx`.

- [ ] **Step 4: Update the guard, verify, commit**

Fix `GOVERNED` in `lib/type-scale.test.ts` for the renamed file.

```bash
pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "The readings become the footer"
```

---

### Task 3: The hero leads with the name, and offers a call

**Files:**
- Modify: `app/page.tsx`, `data/site.ts`

- [ ] **Step 1: Reorder the hero**

The name comes first and bold, at `text-xl`, carrying the apostrophe mark. The statement follows at `text-base text-ink-2` — **do not touch its wording**, the owner is rewriting that sentence. Location and email follow at `text-sm text-ink-3`.

- [ ] **Step 2: Add the control**

A `Book a call` link styled as the filled chip `components/site-nav.tsx` uses for the active surface — `bg-strong text-on-strong`, `rounded-[4px]`, mono, uppercase, tracked — scaled up to read as a call to action and to clear `min-h-[2.75rem]`. It carries a `GlyphIcon name="arrow-out"` beside the words, never instead of them. `target="_blank"` and `rel="noopener noreferrer"`.

Add to `data/site.ts`:

```ts
  /* The handle is `damilareoo` on every other network, so this is an inference
     rather than a fact — the owner confirms or corrects it. */
  calendly: "https://calendly.com/damilareoo",
```

- [ ] **Step 3: Verify and commit**

```bash
pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "The name first, and a way to start a conversation"
```

---

### Task 4: Featured work, announced

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the heading**

Above the three products, on the rule that already separates them from the hero: the words `Featured work` at `text-sm text-ink-2`, and the count `03` rendered by `<GlyphText />` — the same 3×5 dot alphabet the instruments' numerals use. The count comes from `work.length`, never a literal, so it cannot go stale.

- [ ] **Step 2: Verify and commit**

```bash
pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build
git add -A
git commit -m "Say that the work is featured"
```

---

### Task 5: Measure it

- [ ] **Step 1** — Start your own server, drive your own headless browser, prove server identity by matching `.next/BUILD_ID` in the served HTML. Measure `scrollWidth` against `clientWidth` at `320, 360, 390, 414, 480, 640, 768, 834, 1024, 1280, 1440, 1920, 2560` on `/`, `/shots`, `/about`, `/colophon`, `/changelog` and `/system`, with `/` measured both folds-closed and folds-open.
- [ ] **Step 2** — Confirm the wall is two across at 320 and four from `sm`, that no face distorts, and that the hero's Book a call control clears 44px at every width.
- [ ] **Step 3** — Fix anything you find, mobile-first, then re-measure every cell.
- [ ] **Step 4** — `pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build`, then commit.

---

### Task 6: Ship — requires the owner's explicit go-ahead

- [ ] Update `README.md` for the wall, the hero and the featured heading.
- [ ] Add the `2.0.0` entry to `data/changelog.ts`, newest first, `deployment` empty.
- [ ] `vercel deploy --prod`, record the immutable URL in the entry.
- [ ] Commit, `git tag v2.0.0`, `git push origin home-as-feed --tags`.
- [ ] `./scripts/deploy.sh` — never a plain `vercel deploy --prod` against the portfolio project.
- [ ] Confirm on the deployed URL, not localhost.

## Success criteria

1. No reading in the footer carries a visible text label; the value alone identifies it, and a screen reader still hears the name.
2. Faces scale with their cell rather than a fixed pixel size, at every breakpoint.
3. The wall is two across on a phone and four from the tablet breakpoint, never one.
4. A reading that cannot read shows the em dash, never a stale or invented value.
5. Nothing in the footer moves except under touch, while reporting, or in the single arrival.
6. The hero reads name, then statement, then a Book a call control clearing 44px.
7. The three products are announced as featured work with the count in the dot alphabet.
8. No route scrolls horizontally at any width from 320px up.
