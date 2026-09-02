"use client";

/**
 * The pedometer, and nothing else.
 *
 * This file used to end in a bay: a flex row that stood the disc and the
 * pedometer side by side at their own sizes. The instruments now stand in the
 * bank — `components/instrument-bank.tsx` — where one card shape and one grid
 * hold all four readings, so the layout wrapper had nothing left to arrange
 * and went. What remains is the instrument itself, which the bank places.
 */

import { useEffect, useMemo, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { CARD_FACE, InstrumentCard } from "@/components/instrument-card";
import { emptyFrame } from "@/lib/glyph/glyphs";
import {
  groupDigits,
  recordFrame,
  UNREPORTED,
  walkFrame,
} from "@/lib/glyph/steps-frames";
import { traceFor, tracePath } from "@/lib/glyph/trace";
import type { StepsDay, StepsReading } from "@/lib/steps";

const GRID = 25; // dots across
const SIZE = 300; // canvas units; CSS scales it

/** The walk, the record, the week — in that order, because that is their order. */
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

/** How wide the field is drawn inside the card's face. Short of `CARD_FACE`
    by enough to leave the page indicator a strip of its own beneath it, so
    the dots never sit on top of the reading they are indexing. */
const FIELD = CARD_FACE - 12;

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

/** The field at rest: enough ink to be seen, not enough to claim anything. */
function placeholderFrame(grid: number): Float32Array {
  return new Float32Array(grid * grid).fill(UNREPORTED);
}

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
 * Three states and no more, because the face has to be read at a glance from
 * across a room: the goal was met, the goal was missed, or nothing is known.
 * A day nobody has reached yet and a day nobody reported are both "unknown" —
 * they are drawn alike because they mean alike, that the site cannot say.
 */
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Friday, 8 August" — the way a day is named when you are looking at just it. */
function longDate(date: string): string {
  const at = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(at)) return date;
  const d = new Date(at);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** One reading on the day card: what it is called, and what it was. */
function DayStat({ top, name, value }: { top: string; name: string; value: string }) {
  return (
    <div style={{ top }} className="absolute inset-x-0 px-[8%]">
      {/* One size, not two. The card no longer grows at `sm` — it is `CARD_FACE`
          at every width — so a second, larger step had nothing left to answer to. */}
      <p className="text-[0.4375rem] font-medium uppercase tracking-[0.08em] text-ink-3">
        {name}
      </p>
      <p className="text-[0.8125rem] font-medium leading-none text-ink">{value}</p>
    </div>
  );
}

/** A label the dot alphabet cannot set, laid over the band the number left it. */
function RecordLabel({ top, name, value }: { top: string; name: string; value: string }) {
  return (
    <div
      style={{ top }}
      className="absolute inset-x-0 flex items-baseline justify-between px-[7%] text-[0.5rem] font-medium uppercase tracking-[0.06em] text-ink"
    >
      <span>{name}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * The pedometer, as three pages of one field.
 *
 * The walk carries the idea: a figure on a path, ground covered behind it at
 * full size and brightness, the road ahead small and dim. The record states the
 * numbers. The week sets today against the six days behind it, and says whether
 * each was met without spending a hue on it — a missed day is an absence, and
 * an open ring is what an absence looks like in a field of dots. There is no
 * fourth page any more; see `PAGES`.
 *
 * It wears an `InstrumentCard` like every other reading on the site, and the
 * card is what turns it: the press target is the whole card rather than the
 * canvas, which is how a 96px face can still offer a 44px control. The pager
 * itself — the page state, the three faces, the frames each one builds — is
 * untouched; only the surface the gesture lands on moved outward by one
 * element, because a focusable field nested inside a button is not a thing
 * HTML lets you build.
 *
 * Nothing here runs a loop of its own. Frames arrive as props, so the field
 * moves when a page is turned or a finger crosses it and is otherwise as still
 * as the rest of the page.
 */
export function Pedometer() {
  const [reading, setReading] = useState<StepsReading | null>(null);
  const [page, setPage] = useState(0);


  /* The same thirty seconds the disc polls on. An unconfigured store, a failed
     fetch and a day nobody has reported are all the same answer here — nothing
     to say — and all three land as placeholder dots rather than as an error. */
  useEffect(() => {
    let cancelled = false;

    const read = () =>
      fetch("/api/steps")
        .then((r) => r.json())
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

  /* How far along the path the figure has walked, 0 to 1. Not the day's
     progress — it *travels* to the day's progress, from the start of the path,
     every time the visitor turns to this face. */
  const [walked, setWalked] = useState(0);
  const progress = today === null || goal <= 0 ? null : today / goal;

  useEffect(() => {
    if (page !== 0 || progress === null) return;

    /* Law 4's "unless touched": turning to this face is what causes the walk,
       and it resolves into the same figure a still card would have shown.
       Reduced motion walks it in no time at all — one frame, at the mark —
       so the value is never withheld from anyone, only the journey to it. */
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      // Out-cubic: the figure sets off at pace and settles onto its mark.
      setWalked(progress * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [page, progress]);

  /* A day the visitor asked to see. A page of its own rather than a panel over
     the calendar, so the card keeps its one job of showing one thing and going
     back is a page turn like any other. */
  const [detail, setDetail] = useState<string | null>(null);

  const monthDays = reading?.month ?? [];
  const todayDate = days[days.length - 1]?.date ?? "";
  /* Which column the 1st falls in, so the rest of the month lays out by counting
     from it rather than by parsing every date twice. */
  const detailDay = detail ? monthDays.find((day) => day.date === detail) : undefined;
  const firstColumn = monthDays.length > 0 ? columnOf(monthDays[0].date) : 0;
  const todayIndex = monthDays.findIndex((day) => day.date === todayDate);
  const todayColumn = todayIndex >= 0 ? columnOf(todayDate) : 0;
  const todayRow = todayIndex >= 0 ? Math.floor((todayIndex + firstColumn) / 7) : -1;

  /* Memoised on the values rather than the reading, so a poll that comes back
     saying the same thing hands the field the same array and wakes nothing. */
  const frame = useMemo(() => {
    // A day card is carried by its line; the dot field stays out of its way.
    if (detailDay) return emptyFrame(GRID);
    if (page === 2) return emptyFrame(GRID); // the week is drawn over the field
    if (page === 1) {
      if (today === null && average === null) return placeholderFrame(GRID);
      return recordFrame(GRID, today, average);
    }
    if (progress === null) return placeholderFrame(GRID);
    return walkFrame(GRID, walked);
  }, [page, today, average, progress, walked, detailDay]);

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

  const cardLabel = detailDay
    ? `${longDate(detailDay.date)}: ${groupDigits(detailDay.steps ?? 0)} steps, ${share(detailDay.steps, goal)} of the goal. Press the card, or use the arrow keys, to go back to the month.`
    : label;

  /* One press, one turn. A day card is left the same way every other page is —
     the press that would have advanced the pager puts the month back instead,
     so going back is not a control that exists only there. */
  const advance = () => {
    if (detail) {
      setDetail(null);
      setPage(2);
      return;
    }
    setPage((current) => (current + 1) % PAGES);
  };

  /* And back. A pager you can only step one way round is a worse instrument
     than one you can step both ways — a visitor who overshoots the record has
     to walk the whole ring to get back to it. A day card is left in either
     direction, because leaving is not a direction. */
  const retreat = () => {
    if (detail) {
      setDetail(null);
      setPage(2);
      return;
    }
    setPage((current) => (current + PAGES - 1) % PAGES);
  };

  /* What the label row reports: the day being looked at, if one is, and
     otherwise today. Never a stale number and never a blank — `undefined`
     hands the card its em dash, which is the honest reading for a store that
     has not answered. */
  const shown = detailDay ? detailDay.steps : today;

  return (
    <div
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
        if (event.key === "Escape" && detail) {
          event.preventDefault();
          setDetail(null);
          return;
        }
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
      <InstrumentCard
        label="Steps"
        reading={shown === null ? undefined : groupDigits(shown)}
        onPress={advance}
        /* The dots are `aria-hidden`, so "page 2 of 3" has to reach the button's
           own name — otherwise the one thing a screen-reader user cannot get at
           is which of the three faces they are looking at. */
        pressLabel={cardLabel}
      >
        {/* The field, and under it the strip the page indicator lives in. Both
            sit inside the card's face, so the pedometer's footprint is exactly
            the footprint every other instrument has — which is the promise the
            bank was built to keep. */}
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <div style={{ width: FIELD }}>
            <GlyphCell
              grid={GRID}
              size={SIZE}
              frame={frame}
              polarity="ink"
              /* Round cells on a clean surface: the widget cards quote the LED
                 panel rather than imitate it, so there is no unlit lattice
                 behind them and a cell that is off is simply not there. */
              pixel="round"
              unlit={0}
              /* The field no longer owns the gesture. `pages` would make it a
                 focusable `group`, and a focusable element inside the card's
                 button is not markup HTML allows — so the card is the control
                 and this is the drawing. A press anywhere on the card turns the
                 page, including a press on the field itself, which is the same
                 click it always was. */
              label={cardLabel}
              className="w-full text-ink select-none"
            >
              {detailDay ? (
                <>
                  <div className="absolute inset-x-0 top-[7%] px-[8%]">
                    <p className="text-[0.4375rem] font-medium uppercase tracking-[0.08em] text-ink">
                      {longDate(detailDay.date)}
                    </p>
                  </div>
                  <DayStat top="26%" name="Steps" value={groupDigits(detailDay.steps ?? 0)} />
                  <DayStat top="52%" name="Of goal" value={share(detailDay.steps, goal)} />

                  {/* The day's line. Not a route and never labelled as one: nothing
                      here knows where anybody went. Its length is the day's
                      walking, and its shape is fixed by the date, so a day drawn
                      once is drawn the same way for good. */}
                  <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 h-full w-full">
                    <path
                      d={tracePath(traceFor(detailDay.date, detailDay.steps ?? 0), 58, 4)}
                      transform="translate(40, 26)"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                    {(() => {
                      const line = traceFor(detailDay.date, detailDay.steps ?? 0);
                      if (line.length === 0) return null;
                      const start = line[0];
                      return (
                        <circle
                          cx={40 + 4 + start.x * 50}
                          cy={26 + 4 + start.y * 50}
                          r={2.2}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.4}
                        />
                      );
                    })()}
                  </svg>
                </>
              ) : null}

              {page === 1 && !detailDay ? (
                <>
                  <RecordLabel top="34%" name="Total today" value={share(today, goal)} />
                  <RecordLabel top="86%" name="7-day average" value={share(average, goal)} />
                </>
              ) : null}

              {page === 2 && !detailDay ? (
                <>
                  <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
                    {monthDays.map((day) => {
                      const index = Number(day.date.slice(8)) - 1;
                      const col = columnOf(day.date);
                      const row = Math.floor((index + firstColumn) / 7);
                      if (row >= WEEK_ROWS) return null;
                      const state = dayState(day, goal, todayDate);
                      const style = DAY_STYLE[state];
                      const known = state === "met" || state === "missed";
                      return (
                        <g key={day.date}>
                          <circle
                            cx={COL_X + col * COL_STEP}
                            cy={ROW_Y + row * ROW_STEP}
                            r={DOT_R * style.scale}
                            fill={state === "missed" ? "var(--color-miss)" : "currentColor"}
                            opacity={style.opacity}
                          />
                          {/* A day with something to say is a control. Its target is
                              far larger than the dot and invisible with it, because
                              a three-unit dot is not something a finger can be asked
                              to hit. The press is swallowed so the card does not
                              also turn the page under it. */}
                          {known ? (
                            <circle
                              cx={COL_X + col * COL_STEP}
                              cy={ROW_Y + row * ROW_STEP}
                              r={COL_STEP * 0.48}
                              fill="transparent"
                              className="pointer-events-auto cursor-pointer"
                              onPointerDown={(event) => event.stopPropagation()}
                              onPointerUp={(event) => event.stopPropagation()}
                              onClick={(event) => {
                                event.stopPropagation();
                                setDetail(day.date);
                              }}
                            />
                          ) : null}
                        </g>
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
                      className="absolute -translate-x-1/2 text-[0.5rem] font-medium uppercase tracking-[0.04em] text-ink"
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
              control: the card is the control, and a 96px face has no room for
              three 44px targets that would also have to be buttons nested in a
              button. */}
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
      </InstrumentCard>

      {/* Every value the field carries, in text, so nothing here depends on
          being able to see a canvas. It sits outside the card because the card
          already names itself; this is the reading, not the control. */}
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
      </div>
    </div>
  );
}
