import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
