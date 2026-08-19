# Glyph Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-purpose halftone disc with one monochrome cell engine driving several live readouts — Spotify playback, daily steps, and an authored easter egg — in a dot-matrix visual language.

**Architecture:** A pure TypeScript engine (`lib/glyph/`) owns cells, spring physics, ripples, and a self-terminating animation loop, with no React and no knowledge of any data source. Frame sources are pure functions `(state) => Float32Array` of cell values. A single React component (`components/glyph-cell.tsx`) binds the engine to a canvas and handles pointer, paging, reduced motion, and accessibility. Faces are composed from these three layers and never reach past them.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5, Tailwind CSS 4 on CSS custom properties, Upstash Redis over REST, Vitest (added in Task 1).

**Spec:** `docs/specs/2026-08-18-glyph-matrix-design.md`

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **No accent hue enters the site.** Missed days render as an unfilled outline dot, hit days as filled. No red, no colour of any kind — cells draw in `currentColor` only.
- **No Nothing code, assets, or trademarks enter the repository.** Every glyph is drawn from primitives in our own source.
- **Nothing claims to be beat-synchronised.** The Spotify motion is named `playheadPulse` / "playhead pulse" in code, UI, and colophon. Never `beat`, `bpm`, or `tempo`.
- **Law 4:** *Nothing moves unless touched, arriving, or reporting.* A card with no live state to report holds no running animation. The loop must terminate itself.
- **`prefers-reduced-motion` leaves every value readable and every page reachable.** Values update; nothing travels.
- **Degradation:** absent store, absent credentials, and failed fetch all fall through to placeholder dots. A readout is decoration on top of the page, never a reason to fail it. Mirror the rule in `lib/counters.ts:1-11`.
- **Keyboard:** every value in the bay is reachable by keyboard. Swipe is pointer enhancement only.
- **Physics constants** carry over unchanged from `components/halftone-disc.tsx:22-33`: stiffness 400, damping 32, push radius 78, push strength 30, ripple speed 320, ripple width 26, ripple strength 340, ripple life 1.3s.
- **Pulse period:** 2000ms, as a named constant beside the existing ripple tuning.
- **Daily step goal:** 10000, in `data/site.ts`.
- **Comments** match the surrounding codebase: sparse, explaining *why* rather than *what*, in the voice of the existing files.
- **Never commit `.env.local` or any secret.** `STEPS_INGEST_SECRET` is set via `vercel env add`, never written to the repo.

## File Structure

| File | Responsibility |
|---|---|
| `lib/glyph/matrix.ts` | Cells, spring integration, ripples, tuning constants. Pure. |
| `lib/glyph/font.ts` | 3×5 dot numerals and text stamping onto a frame. Pure. |
| `lib/glyph/glyphs.ts` | Frame sources — mark, artwork, walk, number, week, entrance. Pure. |
| `lib/glyph/loop.ts` | Self-terminating rAF loop, decoupled from React. |
| `components/glyph-cell.tsx` | Canvas binding, pointer, paging, reduced motion, a11y. |
| `components/glyph-bay.tsx` | The home pair — Spotify card and pedometer card. |
| `components/glyph-forge.tsx` | Colophon drawing instrument. |
| `lib/steps.ts` | Typed read/write over Upstash, aggregation, plausibility. |
| `app/api/steps/route.ts` | POST (secret-guarded) and GET. |
| `data/glyph.ts` | The authored easter-egg glyph, as a cell array. |
| `docs/steps-setup.md` | Author-facing phone automation guide. |

Retired: `components/halftone-disc.tsx`, `components/value-field.tsx`, `lib/value-field.tsx`.

---

### Task 1: The engine, the font, and the disc ported onto it

The riskiest step — generalising working physics — verified against an appearance you can already see. No visual change ships from this task.

**Files:**
- Create: `vitest.config.ts`, `lib/glyph/matrix.ts`, `lib/glyph/font.ts`, `lib/glyph/glyphs.ts`, `lib/glyph/loop.ts`, `components/glyph-cell.tsx`
- Create tests: `lib/glyph/matrix.test.ts`, `lib/glyph/font.test.ts`
- Modify: `package.json` (add `vitest`, `test` script), `app/page.tsx:119` (swap `HalftoneDisc` for `GlyphCell`)
- Delete: `components/halftone-disc.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces, relied on by Tasks 3–6:
  ```ts
  // lib/glyph/matrix.ts
  export type Cell = { x: number; y: number; ox: number; oy: number;
                       vx: number; vy: number; v: number; tv: number };
  export type Ripple = { x: number; y: number; born: number };
  export type Pointer = { x: number; y: number } | null;
  export const TUNING: { STIFFNESS: 400; DAMPING: 32; PUSH_RADIUS: 78;
    PUSH_STRENGTH: 30; RIPPLE_SPEED: 320; RIPPLE_WIDTH: 26;
    RIPPLE_STRENGTH: 340; RIPPLE_LIFE: 1.3; PULSE_PERIOD_MS: 2000 };
  export function buildCells(grid: number, size: number,
    shape: "circle" | "square"): Cell[];
  export function cellIndex(cell: Cell, grid: number, size: number): number;
  export function setTargets(cells: Cell[], values: Float32Array): void;
  export function settle(cells: Cell[]): void;
  export function stepCells(cells: Cell[], dt: number, now: number,
    pointer: Pointer, ripples: Ripple[]): boolean; // returns `busy`
  export function liveRipples(ripples: Ripple[], now: number): Ripple[];

  // lib/glyph/font.ts
  export function stampText(frame: Float32Array, grid: number, text: string,
    left: number, top: number): void;
  export function textWidth(text: string): number;

  // lib/glyph/glyphs.ts
  export function emptyFrame(grid: number): Float32Array;
  export function spotifyMark(grid: number): Float32Array;
  export function artFrame(pixels: Uint8ClampedArray, grid: number): Float32Array;

  // components/glyph-cell.tsx
  export function GlyphCell(props: {
    grid: number; size: number; shape?: "circle" | "square";
    frame: Float32Array | null; className?: string; label: string;
    pages?: number; page?: number; onPageChange?: (page: number) => void;
    onTick?: (now: number) => Float32Array | null;
  }): JSX.Element;
  ```

- [ ] **Step 1: Add Vitest**

```bash
pnpm add -D vitest@^3
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// The glyph engine and frame sources are pure, so they test in node with no
// browser environment and no React.
export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
  resolve: { alias: { "@": resolve(__dirname, ".") } },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Write the failing font test**

