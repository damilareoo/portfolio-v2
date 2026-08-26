import { describe, expect, it } from "vitest";
import { COLUMN_CELLS, COLUMNS_WIDE, DRIFT, bucketShots } from "./shots-layout";

/** The real feed: ten landscape captures, all the same shape. */
const shots = Array.from({ length: 10 }, (_, i) => ({ id: i, width: 1400, height: 1000 }));

describe("bucketShots", () => {
  it("counts a column's height in the same unit as its drift", () => {
    // The bug this guards: a drift in cells against a bare aspect ratio. One
    // shot has to outweigh a six-cell drift, or column one swallows the feed.
    expect(COLUMN_CELLS * (1000 / 1400)).toBeGreaterThan(Math.max(...DRIFT));
  });

  it("spreads the feed across every column", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    // Ten identical shots deal out in the drift's own order — the two columns
    // that start lowest (0 and 1 cells) take the odd ones, not the two that
    // start pushed down four and six. The point of the assertion is that no
    // column is empty; the exact split is the drift showing through.
    expect(buckets.map((b) => b.length)).toEqual([3, 2, 3, 2]);
    expect(buckets.every((b) => b.length > 0)).toBe(true);
  });

  it("keeps every shot exactly once, in order down each column", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    expect(buckets.flat().map((s) => s.id).sort((a, b) => a - b)).toEqual(shots.map((s) => s.id));
    for (const bucket of buckets) {
      expect(bucket.map((s) => s.id)).toEqual([...bucket.map((s) => s.id)].sort((a, b) => a - b));
    }
  });

  it("staggers the tops by the drift and still lands the bottoms level", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    const ends = buckets.map(
      (b, c) => DRIFT[c] + b.reduce((h, s) => h + COLUMN_CELLS * (s.height / s.width), 0),
    );
    // Level enough that no column runs a whole shot longer than another.
    const shot = COLUMN_CELLS * (1000 / 1400);
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThan(shot);
  });

  it("fills two columns as readily as four", () => {
    const buckets = bucketShots(shots, 2);
    expect(buckets.map((b) => b.length)).toEqual([5, 5]);
  });

  it("gives a taller shot more weight than a wide one", () => {
    const mixed = [
      { id: 0, width: 1000, height: 2000 },
      { id: 1, width: 1000, height: 400 },
      { id: 2, width: 1000, height: 400 },
    ];
    // The portrait fills column one; the two short ones do not have to stack.
    const buckets = bucketShots(mixed, 2);
    expect(buckets[0].map((s) => s.id)).toEqual([0]);
    expect(buckets[1].map((s) => s.id)).toEqual([1, 2]);
  });
});
