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
    // Half a side is a circle, which is what the pixel now is. Past half there
    // is no shape left to draw — the radius would exceed the side it rounds.
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

describe("the rule keeps its own hand", () => {
  /* These were one number, and this test asserted they agreed: a rule drawn at
     a different fill was a second language. They stopped meaning the same thing
     when the pixel became a circle. `PIXEL_FILL` went to 0.82 to repay the π/4
     of its square that a circle gives up, and a rule's dash is a square, so it
     owes nothing — shared, the number would have closed the rules' gap to pay a
     debt they never took on. The seam is still a seam; it just guards a
     separation now instead of an equality. */
  const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

  it("declares a fill of its own", () => {
    const declared = css.match(/--rule-fill:\s*([\d.]+)/);
    expect(declared, "globals.css must declare --rule-fill").not.toBeNull();
    expect(Number(declared![1])).toBeGreaterThan(0);
    expect(Number(declared![1])).toBeLessThan(1);
  });

  it("draws itself with that fill and not the field's", () => {
    const block = css.match(/\.rule-b,\s*\n\s*\.rule-t\s*\{[\s\S]*?\n {2}\}/);
    expect(block, "globals.css must declare the .rule-b/.rule-t block").not.toBeNull();
    expect(block![0]).toContain("--rule-fill");
    // Re-coupling the two is the drift this file exists to catch, and it would
    // be an easy tidy-up to make: the numbers look like they want to be one.
    expect(block![0]).not.toContain("--pixel-fill");
  });

  it("leaves no copy of the field's fill in CSS to drift against", () => {
    // Nothing in the stylesheet consumes it any more, and a declared-but-unused
    // duplicate of a TypeScript constant is the drift trap wearing a token's
    // name. PIXEL_FILL is free to move because there is nothing to keep in step.
    expect(css).not.toContain("--pixel-fill");
  });

  it("stands above the rule's fill, which is what the circle's corners cost", () => {
    /* Free to move is not free to move *back*. This is the only thing pinning
       the field's fill, and it pins it as an argument rather than as a magic
       number: a circle keeps π/4 of the square it is inscribed in, so a pixel
       that turned its corners all the way has to be drawn wider than the square
       dash that never did, or every icon and numeral thins by a fifth. Reverting
       PIXEL_FILL to the rule's 0.74 passed all three-hundred-odd tests before
       this one existed. */
    const declared = css.match(/--rule-fill:\s*([\d.]+)/);
    expect(declared, "globals.css must declare --rule-fill").not.toBeNull();
    expect(PIXEL_FILL).toBeGreaterThan(Number(declared![1]));
  });
});

describe("the floor belongs to the skin", () => {
  /* The floor is two numbers now, and neither of them lives here. What this
     file can still hold is the seam: globals.css is where they are, and
     PIXEL_FLOOR is only what a renderer falls back to when no stylesheet has
     loaded — so it has to be the light one, because a document with no
     stylesheet has no `.dark` on it either. */
  const css = () => readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
  const floorIn = (block: string) => {
    const scope = css().match(new RegExp(`${block}\\s*\\{[\\s\\S]*?\\n\\}`));
    expect(scope, `globals.css must declare a ${block} block`).not.toBeNull();
    const declared = scope![0].match(/--pixel-floor:\s*([\d.]+)/);
    expect(declared, `${block} must declare --pixel-floor`).not.toBeNull();
    return Number(declared![1]);
  };

  it("declares a floor on each skin, inside the range an alpha has", () => {
    /* The upper bound is not pedantry. Canvas ignores an out-of-range
       `globalAlpha` rather than clamping it, so a floor above 1 would paint
       every dot at whatever alpha the last one left set — silently. GlyphCell
       clamps what it reads; this keeps the stylesheet from needing it to. */
    for (const skin of [":root", "\\.dark"]) {
      expect(floorIn(skin)).toBeGreaterThan(0);
      expect(floorIn(skin)).toBeLessThanOrEqual(1);
    }
  });

  it("spends less ink on the dark skin, where near-black is already a surface", () => {
    expect(floorIn("\\.dark")).toBeLessThan(floorIn(":root"));
  });

  it("falls back to the light skin's floor, which is the one a bare document has", () => {
    expect(PIXEL_FLOOR).toBe(floorIn(":root"));
  });
});
