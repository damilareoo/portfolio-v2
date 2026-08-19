import { describe, expect, it } from "vitest";
import { fingerprint, pulsePhase, pulsesBetween } from "./pulse";

describe("pulsePhase", () => {
  it("is 0 at the start of a period and 0.5 at its middle", () => {
    expect(pulsePhase(0, 2000)).toBe(0);
    expect(pulsePhase(1000, 2000)).toBe(0.5);
  });

  it("wraps, so the same position always gives the same phase", () => {
    expect(pulsePhase(2000, 2000)).toBe(pulsePhase(0, 2000));
    expect(pulsePhase(5000, 2000)).toBeCloseTo(pulsePhase(1000, 2000));
  });
});

describe("pulsesBetween", () => {
  it("counts no pulse within one period", () => {
    expect(pulsesBetween(0, 1999, 2000)).toBe(0);
  });

  it("counts each period boundary crossed", () => {
    expect(pulsesBetween(0, 2000, 2000)).toBe(1);
    expect(pulsesBetween(1999, 6001, 2000)).toBe(3);
  });

  it("counts nothing when position goes backwards on a seek", () => {
    expect(pulsesBetween(6000, 1000, 2000)).toBe(0);
  });
});

describe("fingerprint", () => {
  it("puts the centre of an evenly lit frame at the middle", () => {
    const frame = new Float32Array(16).fill(1);
    const { centre, density } = fingerprint(frame);
    expect(centre[0]).toBeCloseTo(1.5);
    expect(centre[1]).toBeCloseTo(1.5);
    expect(density).toBeCloseTo(1);
  });

  it("pulls the centre toward the lit corner", () => {
    const frame = new Float32Array(16);
    frame[0] = 1;
    const { centre } = fingerprint(frame);
    expect(centre).toEqual([0, 0]);
  });

  it("reports zero density for a dark frame without dividing by zero", () => {
    expect(fingerprint(new Float32Array(16)).density).toBe(0);
  });
});
