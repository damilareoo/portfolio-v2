// lib/clock.test.ts
import { describe, expect, it } from "vitest";
import { handAngles } from "./clock";

/** Lagos is UTC+1 and does not observe daylight saving, so these are exact. */
const lagos = (iso: string) => new Date(iso);

describe("handAngles", () => {
  it("stands both hands at twelve", () => {
    const { hour, minute } = handAngles(lagos("2026-09-02T11:00:00Z")); // 12:00 WAT
    expect(hour).toBeCloseTo(0, 5);
    expect(minute).toBeCloseTo(0, 5);
  });

  it("puts three o'clock at a quarter turn", () => {
    const { hour, minute } = handAngles(lagos("2026-09-02T14:00:00Z")); // 15:00 WAT
    expect(hour).toBeCloseTo(90, 5);
    expect(minute).toBeCloseTo(0, 5);
  });

  it("carries the hour hand between the numerals", () => {
    // Half past six is the hour hand halfway to seven, not pointing at six.
    const { hour, minute } = handAngles(lagos("2026-09-02T17:30:00Z")); // 18:30 WAT
    expect(hour).toBeCloseTo(195, 5);
    expect(minute).toBeCloseTo(180, 5);
  });

  it("sweeps the minute hand with the seconds", () => {
    const { minute } = handAngles(lagos("2026-09-02T11:00:30Z")); // 12:00:30 WAT
    expect(minute).toBeCloseTo(3, 5);
  });

  it("reads the zone it was given, not the machine's", () => {
    const at = lagos("2026-09-02T11:00:00Z");
    expect(handAngles(at, "Africa/Lagos").hour).not.toBeCloseTo(
      handAngles(at, "Asia/Tokyo").hour,
      1,
    );
  });

  it("keeps every angle inside one turn", () => {
    for (let minutes = 0; minutes < 24 * 60; minutes += 7) {
      const at = new Date(Date.UTC(2026, 8, 2, 0, minutes, 0));
      const { hour, minute } = handAngles(at);
      for (const angle of [hour, minute]) {
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    }
  });
});
