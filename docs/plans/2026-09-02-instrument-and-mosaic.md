# The Instrument, the Product, and the Mosaic — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retune both skins and name a type scale, replace the era spine with four numbered products, put live time and weather instruments in a one-row hero echoed by the footer, and rebuild `/shots` as a formless mosaic.

**Architecture:** Foundations first (colour tokens and type scale, each guarded by a test that reads the CSS itself), then pure modules for the new readings (WMO mapping, weather frames, clock geometry), then the components that render them, then the page compositions, then the feed. Every piece of arithmetic lives in a pure, tested `lib/` module; components compose.

**Tech Stack:** Next 16.3 (App Router, RSC), React 19, TypeScript, Tailwind v4, Vitest (node + jsdom), pnpm. Weather from Open-Meteo (no key).

**Spec:** `docs/specs/2026-09-02-instrument-and-mosaic-design.md`

## Global Constraints

- **Pure monochrome. No hue.** `--miss` is the single exception and keeps its single meaning — a day the step goal was missed. The instrument reference image's red dot ships in `--text-1`.
- **Law 4 — nothing moves unless touched, arriving, or reporting live external state.** The clock and weather faces report; they move only while the reading is live. No marquee, autoplay, parallax, or scroll-linked transform.
- **Every font size comes from the scale.** No component may write `text-[0.8125rem]` or any other literal size after Task 2.
- **Sizes in `rem`**, or the DialKit's type dial cannot reach them. Spacing and radii read `--pg-gap`, `--pad`, `--radius-tile`, `--radius-window`.
- **Anything meant to be overridable by a Tailwind utility must sit inside `@layer utilities`**, or unlayered author styles beat it regardless of specificity.
- **Build from the shared primitives** in `components/ui.tsx` (`RecordRow`, `SectionLabel`, `Sheet`, `Chip`, `Tags`, `Meta`).
- **An icon accompanies a word, never replaces one.**
- **An instrument that cannot read admits it** — never a guess, never a blank face.
- **Anything backed by `localStorage` is read through `useSyncExternalStore`**; the client-only check is `useMounted` in `lib/use-mounted.ts`. No mounted-flag effects.
- **This repo's Next has breaking changes versus what you may expect.** Read the relevant guide under `node_modules/next/dist/docs/` before writing Next-API-shaped code, and heed deprecation notices. `next/image` uses `preload`, not `priority`.
- **Responsive is a requirement, not a polish pass.** Every surface must be usable at any width from
  320px to ultrawide, and at any height, on touch and on pointer. Two things follow. **Mobile is its
  own layout, never a squished desktop** — a narrow viewport gets a layout designed for it (compact,
  content first), not the wide one scaled down. And **no page may ever scroll horizontally**: wide
  content (a mosaic band, a case frame, a code block) scrolls inside its own container, never the
  body.
- **Responsive type steps by breakpoint, never by viewport units.** A step may be swapped at a
  breakpoint (`text-lg lg:text-xl`), but a font size must never be written as `vw`, `clamp()` with a
  viewport term, or anything else outside the rem scale — the site's type dial multiplies the root
  font size, and a viewport-derived size is out of its reach.
- Touch targets are at least 44px in their smallest dimension. A control that is only reachable by
  hover has a non-hover path.
- Every task ends green on `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`.

## File structure

| File | Responsibility |
| --- | --- |
| `lib/contrast.ts` + test | Pure WCAG relative luminance and contrast ratio; the test reads `app/globals.css` and holds both skins to a legibility floor. |
| `app/globals.css` | Retuned neutral ramps; the seven named type tokens. |
| `lib/weather.ts` + test | WMO code → condition, and the Open-Meteo request URL. Pure. |
| `lib/glyph/weather-frames.ts` + test | One dot frame per condition, plus unreported. Pure. |
| `lib/clock.ts` + test | Hand angles for a timezone at an instant. Pure. |
| `lib/use-weather.ts` | The fetch, its cadence, and its failure state. Client. |
| `components/clock-face.tsx` | The analogue disc. |
| `components/weather-face.tsx` | The dot disc. |
| `components/instrument-pair.tsx` | The two faces side by side — used by both hero and footer, so they cannot drift. |
| `lib/case-blocks.ts` (was `lib/eras.ts`) | `splitBlocks`, `blockAssetCost`, `LEDE_BLOCKS`. `Era` and `orderEras` retire. |
| `components/product-section.tsx` (was `era-section.tsx`) | One numbered product. |
| `components/product-entry.tsx` (was `era-entry.tsx`) | Its lede, its full-width unfold bar, its tail. |
| `lib/mosaic.ts` + test (replaces `lib/shots-layout.ts`) | Band composition for the feed. Pure. |
| `components/shots-field.tsx` | Renders the mosaic. |

---

### Task 1: The skins, held to a legibility floor

**Files:**
- Create: `lib/contrast.ts`, `lib/contrast.test.ts`
- Modify: `app/globals.css:20-46` (the `:root` and `.dark` token blocks)

**Interfaces:**
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number`, `readSkins(css: string): { light: Record<string,string>; dark: Record<string,string> }` from `@/lib/contrast`.

The point of this task is that the new values are *checked*, not asserted in a docblock. `--text-3` carries every mono label, year and caption on the site at 0.625rem, and today measures about 2.0:1 on light and 2.4:1 on dark — both fail WCAG AA at any size. The test is what stops the next retune quietly breaking it again.

- [ ] **Step 1: Write the failing test**

```ts
// lib/contrast.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, readSkins, relativeLuminance } from "./contrast";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
const skins = readSkins(css);

