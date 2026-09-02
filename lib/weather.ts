// lib/weather.ts

/**
 * Lagos weather, reduced to the six shapes the dot matrix can actually draw.
 *
 * WMO 4677 has around forty codes. A 25-cell disc can tell six of them apart,
 * and pretending otherwise would mean drawing "light drizzle" and "moderate
 * drizzle" as the same picture while claiming they are different readings.
 */
export const CONDITIONS = ["clear", "partly", "cloudy", "rain", "storm", "haze"] as const;

export type Condition = (typeof CONDITIONS)[number];

export function conditionFor(code: number): Condition | null {
  if (!Number.isInteger(code)) return null;
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "haze";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95 && code <= 99) return "storm";
  /* Snow (71–77) and everything unrecognised fall through. Lagos has never
     recorded snow, and the honest answer to a reading we have no glyph for is
     that we have no reading — not the nearest shape that happens to exist. */
  return null;
}

export function forecastUrl(latitude: number, longitude: number): string {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    timezone: "Africa/Lagos",
  });
  return `https://api.open-meteo.com/v1/forecast?${query}`;
}

export type Reading = { temperature: number; condition: Condition };

/**
 * Parsed defensively, because this is the one place the site trusts something
 * it did not author. Anything unexpected is no reading at all, which the face
 * already knows how to say.
 */
export function readForecast(payload: unknown): Reading | null {
  if (typeof payload !== "object" || payload === null) return null;
  const current = (payload as { current?: unknown }).current;
  if (typeof current !== "object" || current === null) return null;
  const { temperature_2m: temperature, weather_code: code } = current as {
    temperature_2m?: unknown;
    weather_code?: unknown;
  };
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) return null;
  if (typeof code !== "number") return null;
  const condition = conditionFor(code);
  return condition ? { temperature, condition } : null;
}
