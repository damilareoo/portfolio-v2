import { describe, expect, it } from "vitest";
import { segmentsFor, traceFor, tracePath } from "./trace";

describe("segmentsFor", () => {
  it("gives a longer line to a longer day", () => {
    expect(segmentsFor(9000)).toBeGreaterThan(segmentsFor(3000));
  });

  it("has a floor, so a short day is still a figure and not a scribble", () => {
    expect(segmentsFor(1)).toBe(segmentsFor(100));
    expect(segmentsFor(200)).toBeGreaterThanOrEqual(18);
  });

  it("has a ceiling, so an enormous day still fits the card", () => {
    expect(segmentsFor(1_000_000)).toBe(segmentsFor(500_000));
  });

  it("draws nothing at all for a day with no walking in it", () => {
    expect(segmentsFor(0)).toBe(0);
    expect(segmentsFor(-5)).toBe(0);
    expect(segmentsFor(Number.NaN)).toBe(0);
  });
});

describe("traceFor", () => {
  /* The property the whole idea rests on: a day is a record, not a decoration,
     so Tuesday has to look like Tuesday tomorrow and next year. */
  it("draws the same line for the same day, every time", () => {
    const a = traceFor("2026-08-20", 7400);
    const b = traceFor("2026-08-20", 7400);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it("draws a different line for a different day", () => {
    const a = traceFor("2026-08-20", 7400);
    const b = traceFor("2026-08-21", 7400);
    expect(a).not.toEqual(b);
  });

  it("stays inside the box it was fitted to", () => {
    for (const steps of [400, 3000, 9000, 40000]) {
      for (const p of traceFor("2026-08-20", steps)) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("fills its box on at least one axis, so a card is never mostly empty", () => {
    const points = traceFor("2026-08-20", 8000);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    expect(spread).toBeCloseTo(1, 5);
  });

  it("comes back near where it set out", () => {
    // Averaged over many days: a single line may wander, the habit should not.
    let close = 0;
    const days = 40;
    for (let i = 0; i < days; i++) {
      const points = traceFor(`2026-03-${String(i + 1).padStart(2, "0")}`, 9000);
      const first = points[0];
      const last = points[points.length - 1];
      if (Math.hypot(last.x - first.x, last.y - first.y) < 0.55) close++;
    }
    expect(close).toBeGreaterThan(days * 0.6);
  });

  it("has no line for a day with nothing in it", () => {
    expect(traceFor("2026-08-20", 0)).toEqual([]);
  });
});

describe("tracePath", () => {
  it("writes a path that starts with a move and continues with lines", () => {
    const d = tracePath(traceFor("2026-08-20", 6000), 100, 8);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("L");
  });

  it("keeps the line inside the padding it was given", () => {
    const d = tracePath(traceFor("2026-08-20", 9000), 100, 10);
    for (const n of d.match(/-?\d+\.\d+/g) ?? []) {
      expect(Number(n)).toBeGreaterThanOrEqual(10);
      expect(Number(n)).toBeLessThanOrEqual(90);
    }
  });

  it("writes nothing for a day with no line", () => {
    expect(tracePath([], 100, 8)).toBe("");
  });
});
