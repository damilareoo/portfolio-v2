import { describe, expect, it } from "vitest";
import { feedAssets } from "@/data/assets.generated";
import {
  PAIR_DRIFT,
  PAIR_NARROW,
  PAIR_WIDE,
  TRACKS,
  composeShots,
  slotCells,
  trackClass,
} from "./shots-layout";

const shots = Array.from({ length: 10 }, (_, id) => ({ id }));

describe("composeShots", () => {
  it("alternates a full-measure run with a run of two", () => {
    const spans = composeShots(shots).map(({ place }) => place.span);
    expect(spans).toEqual([12, 7, 5, 12, 5, 7, 12, 7, 5, 12]);
  });

  it("gives every run of two the whole measure and no more", () => {
    for (const { place } of composeShots(shots)) {
      expect(place.start + place.span - 1).toBeLessThanOrEqual(TRACKS);
      expect(place.start).toBeGreaterThanOrEqual(1);
    }
  });

  it("places every shot exactly once, in the order the feed gave them", () => {
    const placed = composeShots(shots);
    expect(placed.map(({ shot }) => shot.id)).toEqual(shots.map((shot) => shot.id));
  });

  it("composes the same page twice", () => {
    expect(composeShots(feedAssets)).toEqual(composeShots(feedAssets));
  });

  it("drifts the narrow half of a run and never the wide one", () => {
    for (const { place } of composeShots(shots)) {
      if (place.span !== PAIR_NARROW) expect(place.drift).toBe(0);
    }
    const drifted = composeShots(shots).filter(({ place }) => place.drift > 0);
    expect(drifted.length).toBe(3);
    expect(drifted.map(({ place }) => place.drift)).toEqual(PAIR_DRIFT);
  });

  /* The bug this replaces: the first version compared a drift measured in
     matrix cells against a bare aspect ratio, so the first column read as
     permanently shortest and swallowed the feed. The unit mismatch is the
     defect, not the column count, and it survives any packing — so the test
     survives the packing going away. A drift that exceeded the frame it moves
     would push that frame clear of its partner and the run would stop being a
     run. Measured against the real feed's widest shot, which makes the
     shortest frame the narrow slot can ever hold, at the narrowest width a run
     is drawn. */
  it("never drifts a frame further than the frame is tall", () => {
    const widest = Math.max(...feedAssets.map((shot) => shot.width / shot.height));
    expect(Math.max(...PAIR_DRIFT)).toBeLessThan(slotCells(PAIR_NARROW, widest));
  });

  /* The drift stays inside its run for the feed as it actually stands: every
     narrow frame's foot lands at or above its partner's. That is a property of
     these ten shots rather than of any feed, so it is asserted here and not in
     the invariant above — a future shot with an unusual ratio may break it
     without breaking the layout. */
  it("keeps the two frames of a run overlapping for the feed as it stands", () => {
    const placed = composeShots(feedAssets);
    for (let i = 0; i < placed.length - 1; i++) {
      const [a, b] = [placed[i], placed[i + 1]];
      if (a.place.span + b.place.span !== TRACKS) continue;
      const [wide, narrow] = a.place.span === PAIR_WIDE ? [a, b] : [b, a];
      const foot = (entry: typeof a) =>
        entry.place.drift + slotCells(entry.place.span, entry.shot.width / entry.shot.height);
      expect(foot(narrow)).toBeLessThanOrEqual(foot(wide));
    }
  });

  it("hands every placement a track class the stylesheet actually carries", () => {
    for (const { place } of composeShots(feedAssets)) {
      expect(trackClass(place)).not.toBe("");
    }
  });

  it("gives a lone trailing shot the full measure rather than half a run", () => {
    const spans = composeShots(shots.slice(0, 2)).map(({ place }) => place.span);
    expect(spans).toEqual([12, 12]);
  });
});
