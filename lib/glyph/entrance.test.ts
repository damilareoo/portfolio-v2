import { describe, expect, it } from "vitest";
import { sweepMask } from "./entrance";

const GRID = 9;

describe("sweepMask", () => {
  it("is fully dark at t=0", () => {
    const mask = sweepMask(GRID, 0);
    for (const v of mask) expect(v).toBe(0);
  });

  it("is fully lit at t=1", () => {
    const mask = sweepMask(GRID, 1);
    for (const v of mask) expect(v).toBe(1);
  });

  it("lights the centre before the corners", () => {
    const mask = sweepMask(GRID, 0.3);
    const centre = mask[Math.floor(GRID / 2) * GRID + Math.floor(GRID / 2)];
    expect(centre).toBeGreaterThan(mask[0]);
  });

  it("never decreases as t advances", () => {
    const early = sweepMask(GRID, 0.4);
    const later = sweepMask(GRID, 0.6);
    for (let i = 0; i < early.length; i++) {
      expect(later[i]).toBeGreaterThanOrEqual(early[i]);
    }
  });

  it("clamps t outside 0..1", () => {
    expect(Array.from(sweepMask(GRID, -1))).toEqual(Array.from(sweepMask(GRID, 0)));
    expect(Array.from(sweepMask(GRID, 2))).toEqual(Array.from(sweepMask(GRID, 1)));
  });
});
