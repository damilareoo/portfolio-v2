import { describe, expect, it } from "vitest";
import { COLUMN_CELLS, COLUMNS_WIDE, DRIFT, bucketShots } from "./shots-layout";

const shots = Array.from({ length: 10 }, (_, id) => ({ id, width: 1400, height: 1000 }));

describe("bucketShots", () => {
  it("measures shot height in the same cells as the column drift", () => {
    expect(COLUMN_CELLS * (1000 / 1400)).toBeGreaterThan(Math.max(...DRIFT));
  });

  it("spreads ten landscape shots across all four columns", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    expect(buckets.map((bucket) => bucket.length)).toEqual([3, 2, 3, 2]);
    expect(buckets.every((bucket) => bucket.length > 0)).toBe(true);
  });

  it("places every shot exactly once without reordering within a column", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    expect(buckets.flat().map((shot) => shot.id).sort((a, b) => a - b)).toEqual(
      shots.map((shot) => shot.id),
    );
    for (const bucket of buckets) {
      expect(bucket.map((shot) => shot.id)).toEqual([...bucket.map((shot) => shot.id)].sort((a, b) => a - b));
    }
  });

  it("keeps column ends within one landscape shot", () => {
    const buckets = bucketShots(shots, COLUMNS_WIDE);
    const ends = buckets.map(
      (bucket, column) =>
        DRIFT[column] +
        bucket.reduce((height, shot) => height + COLUMN_CELLS * (shot.height / shot.width), 0),
    );
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThan(COLUMN_CELLS * (1000 / 1400));
  });
});
