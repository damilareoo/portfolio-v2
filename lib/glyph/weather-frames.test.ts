// lib/glyph/weather-frames.test.ts
import { describe, expect, it } from "vitest";
import { WEATHER_FACES, weatherFrame } from "./weather-frames";

const GRID = 25;

describe("weatherFrame", () => {
  it("fills the grid it was asked for", () => {
    for (const face of WEATHER_FACES) {
      expect(weatherFrame(face, GRID).length, face).toBe(GRID * GRID);
    }
  });

  it("stays inside the frame contract of 0 to 1", () => {
    for (const face of WEATHER_FACES) {
      for (const value of weatherFrame(face, GRID)) {
        expect(value, face).toBeGreaterThanOrEqual(0);
        expect(value, face).toBeLessThanOrEqual(1);
      }
    }
  });

  it("draws a reading, and never fills the disc", () => {
    /* Every face that reports weather has to put something on the field, and
       none of them may cover it — a full disc is not a reading, it is a lamp.
       `unreported` is deliberately not in this: it is the one face that reports
       nothing, and it draws nothing. See the frame itself. */
    for (const face of WEATHER_FACES) {
      if (face === "unreported") continue;
      const lit = [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
      expect(lit, face).toBeGreaterThan(GRID);
      expect(lit, face).toBeLessThan(GRID * GRID);
    }
  });

  it("leaves the field empty when there is nothing to report", () => {
    /* The resting state, which is what most visitors see, and the rule all four
       bays now keep: an instrument with nothing to say shows its own field and
       nothing on it. The lattice is what says it is working; a mark would be a
       second answer to a question already answered. */
    expect([...weatherFrame("unreported", GRID)].every((v) => v === 0)).toBe(true);
  });

  it("tells every face apart from every other", () => {
    // Two readings that draw the same picture are one reading with two names.
    const seen = new Map<string, string>();
    for (const face of WEATHER_FACES) {
      const key = [...weatherFrame(face, GRID)].map((v) => (v > 0 ? 1 : 0)).join("");
      expect(seen.has(key), `${face} draws the same as ${seen.get(key)}`).toBe(false);
      seen.set(key, face);
    }
  });

  it("cannot be mistaken for a reading", () => {
    // Not knowing must not look like weather, at any grid.
    const count = (face: (typeof WEATHER_FACES)[number]) =>
      [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
    for (const face of WEATHER_FACES) {
      if (face !== "unreported") expect(count(face)).toBeGreaterThan(0);
    }
  });

  it("scales to any grid the disc is given", () => {
    for (const grid of [15, 21, 25, 31]) {
      expect(weatherFrame("rain", grid).length).toBe(grid * grid);
      expect([...weatherFrame("rain", grid)].some((v) => v > 0)).toBe(true);
    }
  });
});
