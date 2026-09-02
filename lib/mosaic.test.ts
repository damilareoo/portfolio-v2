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
