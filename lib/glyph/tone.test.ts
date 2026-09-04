import { describe, expect, it } from "vitest";
import { autoLevel, centreMidtone, inkRadius } from "./tone";

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
    const flat = Float32Array.from([0.3, 0.3, 0.3]);
    // 0.3 has no exact float32, so the frame's own values — snapshotted before
    // the call, in case it mutates — are the only honest comparand.
    const before = Array.from(flat);
    const out = autoLevel(flat);
    for (const v of out) expect(Number.isFinite(v)).toBe(true);
    expect(Array.from(out)).toEqual(before);
  });

  it("preserves ordering", () => {
    const out = autoLevel(Float32Array.from([0.9, 0.1, 0.5]));
    expect(out[0]).toBeGreaterThan(out[2]);
    expect(out[2]).toBeGreaterThan(out[1]);
  });

  it("spreads a narrow-band frame across most of the range despite single-pixel outliers", () => {
    // One near-black and one near-white pixel bracket 48 values packed into a
    // 0.04-wide band — a stray dust speck at each end of an otherwise flat
    // midtone cover. Min/max would anchor on those two pixels and leave the
    // band exactly as compressed as it started (0.04 wide, same as the input);
    // percentile clipping should treat them as noise and let the band claim
    // nearly the whole 0..1 range instead.
    const bulk = Array.from({ length: 48 }, (_, i) => 0.48 + (i / 47) * 0.04);
    const frame = Float32Array.from([0, ...bulk, 1]);
    const out = autoLevel(frame);

    const bulkOut = Array.from(out).slice(1, -1);
    const bulkSpread = Math.max(...bulkOut) - Math.min(...bulkOut);
    expect(bulkSpread).toBeGreaterThan(0.9);

    // The single-pixel outliers still clip cleanly to the ends rather than
    // dragging the whole scale out to meet them.
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(1);
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

describe("centreMidtone", () => {
  const median = (frame: Float32Array) => {
    const sorted = Float32Array.from(frame).sort();
    return sorted[Math.round(0.5 * (sorted.length - 1))];
  };

  it("lands the median in the middle of the range", () => {
    // A dark-skewed frame: the shape the About portrait arrives in.
    const dark = Float32Array.from([0.5, 0.7, 0.75, 0.9, 0.95]);
    expect(median(dark)).toBeCloseTo(0.75);
    expect(median(centreMidtone(dark))).toBeCloseTo(0.5, 2);
  });

  it("lifts a pale frame by the same rule", () => {
    const pale = Float32Array.from([0.02, 0.1, 0.25, 0.4, 0.5]);
    expect(median(centreMidtone(pale))).toBeCloseTo(0.5, 2);
  });

  it("leaves an already-centred frame alone", () => {
    const centred = Float32Array.from([0.1, 0.3, 0.5, 0.7, 0.9]);
    const out = centreMidtone(centred);
    for (let i = 0; i < centred.length; i++) expect(out[i]).toBeCloseTo(centred[i], 5);
  });

  it("keeps the ends where they were, so nothing is clipped by centring", () => {
    const out = centreMidtone(Float32Array.from([0, 0.8, 0.9, 0.95, 1]));
    expect(out[0]).toBe(0);
    expect(out[4]).toBe(1);
  });

  it("never reorders the frame", () => {
    // A monotonic map is the whole claim: it moves tone, never structure.
    const out = centreMidtone(Float32Array.from([0.1, 0.6, 0.65, 0.8, 0.99]));
    for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThan(out[i - 1]);
  });

  it("spreads a frame that was stacked on one step", () => {
    /* The defect, stated as a test. Ten cells whose levelled values pile into
       the top of the range come back spread across it. */
    const stacked = Float32Array.from([0.9, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 0.3]);
    const step = (v: number) => Math.round(Math.min(1, v * 0.62) * 15);
    const before = new Set(Array.from(stacked, step)).size;
    const after = new Set(Array.from(centreMidtone(stacked), step)).size;
    expect(after).toBeGreaterThan(before);
  });

  it("refuses to divide by a logarithm it does not have", () => {
    for (const flat of [Float32Array.from([0, 0, 0]), Float32Array.from([1, 1, 1])]) {
      const out = centreMidtone(flat);
      for (const v of out) expect(Number.isFinite(v)).toBe(true);
    }
    expect(centreMidtone(new Float32Array(0)).length).toBe(0);
  });
});
