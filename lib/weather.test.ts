// lib/weather.test.ts
import { describe, expect, it } from "vitest";
import { CONDITIONS, conditionFor, forecastUrl, readForecast } from "./weather";

describe("conditionFor", () => {
  it("maps the codes Lagos actually produces", () => {
    expect(conditionFor(0)).toBe("clear");
    expect(conditionFor(1)).toBe("partly");
    expect(conditionFor(2)).toBe("partly");
    expect(conditionFor(3)).toBe("cloudy");
    expect(conditionFor(45)).toBe("haze");
    expect(conditionFor(61)).toBe("rain");
    expect(conditionFor(81)).toBe("rain");
    expect(conditionFor(95)).toBe("storm");
  });

  it("returns only conditions the matrix can draw", () => {
    for (let code = 0; code <= 99; code++) {
      const condition = conditionFor(code);
      if (condition !== null) expect(CONDITIONS, String(code)).toContain(condition);
    }
  });

  it("refuses a code it cannot draw rather than guessing a near one", () => {
    // Snow. Lagos has never recorded it, and the honest answer to a reading we
    // have no glyph for is that we have no reading — not the nearest shape.
    expect(conditionFor(73)).toBeNull();
    expect(conditionFor(-1)).toBeNull();
    expect(conditionFor(999)).toBeNull();
  });
});

describe("forecastUrl", () => {
  it("asks Open-Meteo for exactly the two values the faces render", () => {
    const url = new URL(forecastUrl(6.5244, 3.3792));
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("current")).toBe("temperature_2m,weather_code");
    expect(url.searchParams.get("latitude")).toBe("6.5244");
    expect(url.searchParams.get("longitude")).toBe("3.3792");
  });
});

describe("readForecast", () => {
  it("reads a well-formed current block", () => {
    expect(
      readForecast({ current: { temperature_2m: 29.4, weather_code: 2 } }),
    ).toEqual({ temperature: 29.4, condition: "partly" });
  });

  it("returns null for anything it cannot trust", () => {
    // An instrument that invents a reading is worse than one that admits it has
    // none, so every one of these renders the unreported face.
    expect(readForecast(null)).toBeNull();
    expect(readForecast({})).toBeNull();
    expect(readForecast({ current: {} })).toBeNull();
    expect(readForecast({ current: { temperature_2m: "warm", weather_code: 2 } })).toBeNull();
    expect(readForecast({ current: { temperature_2m: 29, weather_code: 73 } })).toBeNull();
    expect(readForecast("service unavailable")).toBeNull();
  });
});