Create `lib/glyph/font.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { stampText, textWidth } from "./font";

// glyphs.ts does not exist yet at this step, so the frame is built inline.
const emptyFrame = (grid: number) => new Float32Array(grid * grid);

describe("micro font", () => {
  it("measures digits at 3 wide with a 1 column gap", () => {
    expect(textWidth("8")).toBe(3);
    expect(textWidth("88")).toBe(7);
  });

  it("measures the comma narrower than a digit", () => {
    expect(textWidth(",")).toBe(1);
    expect(textWidth("1,0")).toBe(3 + 1 + 1 + 1 + 3);
  });

  it("stamps a digit as lit cells inside its 3x5 box", () => {
    const grid = 8;
    const frame = emptyFrame(grid);
    stampText(frame, grid, "8", 0, 0);
    // "8" is solid across its top row.
    expect([frame[0], frame[1], frame[2]]).toEqual([1, 1, 1]);
    // Its middle row is lit at the edges and the centre.
    expect(frame[2 * grid + 1]).toBe(1);
    // Nothing outside the 3-wide box is touched.
    expect(frame[3]).toBe(0);
  });

  it("clips rather than wrapping when stamped past the right edge", () => {
    const grid = 5;
    const frame = emptyFrame(grid);
    stampText(frame, grid, "8", 3, 0);
    // Column 5 does not exist, so row 1 must not be lit from a wrap.
    expect(frame[grid + 0]).toBe(0);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `pnpm test lib/glyph/font.test.ts`
Expected: FAIL — cannot resolve `./font`.

- [ ] **Step 4: Implement the font**

Create `lib/glyph/font.ts`. Each glyph is a bitmap of `w × 5`, row-major, `1` lit.

```ts
/**
 * A 3x5 dot alphabet, drawn here rather than shipped as a font file so the
 * numerals are made of the same cells as everything else on the matrix.
 */
const HEIGHT = 5;
const GAP = 1;

type Glyph = { w: number; bits: number[] };

const GLYPHS: Record<string, Glyph> = {
  "0": { w: 3, bits: [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1] },
  "1": { w: 3, bits: [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1] },
  "2": { w: 3, bits: [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1] },
  "3": { w: 3, bits: [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1] },
  "4": { w: 3, bits: [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1] },
  "5": { w: 3, bits: [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1] },
  "6": { w: 3, bits: [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1] },
  "7": { w: 3, bits: [1,1,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1] },
  "8": { w: 3, bits: [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1] },
  "9": { w: 3, bits: [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1] },
  ",": { w: 1, bits: [0, 0, 0, 1, 1] },
  "%": { w: 3, bits: [1,0,1, 0,0,1, 0,1,0, 1,0,0, 1,0,1] },
  " ": { w: 2, bits: [0,0, 0,0, 0,0, 0,0, 0,0] },
};

export function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const glyph = GLYPHS[char];
    if (!glyph) continue;
    if (width > 0) width += GAP;
    width += glyph.w;
  }
  return width;
}

/** Stamps lit cells into `frame`. Cells outside the grid are dropped, never wrapped. */
export function stampText(
  frame: Float32Array,
  grid: number,
  text: string,
  left: number,
  top: number,
): void {
  let x = left;
  for (const char of text) {
    const glyph = GLYPHS[char];
    if (!glyph) continue;
    for (let row = 0; row < HEIGHT; row++) {
      for (let col = 0; col < glyph.w; col++) {
        if (!glyph.bits[row * glyph.w + col]) continue;
        const gx = x + col;
        const gy = top + row;
        if (gx < 0 || gx >= grid || gy < 0 || gy >= grid) continue;
        frame[gy * grid + gx] = 1;
      }
    }
    x += glyph.w + GAP;
  }
}
```

- [ ] **Step 5: Run the font test and confirm it passes**

Run: `pnpm test lib/glyph/font.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Write the failing engine test**

