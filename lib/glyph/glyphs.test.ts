import { describe, expect, it } from "vitest";
import { artFrame, artwork, emptyFrame } from "./glyphs";

const GRID = 48;

/** A cover, as the pixel buffer `getImageData` would hand over: one grey per cell. */
const cover = (grey: (row: number, col: number) => number): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(GRID * GRID * 4);
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const at = (row * GRID + col) * 4;
      const value = Math.round(255 * Math.min(1, Math.max(0, grey(row, col))));
      pixels[at] = pixels[at + 1] = pixels[at + 2] = value;
      pixels[at + 3] = 255;
    }
  }
  return pixels;
};

const spread = (frame: Float32Array) => {
  const sorted = Float32Array.from(frame).sort();
  return sorted[sorted.length - 1] - sorted[0];
};

const median = (frame: Float32Array) => Float32Array.from(frame).sort()[frame.length >> 1];

describe("emptyFrame", () => {
  it("is one value per cell, all of them nothing", () => {
    const frame = emptyFrame(GRID);
    expect(frame).toHaveLength(GRID * GRID);
    expect(frame.every((value) => value === 0)).toBe(true);
  });
});

describe("artFrame", () => {
  /**
   * The defect this file is written against: a straight luma is a correct
   * measurement and an unreadable picture. A cover exposed into a narrow band
   * of the range came out as a featureless grey disc, because nothing was using
   * more of the range than the photographer had.
   */
  it("opens a cover that was exposed into a narrow band", () => {
    // Everything between 0.42 and 0.52 — a sixth of a stop, which is what most
    // sleeves amount to once colour is discarded.
    const narrow = cover((row) => 0.42 + (row / GRID) * 0.1);
    expect(spread(artFrame(narrow, GRID))).toBeGreaterThan(0.8);
  });

  it("keeps the order of the picture while it opens it", () => {
    // Brighter stays brighter. A mapping that reordered tones would be
    // inventing a different photograph, not showing this one more clearly.
    const ramp = cover((row) => 0.3 + (row / GRID) * 0.3);
    const frame = artFrame(ramp, GRID);
    // Read a column down the middle, away from the edges the sharpening clips.
    const column = Array.from({ length: GRID }, (_, row) => frame[row * GRID + GRID / 2]);
    for (let row = 2; row < GRID - 2; row++) {
      expect(column[row]).toBeGreaterThanOrEqual(column[row - 1] - 1e-6);
    }
  });

  it("brings a night-time cover up to a readable middle", () => {
    const dark = cover((row) => (row / GRID) * 0.18);
    expect(median(artFrame(dark, GRID))).toBeGreaterThan(0.3);
  });

  it("brings a high-key cover down to one", () => {
    const bright = cover((row) => 0.82 + (row / GRID) * 0.18);
    expect(median(artFrame(bright, GRID))).toBeLessThan(0.7);
  });

  it("does not let one specular highlight set the range", () => {
    // A single blown cell out of 2304 must not decide where white is: with the
    // extremes taken literally the rest of the picture crushes into the floor.
    const glinted = cover((row, col) => (row === 0 && col === 0 ? 1 : 0.3 + (row / GRID) * 0.1));
    expect(spread(artFrame(glinted, GRID))).toBeGreaterThan(0.8);
  });

  it("leaves a cover with no range in it alone", () => {
    // One flat colour carries no picture, and stretching it would amplify the
    // JPEG's own noise into a field of speckle that looks like one.
    const flat = cover(() => 0.5);
    const frame = artFrame(flat, GRID);
    expect(spread(frame)).toBeLessThan(0.02);
    expect(frame[0]).toBeCloseTo(0.5, 2);
  });

  it("sharpens an edge without taking it past the ends of the range", () => {
    const halves = cover((row) => (row < GRID / 2 ? 0.25 : 0.75));
    const frame = artFrame(halves, GRID);
    for (const value of frame) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    // The two cells either side of the seam are pushed apart, not merely kept.
    const above = frame[(GRID / 2 - 1) * GRID + GRID / 2];
    const below = frame[(GRID / 2) * GRID + GRID / 2];
    expect(below - above).toBeGreaterThan(0.9);
  });

  it("weights green the way an eye does", () => {
    // Rec. 601, still: the stretch changes how the values are spread, never
    // which colour counts for what.
    const green = new Uint8ClampedArray(4 * 4 * 4);
    const blue = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < 16; i++) {
      green[i * 4 + 1] = 255;
      green[i * 4 + 3] = 255;
      blue[i * 4 + 2] = 255;
      blue[i * 4 + 3] = 255;
    }
    // Both are flat, so both come back as their own luma, untouched.
    expect(artFrame(green, 4)[0]).toBeCloseTo(0.587, 3);
    expect(artFrame(blue, 4)[0]).toBeCloseTo(0.114, 3);
  });
});

describe("artwork", () => {
  /** One flat colour across the whole cover, as a pixel buffer. */
  const flat = (r: number, g: number, b: number): Uint8ClampedArray => {
    const pixels = new Uint8ClampedArray(GRID * GRID * 4);
    for (let i = 0; i < GRID * GRID; i++) {
      pixels[i * 4] = r;
      pixels[i * 4 + 1] = g;
      pixels[i * 4 + 2] = b;
      pixels[i * 4 + 3] = 255;
    }
    return pixels;
  };

  it("keeps the tone `artFrame` derived", () => {
    const narrow = cover((row) => 0.42 + (row / GRID) * 0.1);
    expect(Array.from(artwork(narrow, GRID).tone)).toEqual(Array.from(artFrame(narrow, GRID)));
  });

  it("carries three bytes for every cell", () => {
    expect(artwork(flat(120, 60, 30), GRID).colour).toHaveLength(GRID * GRID * 3);
  });

  it("leaves hue and saturation where the artwork put them", () => {
    /* The whole reason the exposure is a gain rather than a curve per channel:
       a multiplier cannot move the ratios between the channels, so the colour
       that comes out is the colour that went in at a different brightness. Run
       down R, G and B separately and every cover drifts towards grey, which is
       the dither again with more steps. */
    const { colour } = artwork(flat(180, 90, 45), GRID);
    expect(colour[0] / colour[1]).toBeCloseTo(2, 2);
    expect(colour[1] / colour[2]).toBeCloseTo(2, 2);
  });

  it("does not invent a colour for a cell that has none", () => {
    // Near-black is three channels of noise. The floor keeps the gain finite.
    const { colour } = artwork(flat(2, 1, 1), GRID);
    expect(colour[0]).toBeLessThan(40);
  });
});
