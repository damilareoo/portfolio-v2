import { describe, expect, it } from "vitest";
import { groupDigits, numberFrame, walkFrame, weekMarks } from "./steps-frames";

const GRID = 25;

describe("groupDigits", () => {
  it("groups thousands with a comma", () => {
    expect(groupDigits(5391)).toBe("5,391");
    expect(groupDigits(987)).toBe("987");
    expect(groupDigits(0)).toBe("0");
    expect(groupDigits(1234567)).toBe("1,234,567");
  });
});

describe("numberFrame", () => {
  it("lights cells for a value", () => {
    const frame = numberFrame(GRID, 5391);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("centres the number horizontally", () => {
    const frame = numberFrame(GRID, 8);
    const lit: number[] = [];
    for (let i = 0; i < frame.length; i++) if (frame[i] > 0) lit.push(i % GRID);
    const left = Math.min(...lit);
    const right = Math.max(...lit);
    expect(Math.abs(left - (GRID - 1 - right))).toBeLessThanOrEqual(1);
  });
});

describe("walkFrame", () => {
  it("puts the walker at the left edge at zero progress", () => {
    const frame = walkFrame(GRID, 0);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("moves the walker rightward as progress grows", () => {
    const centroid = (progress: number) => {
      const frame = walkFrame(GRID, progress);
      let sum = 0;
      let weight = 0;
      for (let i = 0; i < frame.length; i++) {
        sum += (i % GRID) * frame[i];
        weight += frame[i];
      }
      return sum / weight;
    };
    expect(centroid(1)).toBeGreaterThan(centroid(0.5));
    expect(centroid(0.5)).toBeGreaterThan(centroid(0));
  });

  it("clamps beyond the goal rather than walking off the grid", () => {
    const frame = walkFrame(GRID, 3);
    for (let i = 0; i < frame.length; i++) expect(frame[i]).toBeLessThanOrEqual(1);
    expect(frame.some((v) => v > 0)).toBe(true);
  });
});

describe("weekMarks", () => {
  const week = (steps: number[]) =>
    steps.map((s, i) => ({ date: `2026-08-1${i}`, steps: s }));

  it("returns one column per day given", () => {
    expect(weekMarks(week([1, 2, 3, 4, 5, 6, 7]), 10)).toHaveLength(7);
  });

  it("marks a day under goal as hollow and a day at goal as filled", () => {
    const [under, met] = weekMarks(week([4000, 10000]), 10000);
    expect(under.some((m) => m.hollow)).toBe(true);
    expect(met.every((m) => !m.hollow)).toBe(true);
  });

  it("gives a bigger day more lit cells than a smaller one", () => {
    const [small, big] = weekMarks(week([2000, 9000]), 10000);
    const lit = (col: { value: number }[]) => col.filter((m) => m.value > 0).length;
    expect(lit(big)).toBeGreaterThan(lit(small));
  });

  it("handles a zero day without producing NaN", () => {
    const [zero] = weekMarks(week([0]), 10000);
    for (const mark of zero) expect(Number.isFinite(mark.value)).toBe(true);
  });
});

/* The rest is mine. The helper above only ever passes plain numbers, and the
   one fact the whole steps path was corrected to preserve is that a day nobody
   reported is not a day of no walking. If these pass while a null renders as a
   zero column, the correction has been quietly undone. */
describe("weekMarks on days nobody reported", () => {
  const goal = 10000;
  const day = (steps: number | null) => ({ date: "2026-08-18", steps });

  it("renders an unreported day as placeholder dots, not as a missed day", () => {
    const [column] = weekMarks([day(null)], goal);
    // Every cell carries the same faint value: a field at rest, saying nothing.
    expect(column.every((m) => m.value > 0 && m.value < 0.5)).toBe(true);
    expect(new Set(column.map((m) => m.value)).size).toBe(1);
    // And filled, because a hollow ring is this card's word for a missed day.
    expect(column.every((m) => !m.hollow)).toBe(true);
  });

  it("keeps an unreported day distinguishable from a walked zero", () => {
    const [nothing, zero] = weekMarks([day(null), day(0)], goal);
    expect(zero.every((m) => m.hollow)).toBe(true);
    expect(nothing.every((m) => !m.hollow)).toBe(true);
    // The zero day is a real reading of a real day, and reads as empty.
    expect(zero.every((m) => m.value === 0)).toBe(true);
    expect(nothing.every((m) => m.value > 0)).toBe(true);
  });

  it("carries a mixed week without letting one null infect its neighbours", () => {
    const columns = weekMarks([day(4000), day(null), day(10000)], goal);
    expect(columns).toHaveLength(3);
    expect(columns[0].some((m) => m.hollow && m.value > 0)).toBe(true);
    expect(columns[1].every((m) => !m.hollow)).toBe(true);
    expect(columns[2].every((m) => !m.hollow && m.value === 1)).toBe(true);
  });

  it("never divides by a goal of zero", () => {
    for (const mark of weekMarks([day(5000)], 0).flat()) {
      expect(Number.isFinite(mark.value)).toBe(true);
    }
  });
});
