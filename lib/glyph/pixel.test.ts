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