describe("contrastRatio", () => {
  it("puts black on white at the top of the scale", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("puts a colour against itself at the bottom", () => {
    expect(contrastRatio("#7d7d7d", "#7d7d7d")).toBeCloseTo(1, 5);
  });

  it("is symmetric — the order of the pair cannot matter", () => {
    expect(contrastRatio("#111111", "#f2f2f2")).toBeCloseTo(
      contrastRatio("#f2f2f2", "#111111"),
      5,
    );
  });

  it("reads luminance down the ramp, not up it", () => {
    expect(relativeLuminance("#ffffff")).toBeGreaterThan(relativeLuminance("#7d7d7d"));
    expect(relativeLuminance("#7d7d7d")).toBeGreaterThan(relativeLuminance("#000000"));
  });
});

describe("readSkins", () => {
  it("finds both skins and their tokens", () => {
    for (const skin of [skins.light, skins.dark]) {
      for (const token of ["--bg", "--surface", "--surface-2", "--border", "--text-1", "--text-2", "--text-3"]) {
        expect(skin[token], token).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});

describe("the two skins", () => {
  const both = [
    ["light", skins.light],
    ["dark", skins.dark],
  ] as const;

  it("keeps tertiary text legible, which is the whole point of this floor", () => {
    // --text-3 carries every label, year and caption at 0.625rem. Below 3:1 it
    // is decoration that happens to contain words.
    for (const [name, skin] of both) {
      expect(contrastRatio(skin["--text-3"], skin["--bg"]), name).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps secondary text at AA for body copy", () => {
    for (const [name, skin] of both) {
      expect(contrastRatio(skin["--text-2"], skin["--bg"]), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the three ink steps genuinely distinct", () => {
    for (const [name, skin] of both) {
      const one = contrastRatio(skin["--text-1"], skin["--bg"]);
      const two = contrastRatio(skin["--text-2"], skin["--bg"]);
      const three = contrastRatio(skin["--text-3"], skin["--bg"]);
      expect(one, name).toBeGreaterThan(two);
      expect(two, name).toBeGreaterThan(three);
    }
  });

  it("separates the raised surface from the ground on BOTH skins", () => {
    // The defect this guards: --surface-2 sat three points off --bg on light and
    // ten on dark, so a tinted case plate was obvious in the dark and invisible
    // in the light. Neither skin may be more than twice the other's separation.
    const gaps = both.map(
      ([, skin]) =>
        Math.abs(relativeLuminance(skin["--surface-2"]) - relativeLuminance(skin["--bg"])),
    );
    for (const gap of gaps) expect(gap).toBeGreaterThan(0.008);
    const [light, dark] = gaps;
    expect(Math.max(light, dark) / Math.min(light, dark)).toBeLessThanOrEqual(2);
  });

  it("draws a hairline that is actually a line", () => {
    for (const [name, skin] of both) {
      const gap = Math.abs(
        relativeLuminance(skin["--border"]) - relativeLuminance(skin["--bg"]),
      );
      expect(gap, name).toBeGreaterThan(0.01);
    }
  });

  it("admits exactly one hue, and it is --miss", () => {
    // Pure monochrome is the law. A neutral has equal channels; --miss is the
    // one documented exception and is not asserted here.
    for (const [name, skin] of both) {
      for (const [token, value] of Object.entries(skin)) {
        if (token === "--miss") continue;
        const [r, g, b] = [1, 3, 5].map((i) => value.slice(i, i + 2).toLowerCase());
        expect(`${name}${token}:${r}${g}${b}`).toBe(`${name}${token}:${r}${r}${r}`);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/contrast.test.ts`
Expected: FAIL — `Failed to resolve import "./contrast"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/contrast.ts

/**
 * WCAG contrast, computed rather than eyeballed.
 *
 * The site's tertiary ink carries every label, year and caption it has, at
 * 0.625rem. Whether that is legible is a measurement, not a matter of taste,
 * and a retune that breaks it should fail a test rather than ship and be
 * noticed by somebody squinting.
 */

function channels(hex: string): [number, number, number] {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** sRGB companding, per WCAG 2.1 relative luminance. */
function toLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const one = relativeLuminance(a);
  const two = relativeLuminance(b);
  const [hi, lo] = one > two ? [one, two] : [two, one];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The token values as authored, read out of the stylesheet itself.
 *
 * Read rather than duplicated: a copy of the palette in a test file is a second
 * source of truth that goes stale the first time somebody edits the CSS.
 */
export function readSkins(css: string): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const block = (selector: string) => {
    const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
    if (!match) throw new Error(`no ${selector} block in the stylesheet`);
    const tokens: Record<string, string> = {};
    for (const [, name, value] of match[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
      tokens[name] = value;
    }
    return tokens;
  };
  return { light: block(":root"), dark: block("\\.dark") };
}
```

- [ ] **Step 4: Run the test — it should now fail on the VALUES, not the import**

Run: `pnpm exec vitest run lib/contrast.test.ts`
Expected: FAIL on the tertiary-text and surface-separation cases, because `app/globals.css` still holds the old palette. This is the proof the test bites.

- [ ] **Step 5: Retune the palette**

In `app/globals.css`, replace the colour tokens in `:root` (leaving `--miss` and `--on-strong` as they are):

```css
  --bg: #f2f2f2;
  --surface: #ffffff;
  --surface-2: #fbfbfb;
  --border: #dedede;
  --text-1: #0f0f0f;
  --text-2: #5c5c5c;
  --text-3: #7d7d7d;
  --fill-strong: #0f0f0f;
```

and in `.dark`:

```css
  --bg: #0a0a0a;
  --surface: #161616;
  --surface-2: #1f1f1f;
  --border: #2e2e2e;
  --text-1: #f5f5f5;
  --text-2: #9a9a9a;
  --text-3: #6b6b6b;
  --fill-strong: #f5f5f5;
```

- [ ] **Step 6: Run everything**

Run: `pnpm exec vitest run lib/contrast.test.ts && pnpm test && pnpm exec tsc --noEmit && pnpm lint`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/contrast.ts lib/contrast.test.ts app/globals.css
git commit -m "The skins, retuned against a floor the test holds"
```

---

### Task 2: The type scale

**Files:**
- Modify: `app/globals.css` (`:root` and the `@theme inline` block)
- Modify: every component listed in the guard test below
- Create: `lib/type-scale.test.ts`

**Interfaces:**
- Produces: Tailwind classes `text-2xs` `text-xs` `text-sm` `text-base` `text-lg` `text-xl`, backed by CSS custom properties.

Nine ad-hoc literals chosen per component are why a project title at `1rem` sits beside its one-liner at `0.875rem` and reads as no louder. Seven named steps replace them, and a test stops the tenth being invented.

- [ ] **Step 1: Write the failing guard test**

```ts
// lib/type-scale.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8");

/** The surfaces this scale governs. /about and /colophon are out of scope. */
const GOVERNED = [
  "app/page.tsx",
  "app/shots/page.tsx",
  "components/ui.tsx",
  "components/case-reel.tsx",
  "components/frame.tsx",
  "components/site-nav.tsx",
  "components/site-footer.tsx",
];

describe("the type scale", () => {
  it("declares every step, in rem so the type dial reaches them", () => {
    for (const step of ["2xs", "xs", "sm", "base", "lg", "xl"]) {
      expect(css).toMatch(new RegExp(`--text-${step}:\\s*[\\d.]+rem`));
    }
  });

  it("exposes the steps to Tailwind", () => {
    for (const step of ["2xs", "xs", "sm", "base", "lg", "xl"]) {
      expect(css).toContain(`--text-${step}: var(--text-${step})`);
    }
  });

  it("leaves no arbitrary font size in the surfaces it governs", () => {
    // The defect: nine sizes chosen per component, so nothing could be louder
    // than anything else on purpose.
    const offenders: string[] = [];
    for (const file of GOVERNED) {
      const source = readFileSync(resolve(root, file), "utf8");
      for (const [match] of source.matchAll(/text-\[[\d.]+rem\]/g)) {
        offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/type-scale.test.ts`
Expected: FAIL on all three cases — no tokens exist and every governed file is full of literals.

- [ ] **Step 3: Declare the scale**

In `app/globals.css`, inside `:root`, after the DialKit block:

```css
  /* The type scale. Seven steps, every one of them used — a reserved eighth for
     work that might arrive is furniture, which is what the tier vocabulary was.
     In rem, or --type-scale cannot reach them. */
  --text-2xs: 0.5625rem;
  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 0.9375rem;
  --text-lg: 1.25rem;
  --text-xl: 1.875rem;
```

and inside `@theme inline`:

```css
  --text-2xs: var(--text-2xs);
  --text-xs: var(--text-xs);
  --text-sm: var(--text-sm);
  --text-base: var(--text-base);
  --text-lg: var(--text-lg);
  --text-xl: var(--text-xl);
```

- [ ] **Step 4: Migrate the governed files**

Replace every arbitrary size with its nearest step, using this mapping — it is exhaustive for the sizes currently in the repo:

| Was | Becomes |
| --- | --- |
| `text-[0.5625rem]` | `text-2xs` |
| `text-[0.625rem]` | `text-xs` |
| `text-[0.6875rem]` | `text-xs` |
| `text-[0.75rem]` | `text-sm` |
| `text-[0.8125rem]` | `text-sm` |
| `text-[0.875rem]` | `text-base` |
| `text-[0.9375rem]` | `text-base` |
| `text-[1rem]` | `text-base` |
| `text-[1.125rem]` | `text-lg` |
| `text-[1.25rem]` | `text-lg` |
| `text-[1.5rem]` | `text-xl` |

Run `grep -rn 'text-\[[0-9.]*rem\]' app components` to find them all; the governed list in the test is what must come back empty.

- [ ] **Step 5: Run everything**

Run: `pnpm exec vitest run lib/type-scale.test.ts && pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all PASS. Existing component tests assert on class strings — `components/ui.test.tsx` checks `grid-cols-[72px_minmax(0,1fr)]`, not sizes, so it should be unaffected. If any test asserts a literal size, update the assertion to the new class rather than reverting the migration.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css lib/type-scale.test.ts app components
git commit -m "A type scale, and a test that stops a tenth size being invented"
```

---

### Task 3: What the weather says

**Files:**
- Create: `lib/weather.ts`, `lib/weather.test.ts`
- Modify: `data/site.ts` (add explicit coordinates)

**Interfaces:**
- Produces: `CONDITIONS`, `type Condition`, `conditionFor(code: number): Condition | null`, `forecastUrl(latitude: number, longitude: number): string`, `type Reading = { temperature: number; condition: Condition }`, `readForecast(payload: unknown): Reading | null` from `@/lib/weather`; `site.latitude` and `site.longitude` from `@/data/site`.

`site.coordinates` is a display string (`"6.5244° N, 3.3792° E"`). Parsing it back into numbers would make a label load-bearing, so the numbers are authored beside it.

- [ ] **Step 1: Write the failing test**

```ts
// lib/weather.test.ts
import { describe, expect, it } from "vitest";
import { CONDITIONS, conditionFor, forecastUrl, readForecast } from "./weather";

describe("conditionFor", () => {
  it("maps the codes Lagos actually produces", () => {
    expect(conditionFor(0)).toBe("clear");
    expect(conditionFor(1)).toBe("partly");
    expect(conditionFor(2)).toBe("partly");
    expect(conditionFor(3)).toBe("cloudy");
    expect(conditionFor(45)).toBe("haze");
    expect(conditionFor(61)).toBe("rain");
    expect(conditionFor(81)).toBe("rain");
    expect(conditionFor(95)).toBe("storm");
  });

  it("returns only conditions the matrix can draw", () => {
    for (let code = 0; code <= 99; code++) {
      const condition = conditionFor(code);
      if (condition !== null) expect(CONDITIONS, String(code)).toContain(condition);
    }
  });

  it("refuses a code it cannot draw rather than guessing a near one", () => {
    // Snow. Lagos has never recorded it, and the honest answer to a reading we
    // have no glyph for is that we have no reading — not the nearest shape.
    expect(conditionFor(73)).toBeNull();
    expect(conditionFor(-1)).toBeNull();
    expect(conditionFor(999)).toBeNull();
  });
});

describe("forecastUrl", () => {
  it("asks Open-Meteo for exactly the two values the faces render", () => {
    const url = new URL(forecastUrl(6.5244, 3.3792));
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("current")).toBe("temperature_2m,weather_code");
    expect(url.searchParams.get("latitude")).toBe("6.5244");
    expect(url.searchParams.get("longitude")).toBe("3.3792");
  });
});

describe("readForecast", () => {
  it("reads a well-formed current block", () => {
    expect(
      readForecast({ current: { temperature_2m: 29.4, weather_code: 2 } }),
    ).toEqual({ temperature: 29.4, condition: "partly" });
  });

  it("returns null for anything it cannot trust", () => {
    // An instrument that invents a reading is worse than one that admits it has
    // none, so every one of these renders the unreported face.
    expect(readForecast(null)).toBeNull();
    expect(readForecast({})).toBeNull();
    expect(readForecast({ current: {} })).toBeNull();
    expect(readForecast({ current: { temperature_2m: "warm", weather_code: 2 } })).toBeNull();
    expect(readForecast({ current: { temperature_2m: 29, weather_code: 73 } })).toBeNull();
    expect(readForecast("service unavailable")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/weather.test.ts`
Expected: FAIL — `Failed to resolve import "./weather"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/weather.ts

/**
 * Lagos weather, reduced to the six shapes the dot matrix can actually draw.
 *
 * WMO 4677 has around forty codes. A 25-cell disc can tell six of them apart,
 * and pretending otherwise would mean drawing "light drizzle" and "moderate
 * drizzle" as the same picture while claiming they are different readings.
 */
export const CONDITIONS = ["clear", "partly", "cloudy", "rain", "storm", "haze"] as const;

export type Condition = (typeof CONDITIONS)[number];

export function conditionFor(code: number): Condition | null {
  if (!Number.isInteger(code)) return null;
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "haze";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95 && code <= 99) return "storm";
  /* Snow (71–77) and everything unrecognised fall through. Lagos has never
     recorded snow, and the honest answer to a reading we have no glyph for is
     that we have no reading — not the nearest shape that happens to exist. */
  return null;
}

export function forecastUrl(latitude: number, longitude: number): string {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    timezone: "Africa/Lagos",
  });
  return `https://api.open-meteo.com/v1/forecast?${query}`;
}

export type Reading = { temperature: number; condition: Condition };

/**
 * Parsed defensively, because this is the one place the site trusts something
 * it did not author. Anything unexpected is no reading at all, which the face
 * already knows how to say.
 */
export function readForecast(payload: unknown): Reading | null {
  if (typeof payload !== "object" || payload === null) return null;
  const current = (payload as { current?: unknown }).current;
  if (typeof current !== "object" || current === null) return null;
  const { temperature_2m: temperature, weather_code: code } = current as {
    temperature_2m?: unknown;
    weather_code?: unknown;
  };
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) return null;
  if (typeof code !== "number") return null;
  const condition = conditionFor(code);
  return condition ? { temperature, condition } : null;
}
```

- [ ] **Step 4: Add the coordinates**

In `data/site.ts`, inside the `site` object beside `coordinates`:

```ts
  /* The same place the coordinates string names, as numbers. The string is a
     label; parsing it back would make a label load-bearing. */
  latitude: 6.5244,
  longitude: 3.3792,
```

- [ ] **Step 5: Run the tests**

Run: `pnpm exec vitest run lib/weather.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/weather.ts lib/weather.test.ts data/site.ts
git commit -m "Weather: six shapes, and the honesty to draw none"
```

---

### Task 4: The weather faces, in dots

**Files:**
- Create: `lib/glyph/weather-frames.ts`, `lib/glyph/weather-frames.test.ts`

**Interfaces:**
- Consumes: `emptyFrame(grid: number): Float32Array` from `@/lib/glyph/glyphs`; `type Condition` from `@/lib/weather`.
- Produces: `type WeatherFace = Condition | "unreported"`, `WEATHER_FACES: readonly WeatherFace[]`, `weatherFrame(face: WeatherFace, grid: number): Float32Array` from `@/lib/glyph/weather-frames`.

A frame is one value per grid position, row-major, 0 to 1 — the same contract `lib/glyph/glyphs.ts` documents. These are drawn with arithmetic rather than rasterised from a canvas, so they run on the server and in tests.

- [ ] **Step 1: Write the failing test**

```ts
// lib/glyph/weather-frames.test.ts
import { describe, expect, it } from "vitest";
import { WEATHER_FACES, weatherFrame } from "./weather-frames";

const GRID = 25;

describe("weatherFrame", () => {
  it("fills the grid it was asked for", () => {
    for (const face of WEATHER_FACES) {
      expect(weatherFrame(face, GRID).length, face).toBe(GRID * GRID);
    }
  });

  it("stays inside the frame contract of 0 to 1", () => {
    for (const face of WEATHER_FACES) {
      for (const value of weatherFrame(face, GRID)) {
        expect(value, face).toBeGreaterThanOrEqual(0);
        expect(value, face).toBeLessThanOrEqual(1);
      }
    }
  });

  it("draws something, and never everything", () => {
    for (const face of WEATHER_FACES) {
      const lit = [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
      expect(lit, face).toBeGreaterThan(GRID);
      expect(lit, face).toBeLessThan(GRID * GRID);
    }
  });

  it("tells every face apart from every other", () => {
    // Two readings that draw the same picture are one reading with two names.
    const seen = new Map<string, string>();
    for (const face of WEATHER_FACES) {
      const key = [...weatherFrame(face, GRID)].map((v) => (v > 0 ? 1 : 0)).join("");
      expect(seen.has(key), `${face} draws the same as ${seen.get(key)}`).toBe(false);
      seen.set(key, face);
    }
  });

  it("makes the unreported face the sparsest of them all", () => {
    // Not knowing should look like not knowing, not like weather.
    const count = (face: (typeof WEATHER_FACES)[number]) =>
      [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
    const unreported = count("unreported");
    for (const face of WEATHER_FACES) {
      if (face !== "unreported") expect(unreported).toBeLessThan(count(face));
    }
  });

  it("scales to any grid the disc is given", () => {
    for (const grid of [15, 21, 25, 31]) {
      expect(weatherFrame("rain", grid).length).toBe(grid * grid);
      expect([...weatherFrame("rain", grid)].some((v) => v > 0)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/glyph/weather-frames.test.ts`
Expected: FAIL — `Failed to resolve import "./weather-frames"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/glyph/weather-frames.ts
import { emptyFrame } from "@/lib/glyph/glyphs";
import type { Condition } from "@/lib/weather";

/**
 * The weather as the matrix draws it.
 *
 * Drawn with arithmetic rather than rasterised from a canvas, so the frames can
 * be produced on the server and asserted in a test — the canvas sources in
 * glyphs.ts need a browser, and an instrument that only exists at runtime is an
 * instrument nothing can hold to its word.
 *
 * Coordinates are fractions of the grid, so every shape scales to whatever disc
 * it is asked for.
 */
export type WeatherFace = Condition | "unreported";

export const WEATHER_FACES: readonly WeatherFace[] = [
  "clear",
  "partly",
  "cloudy",
  "rain",
  "storm",
  "haze",
  "unreported",
];

type Paint = { frame: Float32Array; grid: number };

function put({ frame, grid }: Paint, x: number, y: number, value: number) {
  const col = Math.round(x * (grid - 1));
  const row = Math.round(y * (grid - 1));
  if (col < 0 || col >= grid || row < 0 || row >= grid) return;
  const at = row * grid + col;
  if (value > frame[at]) frame[at] = value;
}

/** A filled disc, in grid fractions. */
function disc(paint: Paint, cx: number, cy: number, r: number, value = 1) {
  const step = 1 / (paint.grid - 1);
  for (let y = cy - r; y <= cy + r; y += step) {
    for (let x = cx - r; x <= cx + r; x += step) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(paint, x, y, value);
    }
  }
}

/** A horizontal run. */
function bar(paint: Paint, x0: number, x1: number, y: number, value = 1) {
  const step = 1 / (paint.grid - 1);
  for (let x = x0; x <= x1; x += step) put(paint, x, y, value);
}

/** A line between two points. */
function stroke(paint: Paint, x0: number, y0: number, x1: number, y1: number, value = 1) {
  const steps = Math.ceil(paint.grid * Math.hypot(x1 - x0, y1 - y0)) + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    put(paint, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, value);
  }
}

/** The cloud every overcast face is built from. */
function cloud(paint: Paint, cx: number, cy: number, scale: number, value = 1) {
  disc(paint, cx - 0.16 * scale, cy + 0.05 * scale, 0.13 * scale, value);
  disc(paint, cx + 0.02 * scale, cy - 0.06 * scale, 0.18 * scale, value);
  disc(paint, cx + 0.2 * scale, cy + 0.05 * scale, 0.14 * scale, value);
  bar(paint, cx - 0.3 * scale, cx + 0.32 * scale, cy + 0.17 * scale, value);
}

function sun(paint: Paint, cx: number, cy: number, r: number, value = 1) {
  disc(paint, cx, cy, r, value);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const from = r + 0.07;
    const to = r + 0.15;
    stroke(
      paint,
      cx + Math.cos(angle) * from,
      cy + Math.sin(angle) * from,
      cx + Math.cos(angle) * to,
      cy + Math.sin(angle) * to,
      value,
    );
  }
}

export function weatherFrame(face: WeatherFace, grid: number): Float32Array {
  const paint: Paint = { frame: emptyFrame(grid), grid };

  switch (face) {
    case "clear":
      sun(paint, 0.5, 0.5, 0.2);
      break;
    case "partly":
      sun(paint, 0.63, 0.34, 0.14, 0.55);
      cloud(paint, 0.44, 0.58, 1);
      break;
    case "cloudy":
      cloud(paint, 0.5, 0.44, 1.1);
      cloud(paint, 0.5, 0.68, 0.75, 0.5);
      break;
    case "rain":
      cloud(paint, 0.5, 0.4, 1);
      for (const x of [0.32, 0.46, 0.6, 0.74]) stroke(paint, x, 0.68, x - 0.05, 0.86, 0.75);
      break;
    case "storm":
      cloud(paint, 0.5, 0.38, 1);
      stroke(paint, 0.56, 0.6, 0.44, 0.74);
      stroke(paint, 0.44, 0.74, 0.56, 0.74);
      stroke(paint, 0.56, 0.74, 0.42, 0.9);
      break;
    case "haze":
      for (const [y, value] of [
        [0.36, 0.5],
        [0.48, 1],
        [0.6, 0.5],
        [0.72, 1],
      ] as const) {
        bar(paint, 0.24, 0.76, y, value);
      }
      break;
    case "unreported":
      /* Not knowing looks like not knowing. Four cells at the cardinals: the
         instrument is present and has nothing to say, which is a different
         statement from an empty disc that might merely be broken. */
      for (const [x, y] of [
        [0.5, 0.3],
        [0.7, 0.5],
        [0.5, 0.7],
        [0.3, 0.5],
      ] as const) {
        disc(paint, x, y, 0.045, 0.6);
      }
      break;
  }

  return paint.frame;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run lib/glyph/weather-frames.test.ts`
Expected: PASS. If "the unreported face is sparsest" fails, the four dots are drawing larger than intended — shrink their radius rather than loosening the assertion. If "tells every face apart" fails, two faces genuinely draw the same picture and one needs redrawing.

- [ ] **Step 5: Commit**

```bash
git add lib/glyph/weather-frames.ts lib/glyph/weather-frames.test.ts
git commit -m "The weather, drawn in cells"
```

---

### Task 5: Where the hands point

**Files:**
- Create: `lib/clock.ts`, `lib/clock.test.ts`

**Interfaces:**
- Produces: `type Hands = { hour: number; minute: number }`, `handAngles(at: Date, timeZone?: string): Hands` from `@/lib/clock`.

Angles in degrees clockwise from twelve, so the SVG can rotate a hand by the number without arithmetic of its own.

- [ ] **Step 1: Write the failing test**

```ts
// lib/clock.test.ts
import { describe, expect, it } from "vitest";
import { handAngles } from "./clock";

/** Lagos is UTC+1 and does not observe daylight saving, so these are exact. */
const lagos = (iso: string) => new Date(iso);

describe("handAngles", () => {
  it("stands both hands at twelve", () => {
    const { hour, minute } = handAngles(lagos("2026-09-02T11:00:00Z")); // 12:00 WAT
    expect(hour).toBeCloseTo(0, 5);
    expect(minute).toBeCloseTo(0, 5);
  });

  it("puts three o'clock at a quarter turn", () => {
    const { hour, minute } = handAngles(lagos("2026-09-02T14:00:00Z")); // 15:00 WAT
    expect(hour).toBeCloseTo(90, 5);
    expect(minute).toBeCloseTo(0, 5);
  });

  it("carries the hour hand between the numerals", () => {
    // Half past six is the hour hand halfway to seven, not pointing at six.
    const { hour, minute } = handAngles(lagos("2026-09-02T17:30:00Z")); // 18:30 WAT
    expect(hour).toBeCloseTo(195, 5);
    expect(minute).toBeCloseTo(180, 5);
  });

  it("sweeps the minute hand with the seconds", () => {
    const { minute } = handAngles(lagos("2026-09-02T11:00:30Z")); // 12:00:30 WAT
    expect(minute).toBeCloseTo(3, 5);
  });

  it("reads the zone it was given, not the machine's", () => {
    const at = lagos("2026-09-02T11:00:00Z");
    expect(handAngles(at, "Africa/Lagos").hour).not.toBeCloseTo(
      handAngles(at, "Asia/Tokyo").hour,
      1,
    );
  });

  it("keeps every angle inside one turn", () => {
    for (let minutes = 0; minutes < 24 * 60; minutes += 7) {
      const at = new Date(Date.UTC(2026, 8, 2, 0, minutes, 0));
      const { hour, minute } = handAngles(at);
      for (const angle of [hour, minute]) {
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/clock.test.ts`
Expected: FAIL — `Failed to resolve import "./clock"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/clock.ts

/**
 * Where an analogue face's hands point, in degrees clockwise from twelve.
 *
 * Degrees rather than radians because the consumer is an SVG `rotate`, and a
 * component that has to convert is a component that can convert wrongly.
 *
 * The zone is read through Intl rather than by adding an offset: Lagos does not
 * observe daylight saving today, and an offset hard-coded on that basis is a
 * bug waiting for a law to change.
 */
export type Hands = { hour: number; minute: number };

const DEFAULT_ZONE = "Africa/Lagos";

export function handAngles(at: Date, timeZone: string = DEFAULT_ZONE): Hands {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const part = (type: "hour" | "minute" | "second") =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  /* Intl renders midnight as 24 in en-GB, which is the same instant as 0 and a
     different number. */
  const hours = part("hour") % 12;
  const minutes = part("minute") + part("second") / 60;

  return {
    hour: ((hours + minutes / 60) * 30) % 360,
    minute: (minutes * 6) % 360,
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run lib/clock.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/clock.ts lib/clock.test.ts
git commit -m "Clock: where the hands point, as arithmetic"
```

---

### Task 6: The two faces

**Files:**
- Create: `lib/use-weather.ts`, `components/clock-face.tsx`, `components/weather-face.tsx`, `components/instrument-pair.tsx`
- Test: `components/instrument-pair.test.tsx`

**Interfaces:**
- Consumes: `handAngles` from `@/lib/clock`; `weatherFrame`, `type WeatherFace` from `@/lib/glyph/weather-frames`; `forecastUrl`, `readForecast`, `type Reading` from `@/lib/weather`; `site` from `@/data/site`; `GlyphCell` from `@/components/glyph-cell`; `useMounted` from `@/lib/use-mounted`.
- Produces: `useWeather(): { reading: Reading | null; settled: boolean }` from `@/lib/use-weather`; `<ClockFace size={n} />`, `<WeatherFace size={n} />`, `<InstrumentPair size={n} />`.

`GlyphCell` already takes `shape="circle"` and a `frame: Float32Array | null`, so the weather face is the disc the site already owns. The clock is genuinely new — hands, not cells.

**Hydration trap:** the server cannot know the time, and rendering one on the server then another on the client is a hydration mismatch. Both faces render their unreported/blank state until mounted, exactly as `components/live-clock.tsx` already does with `useState<string | null>(null)`.

- [ ] **Step 1: Write the failing test**

```tsx
// components/instrument-pair.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstrumentPair } from "@/components/instrument-pair";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentPair", () => {
  it("names both instruments for a reader who cannot see them", () => {
    render(<InstrumentPair size={48} />);
    const labels = [...host.querySelectorAll("[aria-label]")].map((n) =>
      n.getAttribute("aria-label"),
    );
    expect(labels.some((l) => /lagos time/i.test(l ?? ""))).toBe(true);
    expect(labels.some((l) => /lagos weather/i.test(l ?? ""))).toBe(true);
  });

  it("says it has no reading while the forecast is still in flight", () => {
    // An instrument that invents a reading is worse than one that admits it has
    // none. A pending fetch is not a temperature.
    render(<InstrumentPair size={48} />);
    expect(host.textContent).not.toMatch(/\d+°/);
  });

  it("reports the temperature once the forecast lands", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ current: { temperature_2m: 29, weather_code: 2 } }),
      })),
    );
    render(<InstrumentPair size={48} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.textContent).toMatch(/29°/);
  });

  it("admits it cannot read when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<InstrumentPair size={48} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.textContent).not.toMatch(/\d+°/);
    expect(host.textContent).toMatch(/—/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run components/instrument-pair.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/instrument-pair"`.

- [ ] **Step 3: Write the hook**

```ts
// lib/use-weather.ts
"use client";

import { useEffect, useState } from "react";
import { forecastUrl, readForecast, type Reading } from "@/lib/weather";
import { site } from "@/data/site";

/** Weather is not a thing that changes in a second. */
const REFRESH = 15 * 60 * 1000;

/**
 * The Lagos reading, or the admission that there isn't one.
 *
 * `settled` separates "still asking" from "asked and got nothing", because the
 * face draws the same unreported dots either way but should not claim a failure
 * it has not had yet.
 */
export function useWeather(): { reading: Reading | null; settled: boolean } {
  const [state, setState] = useState<{ reading: Reading | null; settled: boolean }>({
    reading: null,
    settled: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    const read = async () => {
      try {
        const response = await fetch(forecastUrl(site.latitude, site.longitude), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const reading = readForecast(await response.json());
        if (live) setState({ reading, settled: true });
      } catch {
        /* Offline, refused, throttled, or nonsense in the payload all mean the
           same thing to an instrument: no reading. */
        if (live) setState({ reading: null, settled: true });
      }
    };

    read();
    const id = setInterval(read, REFRESH);
    return () => {
      live = false;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  return state;
}
```

- [ ] **Step 4: Write the clock face**

```tsx
// components/clock-face.tsx
"use client";

import { useEffect, useState } from "react";
import { handAngles, type Hands } from "@/lib/clock";

/**
 * An analogue face for Lagos.
 *
 * Hands rather than digits: the site already says the time in dot-matrix
 * numerals in the footer bay, and a second numeric readout would be the same
 * sentence twice. It reports live external state, which is the one clause of
 * Law 4 that admits continuous motion — and it moves only while it is telling
 * the time.
 *
 * Null until mounted. The server cannot know the time, and rendering one time
 * on the server and another on the client is a hydration mismatch.
 */
export function ClockFace({ size = 64 }: { size?: number }) {
  const [hands, setHands] = useState<Hands | null>(null);

  useEffect(() => {
    const tick = () => setHands(handAngles(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Lagos time"
      className="shrink-0"
    >
      <circle cx="50" cy="50" r="50" className="fill-strong" />
      {/* The reference carries a red dot here. This site admits one hue, and it
          means a day the step goal was missed; a second meaning would be a
          second hue in all but name. So it is drawn in the face's own ink. */}
      <circle cx="26" cy="26" r="4" className="fill-on-strong" opacity="0.5" />
      {hands && (
        <>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="26"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-on-strong"
            transform={`rotate(${hands.hour} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="16"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-on-strong"
            opacity="0.6"
            transform={`rotate(${hands.minute} 50 50)`}
          />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 5: Write the weather face**

```tsx
// components/weather-face.tsx
"use client";

import { useMemo } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { weatherFrame, type WeatherFace as Face } from "@/lib/glyph/weather-frames";

const GRID = 21;

/**
 * Lagos weather on a disc of the site's own cells.
 *
 * The frame is memoised on the face rather than rebuilt each render: it is
 * arithmetic over a fixed grid and cannot change while the reading does not.
 */
export function WeatherFace({ face, size = 64 }: { face: Face; size?: number }) {
  const frame = useMemo(() => weatherFrame(face, GRID), [face]);

  return (
    <GlyphCell
      grid={GRID}
      size={size}
      shape="circle"
      pixel="round"
      frame={frame}
      label="Lagos weather"
      className="shrink-0"
    />
  );
}
```

Check `components/glyph-cell.tsx`'s props before writing this — it takes `grid`, `size`, `shape`, `frame`, `label`, `pixel`, `unlit`, `polarity`. Use the ones that exist; do not invent a prop.

- [ ] **Step 6: Write the pair**

```tsx
// components/instrument-pair.tsx
"use client";

import { ClockFace } from "@/components/clock-face";
import { WeatherFace } from "@/components/weather-face";
import { useWeather } from "@/lib/use-weather";

/**
 * The two live readings, together.
 *
 * One component so the hero and the footer cannot drift apart: the page opens
 * and closes on the same instruments, which is what gives the footer a design
 * language rather than a second one invented for it.
 */
export function InstrumentPair({ size = 64 }: { size?: number }) {
  const { reading } = useWeather();

  return (
    <div className="flex items-center gap-4">
      <ClockFace size={size} />
      <div className="flex items-center gap-2">
        <WeatherFace face={reading?.condition ?? "unreported"} size={size} />
        <span className="font-mono text-xs uppercase tracking-wider text-ink-3 tabular-nums">
          {reading ? `${Math.round(reading.temperature)}°` : "—"}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run the tests**

Run: `pnpm exec vitest run components/instrument-pair.test.tsx && pnpm test && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS. `GlyphCell` mounts a canvas; `vitest.setup.ts` already stands in for `matchMedia`, and jsdom's canvas returns null from `getContext`, which the cell must tolerate. If it throws, that is a real robustness gap in `GlyphCell` — fix it there rather than stubbing around it in the test.

- [ ] **Step 8: Commit**

```bash
git add lib/use-weather.ts components/clock-face.tsx components/weather-face.tsx components/instrument-pair.tsx components/instrument-pair.test.tsx
git commit -m "Two faces: one tells the time, one admits the weather"
```

---

### Task 7: The hero band, and the footer that echoes it

**Files:**
- Modify: `app/page.tsx` (the header only — the era sections stay until Task 8)
- Modify: `components/site-footer.tsx`
- Modify: `data/site.ts` (remove the now-unused `expertise` export)

**Interfaces:**
- Consumes: `InstrumentPair`; `site`, `elsewhere` from `@/data/site`.

One row, not a section. Identity left, instruments right, work immediately beneath.

- [ ] **Step 1: Replace the header in `app/page.tsx`**

Delete the whole `<header>` block — lockup, both role lines, and the four `RecordRow`s — and put this in its place:

```tsx
      {/* One band, not a section. The record table it replaces read as a form,
          and ten comma-separated skills was the least evidential thing on the
          page — the work below argues it better. Contact and Elsewhere moved to
          the footer, where a reader looks once they have seen something worth
          writing about. */}
      <header className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-6 pb-8">
        <div className="min-w-0">
          <h1 className="text-lg font-medium leading-tight tracking-tight">
            &rsquo;{site.name} <span className="text-ink-3">·</span>{" "}
            <span className="font-normal text-ink-2">Product designer</span>
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Lagos ·{" "}
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
            >
              {site.email}
            </a>
          </p>
        </div>
        <InstrumentPair size={56} />
      </header>
```

Remove the now-unused `RecordRow`, `elsewhere` and `expertise` imports, and add `InstrumentPair`.

- [ ] **Step 2: Delete the expertise list**

Remove the `expertise` export from `data/site.ts` entirely, along with its docblock. Nothing renders it after this task, and data kept for a surface that does not exist is furniture — the README says so in those words.

- [ ] **Step 3: Give the footer the same instruments, larger**

In `components/site-footer.tsx`, put an `InstrumentPair size={72}` at the head of the footer's own block, above the existing links row, and move the `Elsewhere` links from the old hero into that row using `elsewhere` from `@/data/site`. Keep the version chip and the changelog link exactly as they are. The footer is a client boundary now — `InstrumentPair` is a client component and `SiteFooter` is not, which is fine: a server component may render a client one.

`GlyphBay` stays exactly where it is — on the home, above the footer. The spec's phrase "beside the
existing GlyphBay readouts" describes the bottom of the page as a whole, not a move: the bay is a
three-face instrument with its own pager and hidden fourth page, and relocating it into
`SiteFooter` would put it on `/about` and `/colophon` too. Do not move it.

- [ ] **Step 4: Verify by eye**

Run `pnpm dev` and confirm: the identity line and the two faces sit on one row; the clock's hands move; the weather face either draws a condition or the four unreported dots with an em dash beside it; the footer carries the same two faces, larger. Confirm the page has no horizontal scrollbar at 375px wide — the band wraps rather than overflowing.

- [ ] **Step 5: Run everything and commit**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
git add app/page.tsx components/site-footer.tsx data/site.ts
git commit -m "The page opens and closes on the same two readings"
```

---

### Task 8: Four products, numbered

**Files:**
- Create: `components/product.tsx`, `lib/case-blocks.ts`, `lib/case-blocks.test.ts`
- Delete: `components/era-section.tsx`, `components/era-entry.tsx`, `components/era-entry.test.tsx`, `data/eras.ts`, `data/eras.test.ts`, `lib/eras.ts`, `lib/eras.test.ts`
- Create: `components/product.test.tsx`
- Modify: `data/work.ts`, `app/page.tsx`, `next.config.ts`

**Interfaces:**
- Produces: `splitBlocks`, `blockAssetCost`, `LEDE_BLOCKS` from `@/lib/case-blocks` (moved verbatim from `lib/eras.ts`); `<Product item={item} assets={assets} index={index} />` from `@/components/product`.
- Retires: `type Era`, `orderEras`, `data/eras.ts`.

**The nesting collapses.** Eras contained entries, so it took two components. Four flat products need one. `components/product.tsx` is `era-section` and `era-entry` merged — carry over the unfold, the sticky `everOpened` revision, the `PanelField` wrappers with `rootMargin="0px"`, the `preloadFirst` derivation and the `Reveal` wrapper exactly as they work today. **Read `components/era-entry.tsx` and `components/era-section.tsx` in full before writing this**; the fixes in them were bought with a shipped bug and two review rounds, and re-deriving them from scratch will lose them.

Display order is the order of the `work` array in `data/work.ts`. No `sort` field: four hand-ordered items do not need derived ordering, and a field that exists to reorder four things is furniture.

- [ ] **Step 1: Move the arithmetic, unchanged**

`git mv lib/eras.ts lib/case-blocks.ts` and `git mv lib/eras.test.ts lib/case-blocks.test.ts`. From the module, delete the `Era` type and `orderEras`; keep `LEDE_BLOCKS`, `blockAssetCost` and `splitBlocks` with their docblocks intact. From the test, delete the `orderEras` describe block and the `era` helper; keep everything else and fix the import path. Update the module docblock to say what it is now: the arithmetic behind splitting one case reel into a lede and a tail over one asset folder.

- [ ] **Step 2: Run the moved tests**

Run: `pnpm exec vitest run lib/case-blocks.test.ts`
Expected: PASS — the `blockAssetCost` and `splitBlocks` cases, unchanged.

- [ ] **Step 3: Author Endgame**

Add to `data/work.ts`, as the FIRST entry of `work` (2026, newest):

```ts
  {
    slug: "endgame",
    title: "Endgame.ai",
    oneLiner: "An online chess platform — play, train, and follow tournaments.",
    year: "2026",
    disciplines: ["Product Design", "Interaction"],
    href: "https://endgame.ai",
    /* Authored to the shape of the real material — a landing page in both
       skins, the play screen, the daily puzzle and tournament sections, and the
       phone screens — with no src on any of it. Frame draws an empty slot as
       what it is: the shape the art will be, labelled, rather than a collapsed
       gap or an invented picture. Dropping files into public/work/endgame/ and
       running `pnpm manifest` fills these in order, with no edit here. */
    blocks: [
      { kind: "full", ratio: "16 / 10", alt: "Endgame — the landing page" },
      { kind: "pair", items: [{ ratio: "16 / 10" }, { ratio: "16 / 10" }] },
      { kind: "inset", items: [{ ratio: "16 / 10", caption: "Play online" }] },
      { kind: "pair", items: [{ ratio: "9 / 16" }, { ratio: "9 / 16" }] },
      { kind: "full", ratio: "16 / 10" },
      { kind: "inset", tone: "strong", items: [{ ratio: "9 / 16" }, { ratio: "9 / 16" }] },
    ],
  },
```

Add a docblock above `work` recording that **the array's order is the page's order**, newest first.

- [ ] **Step 4: Write the failing component test**

```tsx
// components/product.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Product } from "@/components/product";
import type { WorkItem } from "@/data/work";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

const item: WorkItem = {
  slug: "example",
  title: "Example",
  oneLiner: "One line.",
  year: "2025",
  disciplines: ["Product Design"],
  blocks: [
    { kind: "text", body: ["Lede one."] },
    { kind: "text", body: ["Lede two."] },
    { kind: "text", body: ["Buried treasure."] },
  ],
};

describe("Product", () => {
  it("numbers itself from its position, padded", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("01");
  });

  it("anchors on its own slug, because a retired URL lands here", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.querySelector("#example")).not.toBeNull();
  });

  it("shows the lede and keeps the collapsed tail in the DOM", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Lede one.");
    expect(host.textContent).toContain("Buried treasure.");
    expect(host.querySelector("[hidden]")).toBeNull();
  });

  it("labels the unfold with what is behind it", () => {
    // The chip this replaces was easy to miss; a bar that says what it opens
    // and how much of it is not.
    render(<Product item={item} assets={[]} index={0} />);
    const button = host.querySelector("button")!;
    expect(button.textContent).toMatch(/open case study/i);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toMatch(/close/i);
  });

  it("offers no bar when there is nothing more to show", () => {
    render(<Product item={{ ...item, blocks: item.blocks!.slice(0, 2) }} assets={[]} index={1} />);
    expect(host.querySelector("button")).toBeNull();
  });
});
```

- [ ] **Step 5: Run it to make sure it fails**

Run: `pnpm exec vitest run components/product.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/product"`.

- [ ] **Step 6: Write `components/product.tsx`**

Merge `era-section.tsx` and `era-entry.tsx` into one client component with this shape, preserving every mechanism from both:

- `<Reveal as="section" index={index} className="rule-t scroll-mt-6 pt-10">` carrying `id={item.slug}`.
- A head row: `<GlyphText text={String(index + 1).padStart(2, "0")} size="0.5rem" />`, the title at `text-xl`, the year at `text-xs` on the right, and the one-liner at `text-base text-ink-2` beneath.
- `<PanelField rootMargin="0px">` around the lede reel, `preloadFirst={index === 0}`.
- The unfold: a **full-width button**, `w-full`, with `rule-t` above it, laid out as `flex items-center justify-between`, reading `OPEN CASE STUDY` on the left and the frame count plus the chevron on the right — `{rest.length} FRAMES`. Keep `aria-expanded`, `aria-controls`, the `useId` panel id.
- The collapsible: `grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out data-[open]:grid-rows-[1fr]` over an `overflow-hidden` child, holding the rail prose, the record rows, and `<PanelField revision={everOpened ? 1 : 0} rootMargin="0px">` around the tail reel with `assets.slice(restAssetOffset)` and `preloadFirst={false}`.

The tail MUST stay in the DOM — collapsed by grid rows, never `hidden`, never conditionally rendered. That is what keeps the retired case studies findable by search-in-page, and a test above asserts it.

- [ ] **Step 7: Rewrite the home's body**

In `app/page.tsx`, replace the era loop with:

```tsx
      <div className="space-y-20">
        {work.map((item, i) => (
          <Product key={item.slug} item={item} assets={workAssets[item.slug] ?? []} index={i} />
        ))}
      </div>
```

importing `work` from `@/data/work` and `workAssets` from `@/data/assets.generated`. Remove the `EraSection`, `orderEras` and `eras` imports.

- [ ] **Step 8: Repoint the redirects**

In `next.config.ts`, the three `/work/*` destinations become `/#chessever`, `/#sylvan` and `/#hitmans-library` — the era anchors they pointed at no longer exist. Replace the comment explaining why they are written out rather than patterned with this, because the reason has changed:

```ts
  /* Written out rather than patterned. Flat products make slug and anchor
     identical, so `/work/:slug -> /#:slug` would now resolve correctly — and is
     still refused, because it would also send every slug that never existed to
     the top of the home page. A URL that was never real should 404, and three
     explicit lines say which three were. */
```

- [ ] **Step 9: Delete the era layer**

```bash
git rm components/era-section.tsx components/era-entry.tsx components/era-entry.test.tsx data/eras.ts data/eras.test.ts
```

Then `grep -rn "era\|Era" app components lib data --include='*.ts' --include='*.tsx'` and confirm the only survivors are prose. `data/changelog.ts` mentions eras in historical entries — do not touch it.

- [ ] **Step 10: Verify, including the redirects**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build && pnpm start &
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/chessever
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/sylvan
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/work/hitmans-library
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3000/work/nonexistent
```

Expected: `308` to `/#chessever`, `/#sylvan`, `/#hitmans-library`; `404` for the fourth.

Then look at it: four numbered products, Endgame first showing six labelled empty frames printing their shapes, the unfold bar spanning the column and naming its frame count.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Four products, numbered, and the era layer retires"
```

---

### Task 9: The mosaic

**Files:**
- Create: `lib/mosaic.ts`, `lib/mosaic.test.ts`
- Delete: `lib/shots-layout.ts`, `lib/shots-layout.test.ts`
- Modify: `components/shots-field.tsx`

**Interfaces:**
- Produces: `COLUMNS`, `BANDS`, `type Placed<T> = { item: T; span: number }`, `composeMosaic<T>(items: readonly T[]): Placed<T>[][]` from `@/lib/mosaic`.
- Retires: `bucketShots`, `DRIFT`, `COLUMN_CELLS`, `COLUMNS_NARROW`, `COLUMNS_WIDE`, `WIDE_QUERY`.

Formless means the composition emerges rather than being authored per shot. Height still comes from each image's own ratio; width varies across a small set of spans; bands are chosen so no two neighbours match. Order stays newest-first — it is the only thing the order does.

**`components/shots-field.tsx` currently uses `WIDE_QUERY` and `useMediaQuery` to pass `revision={columns}` to `PanelField`.** The mosaic has one column count at every width, so that dependency goes — but `PanelField` still needs a `revision` when the layout changes. Pass the shot count.

- [ ] **Step 1: Write the failing test**

```ts
// lib/mosaic.test.ts
import { describe, expect, it } from "vitest";
import { BANDS, COLUMNS, composeMosaic } from "./mosaic";

const shots = (n: number) => Array.from({ length: n }, (_, i) => i);
const lengths = Array.from({ length: 40 }, (_, i) => i + 1);

describe("the band vocabulary", () => {
  it("gives every band the full measure", () => {
    for (const band of BANDS) {
      expect(band.reduce((a, b) => a + b, 0), band.join("+")).toBe(COLUMNS);
    }
  });

  it("never repeats a width side by side inside a band", () => {
    for (const band of BANDS) {
      for (let i = 1; i < band.length; i++) expect(band[i], band.join("+")).not.toBe(band[i - 1]);
    }
  });
});

describe("composeMosaic", () => {
  it("places every shot exactly once, in order", () => {
    // Newest-first is the only thing the order does; a mosaic still reads in
    // document order, so composition must not reorder anything.
    for (const n of lengths) {
      const flat = composeMosaic(shots(n)).flat().map((p) => p.item);
      expect(flat, `n=${n}`).toEqual(shots(n));
    }
  });

  it("fills every band to the full measure", () => {
    for (const n of lengths) {
      for (const band of composeMosaic(shots(n))) {
        expect(band.reduce((total, p) => total + p.span, 0), `n=${n}`).toBe(COLUMNS);
      }
    }
  });

  it("never sets two neighbours at the same width", () => {
    for (const n of lengths) {
      const bands = composeMosaic(shots(n));
      bands.forEach((band, b) => {
        for (let i = 1; i < band.length; i++) {
          expect(band[i].span, `n=${n} band=${b}`).not.toBe(band[i - 1].span);
        }
        if (b > 0) {
          const above = bands[b - 1];
          expect(band[0].span, `n=${n} band=${b} follows`).not.toBe(above[above.length - 1].span);
        }
      });
    }
  });

  it("gives a lone shot the whole measure", () => {
    expect(composeMosaic(shots(1))).toEqual([[{ item: 0, span: COLUMNS }]]);
  });

  it("composes the same way twice, so the server and the client agree", () => {
    // No randomness anywhere: a shuffled mosaic would hydrate into a different
    // page than it rendered.
    expect(composeMosaic(shots(23))).toEqual(composeMosaic(shots(23)));
  });

  it("returns nothing for nothing", () => {
    expect(composeMosaic([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run lib/mosaic.test.ts`
Expected: FAIL — `Failed to resolve import "./mosaic"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/mosaic.ts

/**
 * The feed's composition: formless rather than authored.
 *
 * The reference this came from builds its mosaic by hand — every shot given a
 * column and row span in the markup. That produces a designed rhythm and a
 * decision to make every time a shot is added. This does not author sizes. A
 * shot's height is still its own aspect ratio; its width comes from a band
 * vocabulary chosen so that no two neighbours ever share one, which is what
 * makes the page read as organic instead of as a repeating pattern.
 *
 * Nothing here is random. A shuffled mosaic would hydrate into a different page
 * than the server rendered.
 */
export const COLUMNS = 12;

/**
 * Every band spans the full measure, and no band repeats a width side by side.
 * Two-item bands give the feed its big moments; three-item bands are its rests.
 */
export const BANDS: readonly (readonly number[])[] = [
  [7, 5],
  [4, 8],
  [3, 5, 4],
  [5, 7],
  [8, 4],
  [4, 3, 5],
];

export type Placed<T> = { item: T; span: number };

/** The widest single span, used when one shot is left over. */
const FULL = COLUMNS;

function pick(order: number, previousLast: number, remaining: number): readonly number[] {
  if (remaining === 1) return [FULL];
  const fits = BANDS.filter((band) => band.length <= remaining);
  const distinct = fits.filter((band) => band[0] !== previousLast);
  /* `distinct` is only empty if every band that fits opens on the width the
     last band closed on, which the vocabulary above makes impossible — but
     falling back to `fits` keeps a future edit to BANDS from throwing. */
  const pool = distinct.length > 0 ? distinct : fits;
  return pool[order % pool.length];
}

export function composeMosaic<T>(items: readonly T[]): Placed<T>[][] {
  const bands: Placed<T>[][] = [];
  let cursor = 0;
  let order = 0;
  let previousLast = 0;

  while (cursor < items.length) {
    const composition = pick(order, previousLast, items.length - cursor);
    const band = composition.map((span, i) => ({ item: items[cursor + i], span }));
    bands.push(band);
    cursor += composition.length;
    previousLast = composition[composition.length - 1];
    order += 1;
  }

  return bands;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run lib/mosaic.test.ts`
Expected: PASS at every length from 1 to 40.

- [ ] **Step 5: Render it**

Rewrite `components/shots-field.tsx` to map bands onto a 12-column grid. Keep the swept-frame markup exactly as it is today — `data-frame`, the `<canvas>` sibling, and the `<Image>` at `opacity-0` — because `lib/glyph/sweep.ts` depends on that contract:

```tsx
    <PanelField revision={shots.length} className="grid grid-cols-12 gap-[21px]" style={{ alignItems: "start" }}>
      {bands.flat().map(({ item, span }) => (
        <div
          key={item.src}
          data-frame
          className="relative overflow-hidden bg-surface-2"
          style={{ gridColumn: `span ${span}`, aspectRatio: `${item.width} / ${item.height}` }}
        >
          <canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
          <Image
            src={item.src}
            alt={item.title}
            width={item.width}
            height={item.height}
            sizes="(min-width: 1024px) 50vw, 92vw"
            className="h-full w-full object-cover opacity-0"
          />
        </div>
      ))}
    </PanelField>
```

**The phone gets two columns, not twelve** — a twelve-column mosaic at 375px is four unreadable
slivers. Do this with ONE mechanism, not two: the grid is `grid-cols-2 lg:grid-cols-12`, and each
cell carries `className="col-span-1 lg:[grid-column:span_var(--span)]"` with the span passed as a
custom property, `style={{ "--span": span, aspectRatio: ... } as React.CSSProperties}`. Do not also
set `gridColumn` in `style` — an inline `grid-column` beats the class at every width and the
breakpoint would never take effect. The composition still runs at both widths; below `lg` the spans
are simply ignored and every shot takes one of two columns.

- [ ] **Step 6: Delete the old layout**

```bash
git rm lib/shots-layout.ts lib/shots-layout.test.ts
```

Confirm nothing imports them: `grep -rn "shots-layout" app components lib data`.

- [ ] **Step 7: Verify**

Run `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`, then `pnpm dev` and look at `/shots` at a wide window and at 375px. Confirm: shots at visibly different widths, no two neighbours the same, newest first, the dot sweep still resolving each frame, and two-up on the phone.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "The feed composes itself"
```

---

### Task 10: The responsive pass

**Files:** whichever surfaces the audit finds wanting — `app/page.tsx`, `components/product.tsx`, `components/instrument-pair.tsx`, `components/shots-field.tsx`, `components/site-footer.tsx`, `components/site-nav.tsx`, `app/globals.css`.

This is an audit with fixes, not a feature. Everything before it was built to the responsive
constraint; this task proves it and closes what it finds.

- [ ] **Step 1: Measure, don't eyeball.** Drive a real browser (`pnpm dev`) at these widths, and at
  each one record the document's scroll width against its client width:
  `320, 360, 390, 414, 480, 640, 768, 834, 1024, 1280, 1440, 1920, 2560`. Any width where
  `document.documentElement.scrollWidth > document.documentElement.clientWidth` is a horizontal
  scroll defect — record the offending element by walking the DOM for nodes wider than the viewport.
  Do this for `/`, `/shots`, `/about` and `/colophon`.

- [ ] **Step 2: Check the short viewport too.** At 360×640 and at 800×400 (a phone held sideways),
  confirm the hero band does not consume the whole screen and that the first product is reachable.

- [ ] **Step 3: Check the specific things most likely to be wrong**, each of which has a known cause:
  - The hero band wraps rather than overflowing, and the two instrument faces do not shrink below
    legibility — step them down at narrow widths rather than letting flex squeeze them.
  - The mosaic is two columns below `lg` and never four slivers.
  - The unfold bar's label and frame count do not collide at 320px.
  - A case reel's `pair` and `inset` blocks stack rather than staying side by side on a phone.
  - `RecordRow`'s fixed 72px label column still leaves a usable value column at 320px.
  - The nav chip row wraps rather than scrolling the page.

- [ ] **Step 4: Fix what you found**, mobile-first: give the narrow viewport its own layout rather
  than scaling the wide one down. Sizes stay on the rem scale, swapped by breakpoint.

- [ ] **Step 5: Re-measure** at every width in step 1 and confirm zero horizontal overflow on all
  four routes.

- [ ] **Step 6: Run everything and commit**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
git add -A
git commit -m "Every width, and no page that scrolls sideways"
```

---

### Task 11: Ship — DO NOT RUN WITHOUT THE USER'S EXPLICIT GO-AHEAD

This task pushes to a shared branch and deploys to production. It is withheld deliberately. Do not begin it because the previous nine tasks are green.

- [ ] **Step 1: Update the README** — the home is four numbered products with live instruments; `/shots` is a mosaic; the type scale and the contrast floor are both enforced by tests, and where those tests live. Also fix the Status line, which still reads `v1.13.0: … three selected pieces with case pages`.
- [ ] **Step 2: Add the `2.0.0` changelog entry** to `data/changelog.ts`, newest first, `deployment` left empty for now. Do not edit any existing entry.
- [ ] **Step 3:** `vercel deploy --prod`, take the immutable URL it prints, and record it in the entry's `deployment` field. Deployment protection stays off — old versions must remain publicly viewable.
- [ ] **Step 4:** commit, `git tag v2.0.0`, `git push origin home-as-feed --tags`.
- [ ] **Step 5:** `./scripts/deploy.sh` — never a plain `vercel deploy --prod` against the portfolio project; the script swaps the `.vercel` link directories.
- [ ] **Step 6:** confirm on the deployed URL, not localhost: four products, the instruments live, the three retired `/work/*` URLs landing on their anchors, `/shots` composing.

## Success criteria

1. The first screen carries an identity line, two live instruments, and the start of `01`. `01` shows its waiting frames, each printing the shape it will be, and no invented artwork.
2. `--text-3` reaches at least 3:1 against `--bg` on both skins, held by `lib/contrast.test.ts`, and no governed component sets a font size outside the scale, held by `lib/type-scale.test.ts`.
3. A tinted case plate is as visible on the light skin as on the dark.
4. The time face reads Lagos time; the weather face reads Lagos weather, or admits it cannot.
5. Nothing on the page moves that was not touched, arriving, or reporting live external state.
6. The three retired `/work/*` URLs resolve to their product anchors.
7. The feed places every shot exactly once, newest first, with no two adjacent shots the same width.
8. A collapsed case study's text is still found by search-in-page, and a collapsed product downloads none of its images.
9. No route scrolls horizontally at any width from 320px to 2560px, and the narrow layout is
   designed for narrow rather than being the wide one scaled down.
