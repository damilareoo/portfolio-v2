import { describe, expect, it } from "vitest";
import { frameRatio } from "./frame-ratio";

describe("the frame ratio", () => {
  it("reads a declared slot ratio", () => {
    expect(frameRatio("16 / 9")).toBeCloseTo(16 / 9, 6);
    expect(frameRatio("4 / 3")).toBeCloseTo(4 / 3, 6);
  });

  it("reads the intrinsic size real art carries", () => {
    // The measured offender: 1400x1000 rendered 1240x886 against a 789px
    // viewport, so the whole frame was never on screen at once.
    expect(frameRatio("1400 / 1000")).toBeCloseTo(1.4, 6);
    // A portrait phone capture. Its cap is reached far sooner, which is the
    // point — this is the shape that overflows first.
    expect(frameRatio("430 / 932")).toBeCloseTo(430 / 932, 6);
  });

  it("survives whitespace, because the strings are hand-written", () => {
    expect(frameRatio("16/9")).toBeCloseTo(16 / 9, 6);
    expect(frameRatio("  16  /  9  ")).toBeCloseTo(16 / 9, 6);
  });

  it("refuses anything it cannot turn into a width, rather than guessing", () => {
    // A fallback would size every frame on the page wrongly and silently.
    for (const bad of ["", "16", "16 / 0", "0 / 9", "auto", "16 / abc", "-16 / 9"]) {
      expect(frameRatio(bad), bad).toBeNull();
    }
  });

  it("turns a height budget into the width that reaches it", () => {
    // What `.frame-cap` computes: max-width = cap * ratio. At 78% of a 789px
    // viewport the budget is 615px, so a 1.4 frame may be 861px wide — the
    // number that replaced 1240.
    const budget = 789 * 0.78;
    expect(budget * frameRatio("1400 / 1000")!).toBeCloseTo(861.6, 0);
    expect(budget / 1).toBeLessThan(789);
  });
});