Create `lib/glyph/matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TUNING, buildCells, cellIndex, liveRipples, setTargets, settle, stepCells } from "./matrix";

const GRID = 8;
const SIZE = 80;

describe("buildCells", () => {
  it("fills every position on a square", () => {
    expect(buildCells(GRID, SIZE, "square")).toHaveLength(GRID * GRID);
  });

  it("drops corners on a circle", () => {
    const cells = buildCells(GRID, SIZE, "circle");
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBeLessThan(GRID * GRID);
  });

  it("places cells at their own index", () => {
    const cells = buildCells(GRID, SIZE, "square");
    expect(cellIndex(cells[0], GRID, SIZE)).toBe(0);
    expect(cellIndex(cells[GRID * GRID - 1], GRID, SIZE)).toBe(GRID * GRID - 1);
  });
});

describe("stepCells", () => {
  it("reports idle when nothing is acting on it", () => {
    const cells = buildCells(GRID, SIZE, "square");
    settle(cells);
    expect(stepCells(cells, 1 / 60, 0, null, [])).toBe(false);
  });

  it("reports busy while values are still migrating", () => {
    const cells = buildCells(GRID, SIZE, "square");
    const target = new Float32Array(GRID * GRID).fill(1);
    setTargets(cells, target);
    expect(stepCells(cells, 1 / 60, 0, null, [])).toBe(true);
  });

  it("converges a migrating value onto its target", () => {
    const cells = buildCells(GRID, SIZE, "square");
    setTargets(cells, new Float32Array(GRID * GRID).fill(1));
    for (let i = 0; i < 600; i++) stepCells(cells, 1 / 60, i * 16, null, []);
    expect(cells[0].v).toBeCloseTo(1, 5);
  });

  it("pushes cells away from the pointer and settles them back", () => {
    const cells = buildCells(GRID, SIZE, "square");
    settle(cells);
    const near = cells[0];
    stepCells(cells, 1 / 60, 0, { x: near.x, y: near.y + 1 }, []);
    expect(Math.abs(near.vy)).toBeGreaterThan(0);

    for (let i = 0; i < 600; i++) stepCells(cells, 1 / 60, i * 16, null, []);
    expect(Math.abs(near.oy)).toBeLessThan(0.05);
  });
});

describe("liveRipples", () => {
  it("keeps a ripple within its life and drops it after", () => {
    const ripples = [{ x: 0, y: 0, born: 0 }];
    expect(liveRipples(ripples, 100)).toHaveLength(1);
    expect(liveRipples(ripples, TUNING.RIPPLE_LIFE * 1000 + 1)).toHaveLength(0);
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `pnpm test lib/glyph/matrix.test.ts`
Expected: FAIL — cannot resolve `./matrix`.

- [ ] **Step 8: Implement the engine**

Create `lib/glyph/matrix.ts` by lifting `components/halftone-disc.tsx:35-60` and `:211-284` and generalising them: `GRID`, `SIZE`, and the circular cull become parameters; the rAF loop and all canvas work move out. `stepCells` runs one integration step over every cell — value migration toward `tv` at `dt * 6`, pointer push, ripple impulses, then the spring — and returns whether anything is still in flight. When it returns `false` the caller zeroes `ox/oy/vx/vy`, exactly as `halftone-disc.tsx:280-282` does today.

Create `lib/glyph/glyphs.ts` with `emptyFrame`, `spotifyMark` (lifted verbatim from `markValues()` at `halftone-disc.tsx:68-116`, with `GRID` and `SUPER` as parameters), and `artFrame` (lifted from `artValues()` at `:134-141`).

Create `lib/glyph/loop.ts` — a `createLoop(step: (now: number) => boolean)` returning `{ run, stop }`, holding the single-frame-in-flight guard from `halftone-disc.tsx:207-209` and self-terminating when `step` returns `false`.

- [ ] **Step 9: Run the engine test and confirm it passes**

Run: `pnpm test`
Expected: PASS, all tests in both files.

- [ ] **Step 10: Build the cell component**

Create `components/glyph-cell.tsx` — the client component that owns the canvas, resolves `currentColor` through `getComputedStyle` as `halftone-disc.tsx:193` does, applies the light-skin inversion from `:177-179`, wires pointer move / enter / leave / down to the engine, reads `prefers-reduced-motion`, and exposes `pages` / `page` / `onPageChange` with `ArrowLeft` / `ArrowRight` keyboard handling and a `role="img"` `aria-label`. Paging props are unused by this task's only caller and exist for Task 4.

- [ ] **Step 11: Port the disc and delete it**

In `app/page.tsx:119`, replace `<HalftoneDisc />` with the equivalent `GlyphCell` composition — grid 32, size 300, shape `circle`, Spotify polling and artwork dithering carried over from `halftone-disc.tsx:310-384`. Delete `components/halftone-disc.tsx`.

- [ ] **Step 12: Verify no visual change**

Run: `pnpm build && pnpm lint && pnpm test`
Then `pnpm dev` and confirm at `http://localhost:3000`: the disc holds the Spotify mark when silent, dithers to artwork when a track plays, pushes under the pointer, ripples on click, and goes fully still when untouched. Confirm in DevTools Performance that no rAF frames fire at rest.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Glyph engine: the disc becomes the first client of a general matrix"
```

---

### Task 2: The steps data path

Independent of Task 1; runs in parallel.

**Files:**
- Create: `lib/steps.ts`, `lib/steps.test.ts`, `app/api/steps/route.ts`, `docs/steps-setup.md`
- Modify: `data/site.ts` (add `stepGoal`)

**Interfaces:**
- Consumes: `lib/counters.ts` — `countersConfigured`, and its `command()` pattern.
- Produces, relied on by Task 4:
  ```ts
  // NOTE: `steps` and `today` are nullable, changed from the original draft.
  // `null` means the day was never reported (render placeholder dots); a
  // reported `0` is a real day of not walking. `average7` covers reported
  // days only, and reads 0 when nothing at all has been reported.
  export type StepsDay = { date: string; steps: number | null };
  export type StepsReading = {
    today: number | null; days: StepsDay[]; average7: number;
    updatedAt: number | null; goal: number;
  };
  export const STEP_CEILING: 200000;
  export function stepsKey(date: string): string;          // `steps:2026-08-18`
  export function isPlausible(prev: number | null, next: number): boolean;
  export function averageOf(days: StepsDay[]): number;
  export function lastNDates(today: Date, n: number): string[];
  export async function readSteps(goal: number): Promise<StepsReading | null>;
  export async function writeSteps(date: string, steps: number): Promise<boolean>;
  ```
  `GET /api/steps` returns `StepsReading`, or `{ configured: false }` when no store.

- [ ] **Step 1: Write the failing test**

Create `lib/steps.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STEP_CEILING, averageOf, isPlausible, lastNDates, stepsKey } from "./steps";

