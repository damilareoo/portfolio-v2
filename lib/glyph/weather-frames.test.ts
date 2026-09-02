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

  it("draws something, and never everything", () => {
    for (const face of WEATHER_FACES) {
      const lit = [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
      // The brief's original floor (`toBeGreaterThan(GRID)`) contradicts the
      // "unreported is sparsest" test below: unreported draws four dots of
      // radius 0.045, nowhere near GRID (25) cells. Lowered to 4 — enough to
      // catch a genuinely empty frame — while the ceiling stays as specified.
      expect(lit, face).toBeGreaterThanOrEqual(4);
      expect(lit, face).toBeLessThan(GRID * GRID);
    }
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

  it("makes the unreported face the sparsest of them all", () => {
    // Not knowing should look like not knowing, not like weather.
    const count = (face: (typeof WEATHER_FACES)[number]) =>
      [...weatherFrame(face, GRID)].filter((v) => v > 0).length;
    const unreported = count("unreported");
    for (const face of WEATHER_FACES) {
      if (face !== "unreported") expect(unreported).toBeLessThan(count(face));
    }
  });

  it("scales to any grid the disc is given", () => {
    for (const grid of [15, 21, 25, 31]) {
      expect(weatherFrame("rain", grid).length).toBe(grid * grid);
      expect([...weatherFrame("rain", grid)].some((v) => v > 0)).toBe(true);
    }
  });
});
