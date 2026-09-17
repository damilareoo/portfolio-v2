"use client";

/**
 * The pedometer, and nothing else.
 *
 * This file used to end in a bay: a flex row that stood the disc and the
 * pedometer side by side at their own sizes. The instruments now stand in the
 * wall — `components/instrument-wall.tsx` — where one card shape and one grid
 * hold all four readings, so the layout wrapper had nothing left to arrange
 * and went. What remains is the instrument itself, which the wall places.
 */

import { useEffect, useMemo, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { InstrumentReading } from "@/components/instrument-card";
import { emptyFrame } from "@/lib/glyph/glyphs";
import { groupDigits, recordFrame, walkFrame } from "@/lib/glyph/steps-frames";
import { useSeenOnce } from "@/lib/reveal";
import type { StepsDay, StepsReading } from "@/lib/steps";

const GRID = 25; // dots across
const SIZE = 300; // canvas units; CSS scales it

/** The walk, the record, the month — in that order, because that is their order. */
const FACES = ["the walk", "the record", "the month"] as const;

/**
 * Three faces, three dots, and no fourth page.
 *
 * There used to be one more: a face nothing pointed at, reachable by turning
 * past the week and advertised by nothing. It was defensible while the
 * pedometer was a curiosity in a corner. In a bank of four readings it is a
 * card lying about how many faces it has, so the count is now simply the
 * number of faces there are.
 */
const PAGES = FACES.length;

/** How wide the field is drawn inside the reading's face — a share of it, not
    a number of pixels. Short of the full width by enough to leave the page
    indicator a strip of its own beneath it, so the dots never sit on top of
    the face they are indexing.

    It was `CARD_FACE - 12` while the face was pinned at 96px. The face now
    takes whatever the cell gives it, so the same proportion is stated as one
    and the field grows with the face instead of being stranded inside it. */
const FIELD = "86%";

/* The calendar's geometry, in the SVG's own 100-unit box. Seven columns for the
   days of the week and six rows for the weeks a month can straddle, with the
   day letters ruled off along the bottom. The grid is fixed at six rows whether
   the month needs them or not, so the card does not change height as the months
   turn over. */
const COL_X = 10;
const COL_STEP = 13.3;
const ROW_Y = 12;
const ROW_STEP = 12.4;
const WEEK_ROWS = 6;
const DOT_R = 2.6;

/** Monday-first, as a calendar is read. */
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/* How each state is drawn. Size separates the two kinds of not-knowing; weight
   separates knowing-good from knowing-bad. Both hold on either skin because
   they ride `currentColor`, which the skin already inverts. */
const DAY_STYLE: Record<DayState, { scale: number; opacity: number }> = {
  met: { scale: 1, opacity: 1 },
  missed: { scale: 1, opacity: 1 },
  quiet: { scale: 1, opacity: 0.42 },
  ahead: { scale: 0.42, opacity: 0.3 },
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * A week of nothing, for the moment before the first read answers and for the
 * deployment that has no store to read. Seven unreported days is the honest
 * shape of "we do not know yet", and it renders as placeholder dots.
 */
const BLANK_WEEK: StepsDay[] = Array.from({ length: 7 }, () => ({ date: "", steps: null }));

function share(value: number | null, goal: number): string {
  if (value === null || goal <= 0) return "—";
  return `${Math.round((value / goal) * 100)}%`;
}

/** The weekday a stored date falls on, or the reference's fixed letters if we
    have no dates to go on — a blank week still has to be labelled something. */
function weekday(day: StepsDay | undefined, index: number): { letter: string; name: string } {
  const at = day?.date ? Date.parse(`${day.date}T00:00:00Z`) : Number.NaN;
  if (Number.isNaN(at)) return { letter: "MTWTFSS"[index], name: `Day ${index + 1}` };
  const weekdayIndex = new Date(at).getUTCDay();
  return { letter: WEEKDAYS[weekdayIndex][0], name: WEEKDAYS[weekdayIndex] };
}

/**
 * What a day is, on the calendar face.
 *
 * Four states, and each has to be told apart at a glance on either skin:
 *
 * - `met`     full ink. The goal was made.
 * - `missed`  the one hue on the site. The day ran out of hours without it.
 * - `quiet`   a mid-grey dot. The day happened; nobody reported it.
 * - `ahead`   a small faint dot. Not reached yet, and nothing to say about it.
 *
 * The last two are deliberately different marks. Both mean "unknown", but one
 * is a day that has gone by unrecorded and the other is a day that has not
 * happened — reading them as the same thing would flatten the month.
 */
type DayState = "met" | "missed" | "quiet" | "ahead";

function dayState(day: StepsDay, goal: number, today: string): DayState {
  if (day.date > today) return "ahead";
  if (day.steps === null || goal <= 0) return "quiet";
  if (day.steps >= goal) return "met";
  /* A day still being walked has not been missed. The goal can only be missed
     by a day that ran out of hours to meet it in, so today stays open until
     midnight — the same rule as "an unreported day is not a day of no walking",
     applied to the one day that is still happening. */
  return day.date === today ? "quiet" : "missed";
}

/** Which column a date sits in, Monday first. */
function columnOf(date: string): number {
  const at = Date.parse(`${date}T00:00:00Z`);
  return (new Date(at).getUTCDay() + 6) % 7;
}

/**
 * A label the dot alphabet cannot set, laid over the band the number left it.
 *
 * Sized off the scale's smallest step rather than off a literal. It was written
 * at 0.5rem for a card 144–176px wide, and it broke the first time the field
 * was drawn small: at the 84px the old bank gave it, "TOTAL TODAY" came to 53px
 * against a value of 19px in 72px of usable width — the label ended exactly
 * where the reading began, and the seven-day row overlapped by a pixel. Two
 * fixes, because either alone would have been a near miss: the names are now as
 * short as the reading they name, and `--text-2xs` is the floor every other
 * label already sits on, so this one is no longer the only type on the site
 * below the scale.
 *
 * Do not retune this against those numbers. They are the record of one failure,
 * not the measure to design to: the wall gives the field no fixed width at all
 * any more — roughly 93px on the narrowest phone up to about 215px at four-up
 * on a wide screen, and more again if the visitor turns the type dial. Both
 * names and both values are set in percentages of whatever that turns out to be
 * and are free to truncate, so the test is the small end, and the small end
 * moves with the viewport.
 */
function RecordLabel({ top, name, value }: { top: string; name: string; value: string }) {
  return (
    <div
      style={{ top }}
      className="absolute inset-x-0 flex items-baseline justify-between gap-1 px-[7%] text-2xs font-medium uppercase tracking-[0.06em] text-ink"
    >
      <span className="truncate">{name}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

/**
 * The pedometer, as three pages of one field.
 *
 * The walk carries the idea: a figure on a path, ground covered behind it at
 * full size and brightness, the road ahead small and dim, and the figure itself
 * stepping — its form comes off the distance it has covered, so it walks rather
 * than being slid. The record states the
 * numbers. The month lays out the month you are standing in and says, day by
 * day, which of the four things each one was — met, missed, quiet, ahead; see
 * `DayState`. There is no fourth page any more; see `PAGES`.
 *
 * It wears an `InstrumentReading` like every other reading on the site, and
 * the shell is what turns it: the press target is the whole reading rather
 * than the canvas, which is how even a small face can still offer a 44px
 * control. The pager itself — the page state, the three faces, the frames each
 * one builds — is untouched; only the surface the gesture lands on moved
 * outward by one element, because a focusable field nested inside a button is
 * not a thing HTML lets you build.
 *
 * Nothing here runs a loop of its own. Frames arrive as props, so the field
 * moves when a page is turned or a finger crosses it and is otherwise as still
 * as the rest of the page.
 */
export function Pedometer() {
  const [reading, setReading] = useState<StepsReading | null>(null);
  /* The face the visitor asked for, and null until they ask for one. See
     `opening` below for what is shown meanwhile, and why it is not simply 0. */
  const [turned, setTurned] = useState<number | null>(null);
  /* The walk starts when the instrument is seen, not when it mounts. The wall
     sits at the bottom of a page a visitor lands at the top of, so a walk keyed
     to the data arriving finished a second and a half after load, five thousand
     pixels below the fold — built, and never once watched. */
  const { ref: seenRef, seen } = useSeenOnce<HTMLDivElement>();


  /* The same thirty seconds the disc polls on. An unconfigured store, a failed
     fetch and a day nobody has reported are all the same answer here — nothing
     to say — and all three land as placeholder dots rather than as an error.

     Checked twice before it is believed, which is the pair the disc's own
     docblock claims both instruments make: the response has to have succeeded,
     and the body has to carry the one field that makes it a reading. `days` is
     that field. Only the second check was here, and it was not enough on its
     own — a 500 that still answers JSON is entitled to carry a `days` key, and
     an unchecked status would have drawn an outage as a week of real dots. */
  useEffect(() => {
    let cancelled = false;

    const read = () =>
      fetch("/api/steps")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: unknown) => {
          if (cancelled) return;
          const ok = Boolean(data) && typeof data === "object" && "days" in (data as object);
          setReading(ok ? (data as StepsReading) : null);
        })
        .catch(() => {
          if (!cancelled) setReading(null);
        });

    read();
    const id = setInterval(read, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const goal = reading?.goal ?? 0;
  const today = reading?.today ?? null;
  const days = reading?.days ?? BLANK_WEEK;
  /* `average7` reads 0 when nothing has ever been reported, which is the very
     ambiguity `today` was made nullable to avoid. The days say which it is. */
  const average = reading && days.some((day) => day.steps !== null) ? reading.average7 : null;

  /* Which face the instrument opens on: the first one that has anything on it.
     It used to open on the walk, always, and the walk is drawn from `today` — a
     figure that cannot be placed on the path until the phone has reported. So
     before the first sync of the day the instrument opened on its one empty
     face while holding a week of days and a month of them behind it: a dash on
     the wall, and every reading it had one press away, where nobody presses.

     Nothing is invented and nothing is hidden by this. The three faces are the
     same three in the same order, the dots still count them, and the label
     still names which one is in front of you; only where the ring starts moves.
     It moves once, when the reading arrives, which is the law's own "arriving"
     clause — after that `turned` holds whatever the visitor chose and the
     opening face has no further say. */
  const opening =
    today !== null ? 0 : average !== null ? 1 : (reading?.month?.length ?? 0) > 0 ? 2 : 0;
  const page = turned ?? opening;

  /* How far along the path the figure has walked, 0 to 1. Not the day's
     progress — it *travels* to the day's progress, from the start of the path,
     every time the visitor turns to this face. */
  const [walked, setWalked] = useState(0);
  const progress = today === null || goal <= 0 ? null : today / goal;

  useEffect(() => {
    if (page !== 0 || progress === null || !seen) return;

    /* Law 4's "unless touched": turning to this face is what causes the walk,
       and it resolves into the same figure a still card would have shown.
       Reduced motion walks it in no time at all — one frame, at the mark —
       so the value is never withheld from anyone, only the journey to it.

       The figure's gait rides on this and needs nothing of its own: its pose is
       a function of the distance in `walked`, so the legs turn over because
       this value is changing and stop dead when it stops. There is no second
       clock here to leave running, which is the only way a gait and Law 4 can
       both hold — see `GAIT` in lib/glyph/steps-frames.ts. */
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      /* A constant pace, and it is the gait that requires it.

         This was an out-cubic, which put half the distance inside the first
         227ms — about five pose changes at twenty a second, which is faster
         than a walk and faster than the field can resolve. Measured, the figure
         was an unreadable smear for the first quarter second and only settled
         near 600ms, by which point the walk was all but over: the gait existed
         and was never legible.

         An eased walk is a strange thing to ask for anyway. A person crossing a
         room does not set off at a sprint and coast to a halt, and the pose here
         is a function of distance — so easing the distance eases the cadence,
         and a cadence that changes is a limp. Linear is both the honest motion
         and the readable one. */
      setWalked(progress * t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [page, progress, seen]);

  /* There used to be a fourth thing here: a day the visitor asked to see, drawn
     as a page of its own. It was reached by pressing a day on the month face,
     through an invisible target of `COL_STEP * 0.48` — about 19px across when
     the card was 144–176px wide, and about 11px across at the 96px face that
     replaced it. Against a 44px floor that is not a control, it is a dare; and
     it was never keyboard-reachable, so it was a dare offered to some visitors
     and not others.

     A 7×6 calendar of 44px targets needs a face some 300px across before the
     interaction becomes honest, which is more than any cell here will give it,
     so it was removed rather than shrunk. The month face is a display now: the dots
     say met, missed, quiet and ahead, which is what the face was always for,
     and the sr-only block below carries every day of the month in text —
     which is more than the day card ever gave a screen reader. */

  const monthDays = reading?.month ?? [];
  const todayDate = days[days.length - 1]?.date ?? "";
  /* Which column the 1st falls in, so the rest of the month lays out by counting
     from it rather than by parsing every date twice. */
  const firstColumn = monthDays.length > 0 ? columnOf(monthDays[0].date) : 0;
  const todayIndex = monthDays.findIndex((day) => day.date === todayDate);
  const todayColumn = todayIndex >= 0 ? columnOf(todayDate) : 0;
  const todayRow = todayIndex >= 0 ? Math.floor((todayIndex + firstColumn) / 7) : -1;

  /* Memoised on the values rather than the reading, so a poll that comes back
     saying the same thing hands the field the same array and wakes nothing. */
  const frame = useMemo(() => {
    if (page === 2) return emptyFrame(GRID); // the month is drawn over the field
    if (page === 1) {
      if (today === null && average === null) return emptyFrame(GRID);
      return recordFrame(GRID, today, average);
    }
    if (progress === null) return emptyFrame(GRID);
    /* `bound` is what the walk is walking towards, and it is what keeps the
       settled figure standing. Once `walked` reaches it there is no ground left
       to cover and the pose is a figure at rest — at every step count, not only
       at a day that met its goal in full. */
    return walkFrame(GRID, walked, { bound: progress });
  }, [page, today, average, progress, walked]);

  /* Whether this face has a reading on it at all. Not "is the frame empty" —
     the month face draws an empty frame on purpose and puts its calendar over
     the top, so an empty frame there is a face doing its job. */
  const unread =
    page === 0 ? progress === null : page === 1 ? today === null && average === null : monthDays.length === 0;

  const todaySaid =
    today === null
      ? "not reported yet"
      : `${groupDigits(today)} of ${groupDigits(goal)}, ${share(today, goal)} of the goal`;
  const averageSaid =
    average === null ? "not reported yet" : `${groupDigits(average)}, ${share(average, goal)}`;

  const met = monthDays.filter((day) => dayState(day, goal, todayDate) === "met").length;
  const missed = monthDays.filter((day) => dayState(day, goal, todayDate) === "missed").length;
  const said =
    page === 0
      ? `Steps today ${todaySaid}`
      : page === 1
        ? `Steps today ${todaySaid}. Seven-day average ${averageSaid}`
        : met + missed === 0
          ? "This month, no day reported yet"
          : `This month, ${met} days at or over the goal and ${missed} under it`;

  /* Every page counts itself now, because every page is one somebody was told
     about. The count and the three dots say the same thing, which is the whole
     reason the fourth page had to go. */
  const turning = "Press the card, or use the arrow keys, to turn the page.";
  const label = `Steps, page ${page + 1} of ${PAGES}: ${FACES[page]}. ${said}. ${turning}`;

  /* The strongest reading the instrument holds, and it does not change with the
     page — four captions in a row that rewrote themselves as you paged one of
     them would make the wall's bottom line a thing to watch rather than read.

     Today when today is known. The seven-day average when it is not, marked
     with the one character that says a figure is an average and not a count;
     the face carrying it labels it "7-day" in type, and the spoken block below
     says it in words. A dash only when both are genuinely unknown, which is now
     what a dash on this bay means — nothing reported, rather than nothing
     reported *yet today*. */
  const caption =
    today !== null
      ? groupDigits(today)
      : average !== null
        ? `~${groupDigits(average)}`
        : undefined;

  /* One press, one turn — from the face actually in front of the visitor,
     which before the first press is the opening face rather than the walk. */
  const advance = () => setTurned((page + 1) % PAGES);

  /* And back. A pager you can only step one way round is a worse instrument
     than one you can step both ways — a visitor who overshoots the record has
     to walk the whole ring to get back to it. */
  const retreat = () => setTurned((page + PAGES - 1) % PAGES);

  return (
    <div
      ref={seenRef}
      /* The keyboard, all of it, in one place.
     
         Enter and Space advance because the card is a real button and that is
         what buttons do. The arrows are here because they are the only way to
         page without a pointer, and losing them when the gesture moved off the
         field would have left the instrument steppable in one direction only.
         Both axes are accepted — a page indicator is a horizontal idea and a
         card in a grid is a vertical one, and a visitor should not have to
         guess which this is — and both are prevented, or the page scrolls out
         from under whoever is reading it.
     
         The handler sits on the wrapper rather than on the button so the card
         keeps the API it was given; a keydown on the button is a keydown here
         one bubble later, and nothing else in this wrapper can take focus. */
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          advance();
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          retreat();
        }
      }}
    >
      <InstrumentReading
        srLabel="Steps"
        value={caption}
        onPress={advance}
        /* The dots are `aria-hidden`, so "page 2 of 3" has to reach the button's
           own name — otherwise the one thing a screen-reader user cannot get at
           is which of the three faces they are looking at. */
        pressLabel={label}
      >
        {/* The field, and under it the strip the page indicator lives in. Both
            sit inside the reading's face, so the pedometer's footprint is
            exactly the footprint every other instrument has — which is the
            promise the wall was built to keep. */}
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <div style={{ width: FIELD }}>
            <GlyphCell
              grid={GRID}
              size={SIZE}
              frame={frame}
              /* Round cells on a clean surface: the readings quote the LED
                 panel rather than imitate it, so there is no unlit lattice
                 behind them and a cell that is off is simply not there.

                 Except when there is no reading, and that is the design call
                 `UNREPORTED` was left in `steps-frames.ts` waiting for. That
                 constant was a value — 0.16 — calibrated against a floor the
                 field stopped having, and its own comment said so and said the
                 number was somebody else's decision. The decision is: there is
                 no such number. An instrument with nothing to report shows its
                 own field, unlit, at whatever the skin says an unlit cell is
                 worth — which is what the other three bays now do, and what
                 makes four resting bays read as one panel instead of four
                 different apologies. A grey wash at a value nobody could
                 justify was the worse half of "the widgets are ugly".

                 So the zero is a property of a face that has something to say,
                 not of this instrument. */
              pixel="round"
              unlit={unread ? undefined : 0}
              /* The field no longer owns the gesture. `pages` would make it a
                 focusable `group`, and a focusable element inside the card's
                 button is not markup HTML allows — so the card is the control
                 and this is the drawing. A press anywhere on the card turns the
                 page, including a press on the field itself, which is the same
                 click it always was. */
              label={label}
              className="w-full text-ink select-none"
            >
              {page === 1 ? (
                <>
                  {/* "Total today" and "7-day average" were written for a card
                      whose width was fixed and roughly twice this. The sr-only
                      block below still says them in full; the face says the
                      same thing in whatever width the wall's cell leaves it,
                      which is not a number this file gets to know. */}
                  <RecordLabel top="34%" name="Today" value={share(today, goal)} />
                  <RecordLabel top="86%" name="7-day" value={share(average, goal)} />
                </>
              ) : null}

              {page === 2 ? (
                <>
                  <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
                    {monthDays.map((day) => {
                      const index = Number(day.date.slice(8)) - 1;
                      const col = columnOf(day.date);
                      const row = Math.floor((index + firstColumn) / 7);
                      if (row >= WEEK_ROWS) return null;
                      const state = dayState(day, goal, todayDate);
                      const style = DAY_STYLE[state];
                      /* A dot and nothing else. It used to carry an invisible
                         press target too; at this size that target was 11px
                         across, which is a control in name only. Nothing here
                         takes a pointer now, so nothing implies it can. */
                      return (
                        <circle
                          key={day.date}
                          cx={COL_X + col * COL_STEP}
                          cy={ROW_Y + row * ROW_STEP}
                          r={DOT_R * style.scale}
                          fill={state === "missed" ? "var(--color-miss)" : "currentColor"}
                          opacity={style.opacity}
                        />
                      );
                    })}

                    {/* You are here. A pill rather than a dot, because today is the
                        one thing on this face that is not a day like the others —
                        it is the day still being decided. */}
                    {todayIndex >= 0 && todayRow < WEEK_ROWS ? (
                      <rect
                        x={COL_X + todayColumn * COL_STEP - DOT_R * 2.1}
                        y={ROW_Y + todayRow * ROW_STEP - DOT_R * 0.95}
                        width={DOT_R * 4.2}
                        height={DOT_R * 1.9}
                        rx={DOT_R * 0.95}
                        fill="currentColor"
                        opacity={0.9}
                      />
                    ) : null}
                  </svg>
                  {LETTERS.map((letter, col) => (
                    <span
                      key={col}
                      style={{ left: `${COL_X + col * COL_STEP}%`, top: "85%" }}
                      className="absolute -translate-x-1/2 text-2xs font-medium uppercase tracking-[0.04em] text-ink"
                    >
                      {letter}
                    </span>
                  ))}
                </>
              ) : null}
            </GlyphCell>
          </div>

          {/* Three dots, one per face — the count is the honest one now, which
              is what deleting the fourth page bought. They report rather than
              control: the reading is the control, and a face this size has no
              room for three 44px targets that would also have to be buttons
              nested in a button. */}
          <div aria-hidden className="flex gap-1">
            {FACES.map((face, index) => (
              <span
                key={face}
                className={`h-[3px] w-[3px] rounded-full bg-ink ${
                  page === index ? "opacity-100" : "opacity-25"
                }`}
              />
            ))}
          </div>
        </div>
      </InstrumentReading>

      {/* Every value the field carries, in text, so nothing here depends on
          being able to see a canvas. It sits outside the shell because the
          shell already names itself; this is the reading, not the control.

          The month is listed here too. It used to be reachable only by pressing
          a day — a target no keyboard could ever land on — so removing that
          press cost a screen reader nothing and this list gives it what the
          press never did: every day of the month, in order, in words. */}
      <div className="sr-only">
        <p>Steps today: {todaySaid}.</p>
        <p>Seven-day average: {averageSaid}.</p>
        <ul>
          {days.map((day, index) => {
            const { name } = weekday(day, index);
            return (
              <li key={day.date || index}>
                {name}:{" "}
                {day.steps === null ? "not reported" : `${groupDigits(day.steps)} steps`}
              </li>
            );
          })}
        </ul>
        {monthDays.length > 0 ? (
          <>
            <p>This month, day by day:</p>
            <ul>
              {monthDays.map((day) => (
                <li key={day.date}>
                  {day.date}:{" "}
                  {day.steps === null
                    ? "not reported"
                    : `${groupDigits(day.steps)} steps, ${share(day.steps, goal)} of the goal`}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
