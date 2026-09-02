// lib/clock.ts

/**
 * Where an analogue face's hands point, in degrees clockwise from twelve.
 *
 * Degrees rather than radians because the consumer is an SVG `rotate`, and a
 * component that has to convert is a component that can convert wrongly.
 *
 * The zone is read through Intl rather than by adding an offset: Lagos does not
 * observe daylight saving today, and an offset hard-coded on that basis is a
 * bug waiting for a law to change.
 */
export type Hands = { hour: number; minute: number };

const DEFAULT_ZONE = "Africa/Lagos";

export function handAngles(at: Date, timeZone: string = DEFAULT_ZONE): Hands {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const part = (type: "hour" | "minute" | "second") =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  /* en-GB with hour12:false is h23, so midnight comes back as "00" — the % 12
     is here for the other end of the dial, where 13 through 23 have to come
     down to a twelve-hour face. */
  const hours = part("hour") % 12;
  const minutes = part("minute") + part("second") / 60;

  return {
    hour: ((hours + minutes / 60) * 30) % 360,
    minute: (minutes * 6) % 360,
  };
}