describe("stepsKey", () => {
  it("namespaces by date", () => {
    expect(stepsKey("2026-08-18")).toBe("steps:2026-08-18");
  });
});

describe("isPlausible", () => {
  it("rejects negatives and non-finite values", () => {
    expect(isPlausible(null, -1)).toBe(false);
    expect(isPlausible(null, Number.NaN)).toBe(false);
    expect(isPlausible(null, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects values above the daily ceiling", () => {
    expect(isPlausible(null, STEP_CEILING + 1)).toBe(false);
    expect(isPlausible(null, STEP_CEILING)).toBe(true);
  });

  it("rejects a same-day regression, since steps only accumulate", () => {
    expect(isPlausible(5000, 4999)).toBe(false);
    expect(isPlausible(5000, 5000)).toBe(true);
    expect(isPlausible(5000, 5001)).toBe(true);
  });

  it("accepts any plausible value when there is no prior reading", () => {
    expect(isPlausible(null, 0)).toBe(true);
    expect(isPlausible(null, 5000)).toBe(true);
  });
});

describe("averageOf", () => {
  it("returns 0 for no days rather than dividing by zero", () => {
    expect(averageOf([])).toBe(0);
  });

  it("averages over every day given, including zeroes", () => {
    expect(averageOf([
      { date: "2026-08-17", steps: 1000 },
      { date: "2026-08-18", steps: 0 },
    ])).toBe(500);
  });

  it("rounds to a whole step", () => {
    expect(averageOf([
      { date: "2026-08-16", steps: 1 },
      { date: "2026-08-17", steps: 1 },
      { date: "2026-08-18", steps: 2 },
    ])).toBe(1);
  });
});

describe("lastNDates", () => {
  it("returns n dates ending today, oldest first", () => {
    expect(lastNDates(new Date("2026-08-18T12:00:00Z"), 3))
      .toEqual(["2026-08-16", "2026-08-17", "2026-08-18"]);
  });

  it("crosses a month boundary", () => {
    expect(lastNDates(new Date("2026-09-01T12:00:00Z"), 2))
      .toEqual(["2026-08-31", "2026-09-01"]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm test lib/steps.test.ts`
Expected: FAIL — cannot resolve `./steps`.

- [ ] **Step 3: Implement `lib/steps.ts`**

Mirror `lib/counters.ts` exactly — same `url`/`token` resolution, same private `command()` returning `null` on any failure, same "a readout is never a reason to fail the page" comment discipline. Keys expire after 60 days (`EXPIRE <key> 5184000`). `readSteps` issues one `MGET` over `lastNDates(new Date(), 7).map(stepsKey)` plus a `GET steps:updated-at`, so a full reading is two round trips.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm test lib/steps.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Write the route**

Create `app/api/steps/route.ts` with `export const dynamic = "force-dynamic"`.

`POST`: read `Authorization: Bearer <token>`; compare against `process.env.STEPS_INGEST_SECRET` using `crypto.timingSafeEqual` over equal-length buffers, returning 401 on any mismatch **and** when the env var is unset — an unconfigured secret must never mean an open route. Parse `{ steps: number, date?: string }`, defaulting `date` to today in `Africa/Lagos` (the site's stated coordinates). Reject with 422 when `isPlausible(prev, steps)` is false. On success write the day key and `steps:updated-at`, and return `{ ok: true }`.

`GET`: return `await readSteps(site.stepGoal)`, or `{ configured: false }` when `countersConfigured` is false. Header `Cache-Control: no-store`, as `app/api/now-playing/route.ts:8` does.

Add `stepGoal: 10000` to `data/site.ts`.

- [ ] **Step 6: Verify the route end to end**

```bash
pnpm dev &
curl -s localhost:3000/api/steps | head -c 200                      # reading or configured:false
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/steps \
  -H 'content-type: application/json' -d '{"steps":5000}'           # expect 401
```
Then set a local secret in `.env.local`, restart, and confirm a correct bearer returns 200, a wrong one 401, `{"steps":-1}` returns 422, and a repeat POST of a lower value for the same day returns 422.

- [ ] **Step 7: Provision the production secret**

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env add STEPS_INGEST_SECRET production
```
Do not write the value into any file in the repository.

- [ ] **Step 8: Write the setup guide**

Create `docs/steps-setup.md`: install Tasker, grant it Health Connect read access for steps, create a time profile firing every 30 minutes, add a Health Connect read action for today's step total, add an HTTP Request action `POST https://damilareoo-xyz.vercel.app/api/steps` with the bearer header and `{"steps": %steps}` body, and a verification step (`curl` the GET route and confirm the number moves). Include the MacroDroid equivalent in a short second section.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Steps: guarded ingest, daily keys, seven-day reading"
```

---

### Task 3: The Spotify face

**Files:**
- Create: `lib/glyph/pulse.ts`, `lib/glyph/pulse.test.ts`, `lib/glyph/tone.ts`, `lib/glyph/tone.test.ts`
- Modify: `components/glyph-cell.tsx` (accept emitted ripples from a tick callback; area-linear ink), `app/api/now-playing/route.ts:64` (image selection), `app/page.tsx`

**Interfaces:**
- Consumes: Task 1 — `TUNING.PULSE_PERIOD_MS`, `Ripple`, `GlyphCell`, `artFrame`, `spotifyMark`.
- Produces:
  ```ts
  export function pulsePhase(progressMs: number, periodMs: number): number; // 0..1
  export function pulsesBetween(prevMs: number, nowMs: number, periodMs: number): number;
  export function fingerprint(frame: Float32Array): { centre: [number, number]; density: number };

  // lib/glyph/tone.ts
  export function autoLevel(frame: Float32Array): Float32Array;
  export function inkRadius(value: number, cell: number): number;
  ```

- [ ] **Step 1: Write the failing test**

Create `lib/glyph/pulse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fingerprint, pulsePhase, pulsesBetween } from "./pulse";

describe("pulsePhase", () => {
  it("is 0 at the start of a period and 0.5 at its middle", () => {
    expect(pulsePhase(0, 2000)).toBe(0);
    expect(pulsePhase(1000, 2000)).toBe(0.5);
  });

  it("wraps, so the same position always gives the same phase", () => {
    expect(pulsePhase(2000, 2000)).toBe(pulsePhase(0, 2000));
    expect(pulsePhase(5000, 2000)).toBeCloseTo(pulsePhase(1000, 2000));
  });
});

describe("pulsesBetween", () => {
  it("counts no pulse within one period", () => {
    expect(pulsesBetween(0, 1999, 2000)).toBe(0);
  });

  it("counts each period boundary crossed", () => {
    expect(pulsesBetween(0, 2000, 2000)).toBe(1);
    expect(pulsesBetween(1999, 6001, 2000)).toBe(3);
  });

  it("counts nothing when position goes backwards on a seek", () => {
    expect(pulsesBetween(6000, 1000, 2000)).toBe(0);
  });
});

describe("fingerprint", () => {
  it("puts the centre of an evenly lit frame at the middle", () => {
    const frame = new Float32Array(16).fill(1);
    const { centre, density } = fingerprint(frame);
    expect(centre[0]).toBeCloseTo(1.5);
    expect(centre[1]).toBeCloseTo(1.5);
    expect(density).toBeCloseTo(1);
  });

  it("pulls the centre toward the lit corner", () => {
    const frame = new Float32Array(16);
    frame[0] = 1;
    const { centre } = fingerprint(frame);
    expect(centre).toEqual([0, 0]);
  });

  it("reports zero density for a dark frame without dividing by zero", () => {
    expect(fingerprint(new Float32Array(16)).density).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm test lib/glyph/pulse.test.ts`
Expected: FAIL — cannot resolve `./pulse`.

- [ ] **Step 3: Implement `lib/glyph/pulse.ts`**

`pulsePhase` is `(progressMs % periodMs) / periodMs`. `pulsesBetween` is `floor(now/period) - floor(prev/period)`, clamped at 0 so a backward seek emits nothing. `fingerprint` is the intensity-weighted centroid of the frame plus mean value, guarding the dark-frame divide.

The file header must state plainly that this is playback-position arithmetic and not beat detection, and that `audio-features` / `audio-analysis` return 403 for this application.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm test lib/glyph/pulse.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 4a: Write the failing tone test**

Create `lib/glyph/tone.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { autoLevel, inkRadius } from "./tone";

describe("autoLevel", () => {
  it("stretches a compressed range to fill 0..1", () => {
    const out = autoLevel(Float32Array.from([0.4, 0.5, 0.6]));
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(0.5);
    expect(out[2]).toBeCloseTo(1);
  });

  it("leaves an already-full range alone", () => {
    const out = autoLevel(Float32Array.from([0, 0.5, 1]));
    expect(Array.from(out)).toEqual([0, 0.5, 1]);
  });

  it("returns a flat frame unchanged rather than dividing by zero", () => {
    const out = autoLevel(Float32Array.from([0.3, 0.3, 0.3]));
    for (const v of out) expect(Number.isFinite(v)).toBe(true);
    expect(Array.from(out)).toEqual([0.3, 0.3, 0.3]);
  });

  it("preserves ordering", () => {
    const out = autoLevel(Float32Array.from([0.9, 0.1, 0.5]));
    expect(out[0]).toBeGreaterThan(out[2]);
    expect(out[2]).toBeGreaterThan(out[1]);
  });
});

describe("inkRadius", () => {
  it("draws nothing at zero, so artwork keeps real blacks", () => {
    expect(inkRadius(0, 10)).toBe(0);
  });

  it("makes dot AREA linear in value, not radius", () => {
    const cell = 10;
    const area = (v: number) => Math.PI * inkRadius(v, cell) ** 2;
    // Twice the luminance must lay down twice the ink.
    expect(area(0.5) / area(0.25)).toBeCloseTo(2, 1);
    expect(area(1) / area(0.5)).toBeCloseTo(2, 1);
  });

  it("never exceeds the cell it lives in", () => {
    expect(inkRadius(1, 10)).toBeLessThanOrEqual(5);
  });

  it("is monotonic", () => {
    expect(inkRadius(0.7, 10)).toBeGreaterThan(inkRadius(0.3, 10));
  });
});
```

- [ ] **Step 4b: Run it and confirm it fails**

Run: `pnpm test lib/glyph/tone.test.ts`
Expected: FAIL — cannot resolve `./tone`.

- [ ] **Step 4c: Implement `lib/glyph/tone.ts`**

`autoLevel` finds min and max across the frame and rescales; when `max - min` is below an
epsilon it returns the input untouched. `inkRadius` is `Math.sqrt(value) * cell * 0.5`, so
area is linear in value — a comment must state that this is deliberate and that the
previous `radius ∝ value` mapping crushed midtones.

- [ ] **Step 4d: Run the test and confirm it passes**

Run: `pnpm test lib/glyph/tone.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 4e: Apply the tone chain to artwork**

In `components/glyph-cell.tsx`, artwork frames pass through `autoLevel` and draw with
`inkRadius` and no alpha floor — a zero cell draws nothing. The Spotify mark keeps its
existing floor, where it is doing legitimate work.

Raise the artwork grid to **48** and, in `app/api/now-playing/route.ts:64`, select the
smallest Spotify image at least 4× the grid (300px) rather than the smallest available.
Replace the comment at `:62-63`, which asserts the opposite and would otherwise become a
lie: the grid can now use the resolution.

- [ ] **Step 4f: Verify the artwork reads**

Play three covers of different character — one dark, one low-contrast, one high-key — and
confirm each is recognisable as an image rather than a texture, in both skins. Commit only
when a stranger could identify the cover.

- [ ] **Step 5: Wire the pulse into the card**

While a track is playing, the card advances a local playback estimate from the last `progressMs` and the elapsed wall clock, calls `pulsesBetween(prev, next, TUNING.PULSE_PERIOD_MS)`, and for each pulse pushes a `Ripple` at the artwork's `fingerprint` centre, scaled by `density`. The card stops emitting the moment `isPlaying` is false, satisfying "only while that state is live". Under `prefers-reduced-motion` no ripple is emitted at all.

- [ ] **Step 6: Add the progress arc**

Draw a hairline arc around the cell at `progressMs / durationMs`, in `currentColor` at the `--text-3` value. It is a static stroke redrawn per frame, not an animation.

- [ ] **Step 7: Verify**

Run `pnpm build && pnpm lint && pnpm test`. With music playing, confirm a ring emits every 2s from a position that changes with the artwork, that the arc tracks real progress, that pausing stops all motion within one period, and that `prefers-reduced-motion` leaves the card still with the artwork and arc correct.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Spotify face: playhead pulse driven by real playback position"
```

---

### Task 4: The pedometer faces

**Files:**
- Create: `lib/glyph/steps-frames.ts`, `lib/glyph/steps-frames.test.ts`, `components/glyph-bay.tsx`
- Modify: `app/page.tsx` (the bay replaces the lone cell)

**Interfaces:**
- Consumes: Task 1 — `emptyFrame`, `stampText`, `textWidth`. Task 2 — `StepsReading`, `StepsDay`.
  Note: `GlyphCell` does **not** yet have paging props — Task 1 deliberately deferred them to
  this task, which is their first real caller. Add them here.
  Note: `StepsDay.steps` and `StepsReading.today` are `number | null`. A `null` day must render
  as **placeholder dots**, never as `0` — an unreported day and a walked-zero are different
  facts, and the spec's rule is that a counter never read is not a counter at zero. `weekMarks`
  must therefore accept null days; the test helper below passes plain numbers, so add a null
  case of your own.
- Produces:
  ```ts
  export type CellMark = { value: number; hollow: boolean };
  export function walkFrame(grid: number, progress: number): Float32Array;
  export function numberFrame(grid: number, value: number): Float32Array;
  export function weekMarks(days: StepsDay[], goal: number): CellMark[][]; // 7 columns
  export function groupDigits(value: number): string;                      // 5391 -> "5,391"
  ```

- [ ] **Step 1: Write the failing test**

Create `lib/glyph/steps-frames.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { groupDigits, numberFrame, walkFrame, weekMarks } from "./steps-frames";

const GRID = 25;

describe("groupDigits", () => {
  it("groups thousands with a comma", () => {
    expect(groupDigits(5391)).toBe("5,391");
    expect(groupDigits(987)).toBe("987");
    expect(groupDigits(0)).toBe("0");
    expect(groupDigits(1234567)).toBe("1,234,567");
  });
});

describe("numberFrame", () => {
  it("lights cells for a value", () => {
    const frame = numberFrame(GRID, 5391);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("centres the number horizontally", () => {
    const frame = numberFrame(GRID, 8);
    const lit: number[] = [];
    for (let i = 0; i < frame.length; i++) if (frame[i] > 0) lit.push(i % GRID);
    const left = Math.min(...lit);
    const right = Math.max(...lit);
    expect(Math.abs(left - (GRID - 1 - right))).toBeLessThanOrEqual(1);
  });
});

describe("walkFrame", () => {
  it("puts the walker at the left edge at zero progress", () => {
    const frame = walkFrame(GRID, 0);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("moves the walker rightward as progress grows", () => {
    const centroid = (progress: number) => {
      const frame = walkFrame(GRID, progress);
      let sum = 0;
      let weight = 0;
      for (let i = 0; i < frame.length; i++) {
        sum += (i % GRID) * frame[i];
        weight += frame[i];
      }
      return sum / weight;
    };
    expect(centroid(1)).toBeGreaterThan(centroid(0.5));
    expect(centroid(0.5)).toBeGreaterThan(centroid(0));
  });

  it("clamps beyond the goal rather than walking off the grid", () => {
    const frame = walkFrame(GRID, 3);
    for (let i = 0; i < frame.length; i++) expect(frame[i]).toBeLessThanOrEqual(1);
    expect(frame.some((v) => v > 0)).toBe(true);
  });
});

describe("weekMarks", () => {
  const week = (steps: number[]) =>
    steps.map((s, i) => ({ date: `2026-08-1${i}`, steps: s }));

  it("returns one column per day given", () => {
    expect(weekMarks(week([1, 2, 3, 4, 5, 6, 7]), 10)).toHaveLength(7);
  });

  it("marks a day under goal as hollow and a day at goal as filled", () => {
    const [under, met] = weekMarks(week([4000, 10000]), 10000);
    expect(under.some((m) => m.hollow)).toBe(true);
    expect(met.every((m) => !m.hollow)).toBe(true);
  });

  it("gives a bigger day more lit cells than a smaller one", () => {
    const [small, big] = weekMarks(week([2000, 9000]), 10000);
    const lit = (col: { value: number }[]) => col.filter((m) => m.value > 0).length;
    expect(lit(big)).toBeGreaterThan(lit(small));
  });

  it("handles a zero day without producing NaN", () => {
    const [zero] = weekMarks(week([0]), 10000);
    for (const mark of zero) expect(Number.isFinite(mark.value)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm test lib/glyph/steps-frames.test.ts`
Expected: FAIL — cannot resolve `./steps-frames`.

- [ ] **Step 3: Implement `lib/glyph/steps-frames.ts`**

`groupDigits` uses `Intl.NumberFormat("en-US")`. `numberFrame` measures with `textWidth` and stamps centred. `walkFrame` draws the path row, sizes path cells either side of the walker (behind: value 1; ahead: value 0.35), and stamps a 5×7 figure sprite — defined as a bitmap constant in this file — at `clamp(progress, 0, 1)` across the usable width. `weekMarks` maps each day to a column of marks, `value` scaled by `steps / goal` and `hollow` true when the day is under goal.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm test lib/glyph/steps-frames.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Build the bay**

Create `components/glyph-bay.tsx` — the Spotify card and the pedometer card side by side, stacking on mobile. The pedometer card holds three pages: the walk, the record (`numberFrame` on canvas with `TOTAL TODAY` / percentage and `7-DAY AVERAGE` / percentage as DOM text in Suisse), and the week (`weekMarks` on canvas, `M T W T F S S` as DOM text). A vertical three-dot page indicator sits on the right edge. Hollow marks draw as a stroked circle, filled marks as a filled one.

Paging: horizontal swipe on touch with a ~40px threshold, click to advance, `ArrowLeft` / `ArrowRight` when focused. `aria-label` names the current page and its value, and every value is also present as visually-hidden text so a screen reader never depends on the canvas.

Poll `/api/steps` on the same 30s cadence as `now-playing` (`halftone-disc.tsx:324`). Render placeholder dots when the reading is null.

- [ ] **Step 6: Place the bay and verify**

Replace the lone cell at `app/page.tsx:118-120` with `<GlyphBay />`. Run `pnpm build && pnpm lint && pnpm test`. Confirm: three pages reachable by swipe, click, and keyboard; the indicator tracks; hollow rings appear for under-goal days; the cards stack and stay legible at 375px; no store configured degrades to placeholder dots rather than an error.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Pedometer face: the walk, the record, the week"
```

---

### Task 5: The entrance

**Files:**
- Create: `lib/glyph/entrance.ts`, `lib/glyph/entrance.test.ts`
- Modify: `components/glyph-cell.tsx`, `README.md` (Law 4), `docs/specs/2026-08-13-design-language.md` (Law 4)

**Interfaces:**
- Consumes: Task 1 — `emptyFrame`.
- Produces: `export function sweepMask(grid: number, t: number): Float32Array;` where `t` is 0..1.

- [ ] **Step 1: Write the failing test**

Create `lib/glyph/entrance.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sweepMask } from "./entrance";

const GRID = 9;

describe("sweepMask", () => {
  it("is fully dark at t=0", () => {
    const mask = sweepMask(GRID, 0);
    for (const v of mask) expect(v).toBe(0);
  });

  it("is fully lit at t=1", () => {
    const mask = sweepMask(GRID, 1);
    for (const v of mask) expect(v).toBe(1);
  });

  it("lights the centre before the corners", () => {
    const mask = sweepMask(GRID, 0.3);
    const centre = mask[Math.floor(GRID / 2) * GRID + Math.floor(GRID / 2)];
    expect(centre).toBeGreaterThan(mask[0]);
  });

  it("never decreases as t advances", () => {
    const early = sweepMask(GRID, 0.4);
    const later = sweepMask(GRID, 0.6);
    for (let i = 0; i < early.length; i++) {
      expect(later[i]).toBeGreaterThanOrEqual(early[i]);
    }
  });

  it("clamps t outside 0..1", () => {
    expect(Array.from(sweepMask(GRID, -1))).toEqual(Array.from(sweepMask(GRID, 0)));
    expect(Array.from(sweepMask(GRID, 2))).toEqual(Array.from(sweepMask(GRID, 1)));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm test lib/glyph/entrance.test.ts`
Expected: FAIL — cannot resolve `./entrance`.

- [ ] **Step 3: Implement `lib/glyph/entrance.ts`**

A radial wavefront: each cell's lit value is a smoothstep of `t` against its normalised distance from centre, monotonic in `t`, clamped at both ends.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm test lib/glyph/entrance.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Wire the sweep**

`GlyphCell` multiplies its frame by `sweepMask` for 600ms on first mount, gated on a `sessionStorage` key so it plays once per session. Skipped entirely under `prefers-reduced-motion`. The sweep resolves into whatever the real frame is — it never loops and never repeats.

- [ ] **Step 6: Amend Law 4 in both documents**

In `README.md`, Law 4 becomes **"Nothing moves unless touched, arriving, or reporting."** Add the reporting clause paragraph beneath the existing arriving-clause paragraph, stating: only an instrument displaying live external state, only while that state is live, only within its own bounds. Keep the existing forbidden list intact and append that a page at rest with nothing playing holds no running animation. Make the identical amendment in `docs/specs/2026-08-13-design-language.md`.

- [ ] **Step 7: Verify**

Run `pnpm build && pnpm lint && pnpm test`. Hard-reload and confirm the sweep plays once and not on client navigation back to the home; confirm it is absent under `prefers-reduced-motion` and that values are correct immediately.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Entrance sweep, and Law 4 gains its reporting clause"
```

---

### Task 6: The colophon forge

**Files:**
- Create: `components/glyph-forge.tsx`, `data/glyph.ts`
- Modify: `app/colophon/page.tsx` (replace the field section, add Provenance), `components/glyph-bay.tsx` (hidden fourth page), `lib/counters.ts` (add `GLYPHS_DRAWN_KEY`)
- Delete: `components/value-field.tsx`, `lib/value-field.tsx`

**Interfaces:**
- Consumes: Task 1 — `GlyphCell`, `emptyFrame`. Task 4 — the pedometer card's paging. `lib/counters.ts` — `readCount`, `bumpCount`.
- Produces: `data/glyph.ts` exporting `export const authoredGlyph: number[]` (625 entries, 25×25).

- [ ] **Step 1: Remove the value field**

Delete `components/value-field.tsx` and `lib/value-field.tsx`, and remove the "The field" section from `app/colophon/page.tsx:98-108`. Run `pnpm build` and confirm no other module imported them.

- [ ] **Step 2: Build the forge**

Create `components/glyph-forge.tsx` — a 25×25 grid the visitor draws on by pointer drag (and by keyboard: arrows move a caret, space toggles). Live rendering through `GlyphCell`. A scrub control previews the drawing through `sweepMask`. Clear and Reset controls, per the existing rule that persistent mutation without an undo is hostile.

Persist to `localStorage` under `glyph-forge`. On first successful save, `bumpCount(GLYPHS_DRAWN_KEY)` once per browser (guarded by a second `localStorage` flag so redrawing does not inflate the count), and display the shared total as the existing `Counters` component does.

- [ ] **Step 3: Place it on the colophon**

Add the forge in the vacated slot with a `Section` label of "The forge" and a note explaining that the drawing is kept on the visitor's own device and appears as a hidden page on the home.

Add a `Provenance` section stating: the dot-matrix language is an original web implementation and a homage to Nothing's interface; no Nothing code, assets, or trademarks are used; and Spotify's `audio-features` and `audio-analysis` endpoints return 403 for this application, so the motion is driven by playback position and is not beat detection.

- [ ] **Step 4: Add the hidden page**

Create `data/glyph.ts` with an authored 25×25 glyph. In `components/glyph-bay.tsx`, the pedometer card gains a fourth page carrying `authoredGlyph`, or the visitor's stored drawing when one exists. The page indicator still renders three dots. The page is reachable by continuing past the week view via swipe, click, and `ArrowRight`, and carries an honest `aria-label`.

- [ ] **Step 5: Verify**

Run `pnpm build && pnpm lint && pnpm test`. Confirm: drawing persists across reload; Clear and Reset work; the counter increments once per browser rather than per save; the fourth page shows the authored glyph in a fresh browser and the visitor's drawing after they draw; the indicator never shows a fourth dot; the colophon has no dead imports.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Colophon forge replaces the value field; the hidden page"
```

---

### Task 7: Ship

**Files:**
- Modify: `data/changelog.ts`, `README.md`

- [ ] **Step 1: Write the changelog entry**

Prepend a `v1.3.0` entry to `data/changelog.ts` titled "The glyph matrix", with notes covering: the engine and the disc's retirement, the playhead pulse and why it is not beat detection, the three pedometer pages, the hollow ring standing in for the reference's red, the phone-push step path, the entrance sweep, Law 4's reporting clause, and the forge replacing the value field.

- [ ] **Step 2: Update the README**

Add the glyph matrix to the surfaces description and note the steps setup guide at `docs/steps-setup.md`. Confirm Law 4 reads as amended in Task 5.

- [ ] **Step 3: Full verification**

```bash
pnpm lint && pnpm test && pnpm build
```
Expected: all clean.

- [ ] **Step 4: Deploy**

```bash
./scripts/deploy.sh
```
Record the printed workshop deployment URL in the `v1.3.0` changelog entry.

- [ ] **Step 5: Commit, tag, push**

```bash
git add -A
git commit -m "v1.3.0: the glyph matrix"
git tag v1.3.0
git push origin glyph-matrix --tags
```

- [ ] **Step 6: Confirm the live site**

Load `https://damilareoo-xyz.vercel.app` and verify the bay renders, the entrance plays once, and the pedometer card degrades to placeholder dots until the phone automation from `docs/steps-setup.md` is configured.
