import { describe, expect, it } from "vitest";
import { STEP_CEILING, averageOf, isPlausible, lastNDates, stepsKey } from "./steps";

describe("stepsKey", () => {
  it("namespaces by date", () => {
    expect(stepsKey("2026-08-18")).toBe("steps:2026-08-18");
  });
});

describe("isPlausible", () => {
  it("rejects negatives and non-finite values", () => {
    expect(isPlausible(null, -1)).toBe(false);
    expect(isPlausible(null, Number.NaN)).toBe(false);
    expect(isPlausible(null, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects values above the daily ceiling", () => {
    expect(isPlausible(null, STEP_CEILING + 1)).toBe(false);
    expect(isPlausible(null, STEP_CEILING)).toBe(true);
  });

  it("rejects a same-day regression, since steps only accumulate", () => {
    expect(isPlausible(5000, 4999)).toBe(false);
    expect(isPlausible(5000, 5000)).toBe(true);
    expect(isPlausible(5000, 5001)).toBe(true);
  });

  it("accepts any plausible value when there is no prior reading", () => {
    expect(isPlausible(null, 0)).toBe(true);
    expect(isPlausible(null, 5000)).toBe(true);
  });
});

describe("averageOf", () => {
  it("returns 0 for no days rather than dividing by zero", () => {
    expect(averageOf([])).toBe(0);
  });

  it("averages over every day given, including zeroes", () => {
    expect(averageOf([
      { date: "2026-08-17", steps: 1000 },
      { date: "2026-08-18", steps: 0 },
    ])).toBe(500);
  });

  it("rounds to a whole step", () => {
    expect(averageOf([
      { date: "2026-08-16", steps: 1 },
      { date: "2026-08-17", steps: 1 },
      { date: "2026-08-18", steps: 2 },
    ])).toBe(1);
  });
});

describe("lastNDates", () => {
  it("returns n dates ending today, oldest first", () => {
    expect(lastNDates(new Date("2026-08-18T12:00:00Z"), 3))
      .toEqual(["2026-08-16", "2026-08-17", "2026-08-18"]);
  });

  it("crosses a month boundary", () => {
    expect(lastNDates(new Date("2026-09-01T12:00:00Z"), 2))
      .toEqual(["2026-08-31", "2026-09-01"]);
  });
});
