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

/**
 * The same time, as digits — `HH:MM`, 24-hour, in the same zone the hands read.
 *
 * The card under the face needs a *reading*, and an em dash there means "this
 * instrument cannot read". A clock whose hands are visibly ticking beside a
 * dash is that sentence contradicting itself. Formatted the way
 * `components/live-clock.tsx` formats it, minus the seconds: a value that
 * changes every second in a label row is a thing that moves for no reason
 * anybody can use.
 */
export function clockReading(at: Date, timeZone: string = DEFAULT_ZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

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
