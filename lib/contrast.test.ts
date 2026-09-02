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
    // --text-3 carries every label, year and caption at --text-xs, 0.6875rem.
    // Below 3:1 it is decoration that happens to contain words.
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
    // in the light.
    //
    // Measured as a contrast RATIO, not a luminance difference. The same
    // difference in luminance reads as an obvious step near black and as nothing
    // at all near white, so comparing raw differences across two skins scores
    // the light one against a yardstick that does not apply to it — and the
    // value that satisfies it is the flat one this test exists to reject.
    const separations = both.map(
      ([, skin]) => contrastRatio(skin["--surface-2"], skin["--bg"]),
    );
    for (const separation of separations) expect(separation).toBeGreaterThan(1.015);
    const [light, dark] = separations;
    expect(Math.max(light - 1, dark - 1) / Math.min(light - 1, dark - 1)).toBeLessThanOrEqual(3);
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
