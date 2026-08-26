import { describe, expect, it } from "vitest";
import { CEIL, FLOOR, PITCH, STEPS, cellsAcross, emitter, panelFrom, quantise, smoothstep } from "./panel";

/** A row of pixels at one luminance, as ImageData would hand them over. */
const flat = (n: number, level: number) => {
  const px = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = level;
    px[i * 4 + 3] = 255;
  }
  return px;
};

describe("the panel", () => {
  it("keeps one pitch, so a small shot and a large one share a field", () => {
    expect(cellsAcross(PITCH * 10)).toBe(10);
    expect(cellsAcross(PITCH * 40)).toBe(40);
  });

  it("never asks for fewer than two cells, however small the box", () => {
    expect(cellsAcross(1)).toBe(2);
    expect(cellsAcross(0)).toBe(2);
  });

  it("lights an emitter for a dark pixel, not a bright one", () => {
    const dark = panelFrom(flat(4, 0), 2, 2);
    const bright = panelFrom(flat(4, 255), 2, 2);
    // A flat frame has no range to stretch, so autoLevel leaves it alone.
    expect(dark.values[0]).toBeGreaterThan(bright.values[0]);
  });

  it("drives in steps, because a panel has no continuous dimmer", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 100; i++) seen.add(quantise(i / 100));
    expect(seen.size).toBe(STEPS);
  });

  it("holds every emitter at the floor before the front arrives", () => {
    // The lattice is the panel's face: on, and saying nothing yet.
    expect(emitter(1, 0)).toBe(quantise(FLOOR));
    expect(emitter(0, 0)).toBe(quantise(FLOOR));
  });

  it("never drives an emitter to full ink", () => {
    expect(emitter(1, 1)).toBeLessThanOrEqual(quantise(CEIL));
  });

  it("opens monotonically — a front can only ever reveal", () => {
    let last = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = emitter(1, t);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });

  it("puts no corners on either end of the wavefront", () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(2)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });
});
