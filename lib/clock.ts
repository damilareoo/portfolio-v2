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
 *
 * All three hands come back, including the one the face used to do without.
 * The seconds were folded into the minute hand and nowhere else, so the face
 * carried the time correctly and never looked like it was keeping it: a clock
 * you have to watch for half a minute to see move is a picture of a clock.
 */
export type Hands = { hour: number; minute: number; second: number };

const DEFAULT_ZONE = "Africa/Lagos";

/**
 * The same time, as digits — `HH:MM:SS`, 24-hour, in the same zone the hands
 * read.
 *
 * The card under the face needs a *reading*, and an em dash there means "this
 * instrument cannot read". A clock whose hands are visibly ticking beside a
 * dash is that sentence contradicting itself.
 *
 * The seconds are in the label, and they were not. The argument against them
 * was that a value changing every second in a label row is a thing that moves
 * for no reason anybody can use — which was sound while the face beside it
 * moved once a minute, and stopped being sound the moment the face grew a
 * second hand. The two now say the same thing at the same rate: a reading that
 * turned over on the minute beside a hand sweeping every second would be the
 * same contradiction the dash was, told in digits. This is the one row on the
 * site that is allowed to move, and Law 4 admits it for the same reason it
 * admits the hand — it reports live external state, and nothing else.
 */
export function clockReading(at: Date, timeZone: string = DEFAULT_ZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  const seconds = part("second");
  const minutes = part("minute") + seconds / 60;

  return {
    hour: ((hours + minutes / 60) * 30) % 360,
    minute: (minutes * 6) % 360,
    /* Whole seconds, so the hand steps the way a quartz hand steps rather than
       sweeping. `Intl` has no sub-second field to offer anyway, and a hand
       interpolated between two readings would be this module inventing a
       precision the reading it was given does not have. */
    second: (seconds * 6) % 360,
  };
}

/**
 * Runs `tick` now, and again on every second boundary until it is stopped.
 *
 * `setInterval(…, 1000)` is what this replaces, and it was wrong twice over. It
 * has no phase: started at .4 of a second it fires at .4 forever, so a face and
 * a readout both showing seconds show them changing four tenths of a second
 * after the second they name. And it drifts — a timer the browser was late to
 * service never gets that lateness back, so the error only ever grows, in one
 * direction, for as long as the tab is open.
 *
 * Scheduling one timeout at a time to the *next* boundary fixes both. Each
 * wait is measured from the clock rather than counted from the last one, so a
 * frame the browser slept through costs one late tick and nothing after it,
 * and a tab that was backgrounded for an hour comes back in phase.
 *
 * The wait is never zero: at exactly a boundary the next one is a full second
 * away, which is what stops a tick that lands early from firing twice for the
 * same second.
 *
 * Returns the stop. Callers are effects, and an effect that cannot be undone
 * is a leak.
 */
export function everySecond(tick: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const schedule = () => {
    timer = setTimeout(
      () => {
        if (stopped) return;
        tick();
        schedule();
      },
      1000 - (Date.now() % 1000),
    );
  };

  tick();
  schedule();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
