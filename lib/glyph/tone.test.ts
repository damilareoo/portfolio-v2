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
