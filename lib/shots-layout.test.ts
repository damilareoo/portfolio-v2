import { describe, expect, it } from "vitest";
import { COLUMN_CELLS, COLUMNS_NARROW, COLUMNS_WIDE, DRIFT, bucketShots } from "./shots-layout";

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

  it("still spreads a feed of thirty", () => {
    // Ten is what the feed holds; thirty is what it is being built for. The
    // drift is a fixed head start, so its influence only shrinks as shots
    // arrive — the columns should come out level to within one shot.
    const thirty = Array.from({ length: 30 }, (_, i) => ({ id: i, width: 1400, height: 1000 }));
    const buckets = bucketShots(thirty, COLUMNS_WIDE);
    expect(buckets.map((b) => b.length)).toEqual([8, 7, 8, 7]);
    expect(bucketShots(thirty, COLUMNS_NARROW).map((b) => b.length)).toEqual([15, 15]);
  });

  it("bounds the ragged bottom by the tallest shot, at any count", () => {
    /* The guarantee shortest-first gives, and the only one it gives: a column
       takes a shot only while it is the shortest, so it can end at most one
       shot taller than the shortest column. Mixing a portrait into a feed of
       landscapes therefore buys a taller ragged edge, not an unbounded one —
       which is the honest thing to say about a heuristic. */
    const shapes = [
      { width: 1400, height: 1000 },
      { width: 1920, height: 1080 },
      { width: 1000, height: 1400 },
      { width: 1080, height: 1920 },
    ];
    const feed = Array.from({ length: 30 }, (_, i) => ({ id: i, ...shapes[(i * 7) % 4] }));
    const cells = (s: { width: number; height: number }) => COLUMN_CELLS * (s.height / s.width);
    const tallest = Math.max(...feed.map(cells));

    for (const columns of [COLUMNS_NARROW, COLUMNS_WIDE]) {
      for (let n = 1; n <= feed.length; n++) {
        const buckets = bucketShots(feed.slice(0, n), columns);
        const ends = buckets.map((b, c) => DRIFT[c] + b.reduce((h, s) => h + cells(s), 0));
        expect(Math.max(...ends) - Math.min(...ends)).toBeLessThanOrEqual(tallest);
      }
    }
  });
});
