// lib/clock.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clockReading, everySecond, handAngles } from "./clock";

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
      const { hour, minute, second } = handAngles(at);
      for (const angle of [hour, minute, second]) {
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    }
  });

  /* The defect this pair is written against: the seconds were computed, folded
     into the minute hand, and then thrown away. A face cannot draw a hand it
     was never given. */
  it("stands the second hand at twelve on the minute", () => {
    expect(handAngles(lagos("2026-09-02T11:00:00Z")).second).toBeCloseTo(0, 5);
  });

  it("carries the second hand a sixth of a turn every ten seconds", () => {
    expect(handAngles(lagos("2026-09-02T11:00:10Z")).second).toBeCloseTo(60, 5);
    expect(handAngles(lagos("2026-09-02T11:00:30Z")).second).toBeCloseTo(180, 5);
    expect(handAngles(lagos("2026-09-02T11:00:45Z")).second).toBeCloseTo(270, 5);
  });

  it("steps the second hand rather than sweeping it", () => {
    // Whole seconds only: a hand interpolated between two readings would be a
    // precision this module was never handed.
    const a = handAngles(new Date(Date.UTC(2026, 8, 2, 11, 0, 12, 100))).second;
    const b = handAngles(new Date(Date.UTC(2026, 8, 2, 11, 0, 12, 900))).second;
    expect(a).toBe(b);
  });
});

describe("clockReading", () => {
  it("reads to the second, because the face beside it now does", () => {
    expect(clockReading(lagos("2026-09-02T11:00:07Z"))).toBe("12:00:07");
  });

  it("reads the zone it was given, not the machine's", () => {
    const at = lagos("2026-09-02T11:00:00Z");
    expect(clockReading(at, "Africa/Lagos")).not.toBe(clockReading(at, "Asia/Tokyo"));
  });
});

describe("everySecond", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("ticks once immediately, so nothing waits a second to be told", () => {
    const tick = vi.fn();
    const stop = everySecond(tick);
    expect(tick).toHaveBeenCalledTimes(1);
    stop();
  });

  it("lands on the second boundary rather than on the mount", () => {
    // Mounted 400ms into a second: an interval would fire at .4 forever.
    vi.setSystemTime(new Date("2026-09-02T11:00:00.400Z"));
    const at: number[] = [];
    const stop = everySecond(() => at.push(Date.now() % 1000));
    vi.advanceTimersByTime(5000);
    stop();
    expect(at[0]).toBe(400);
    expect(at.slice(1)).toEqual([0, 0, 0, 0, 0]);
  });

  it("does not double-tick when it is already on the boundary", () => {
    vi.setSystemTime(new Date("2026-09-02T11:00:00.000Z"));
    const tick = vi.fn();
    const stop = everySecond(tick);
    vi.advanceTimersByTime(999);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(tick).toHaveBeenCalledTimes(2);
    stop();
  });

  it("re-phases after a tick the browser was late to service", () => {
    // The drift an interval never gets back: one late tick, and the next one
    // is measured from the clock rather than counted from the last.
    vi.setSystemTime(new Date("2026-09-02T11:00:00.000Z"));
    const at: number[] = [];
    const stop = everySecond(() => at.push(Date.now() % 1000));
    vi.advanceTimersByTime(1000); // on time
    vi.setSystemTime(new Date("2026-09-02T11:00:02.250Z")); // slept through one
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);
    stop();
    expect(at.at(-1)).toBe(0);
  });

  it("stops when it is stopped", () => {
    const tick = vi.fn();
    everySecond(tick)();
    vi.advanceTimersByTime(10_000);
    expect(tick).toHaveBeenCalledTimes(1);
  });
});
