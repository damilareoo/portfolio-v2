"use client";

import { useEffect, useMemo, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { authoredGlyph } from "@/data/glyph";
import { glyphFrame, markGlyph } from "@/lib/glyph/forge";
import { useStoredGlyph } from "@/lib/glyph/stored-glyph";
import { emptyFrame } from "@/lib/glyph/glyphs";
import {
  groupDigits,
  recordFrame,
  UNREPORTED,
  walkFrame,
} from "@/lib/glyph/steps-frames";
import type { StepsDay, StepsReading } from "@/lib/steps";

const GRID = 25; // dots across
const SIZE = 300; // canvas units; CSS scales it

/** The walk, the record, the week — in that order, because that is their order. */
const FACES = ["the walk", "the record", "the month"] as const;

/**
 * And a fourth face nothing points at.
 *
 * It is reachable by every means the other three are — one more turn past the
 * week, by swipe, by click, by arrow key — and advertised by none of them: the
 * indicator keeps its three dots, because a fourth dot would make it a page
 * somebody skipped rather than a page somebody found. Its label says what it
 * is, so the visitor who arrives by keyboard is told plainly.
 */
const HIDDEN_FACE = "the mark";
const PAGES = FACES.length + 1;

/** The mark the hidden page carries when the visitor has drawn nothing. */
const AUTHORED = Uint8Array.from(authoredGlyph);

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
type DayState = "met" | "missed" | "unknown";

function dayState(day: StepsDay, goal: number, today: string): DayState {
  if (day.date > today) return "unknown"; // not yet reached
  if (day.steps === null || goal <= 0) return "unknown"; // never reported
  if (day.steps >= goal) return "met";
  /* A day still being walked has not been missed. The goal can only be missed
     by a day that ran out of hours to meet it in, so today stays open until
     midnight — the same rule as "an unreported day is not a day of no walking",
     applied to the one day that is still happening. */
  return day.date === today ? "unknown" : "missed";
}

/** Which column a date sits in, Monday first. */
function columnOf(date: string): number {
  const at = Date.parse(`${date}T00:00:00Z`);
  return (new Date(at).getUTCDay() + 6) % 7;
}

/** A label the dot alphabet cannot set, laid over the band the number left it. */
function RecordLabel({ top, name, value }: { top: string; name: string; value: string }) {
  return (
    <div
      style={{ top }}
      className="absolute inset-x-0 flex items-baseline justify-between px-[6%] font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3"
    >
      <span>{name}</span>
      <span className="text-ink-2">{value}</span>
    </div>
  );
}

/**
 * The pedometer, as three pages of one field — and a fourth nobody is told about.
 *
 * The walk carries the idea: a figure on a path, ground covered behind it at
 * full size and brightness, the road ahead small and dim. The record states the
 * numbers. The week sets today against the six days behind it, and says whether
 * each was met without spending a hue on it — a missed day is an absence, and
 * an open ring is what an absence looks like in a field of dots. Past the week
 * is the mark, which reports nothing and is the point: the instrument's fourth
 * face is whatever the visitor drew on it, or the signature it shipped with.
 *
 * Nothing here runs a loop of its own. Frames arrive as props, so the field
 * moves when a page is turned or a finger crosses it and is otherwise as still
 * as the rest of the page.
 */
function Pedometer() {
  const [reading, setReading] = useState<StepsReading | null>(null);
  const [page, setPage] = useState(0);
  const drawn = useStoredGlyph();
  const mark = markGlyph(drawn, AUTHORED);

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

  /* Memoised on the values rather than the reading, so a poll that comes back
     saying the same thing hands the field the same array and wakes nothing. */
  const frame = useMemo(() => {
    if (page === 3) return glyphFrame(mark);
    if (page === 2) return emptyFrame(GRID); // the week is drawn over the field
    if (page === 1) {
      if (today === null && average === null) return placeholderFrame(GRID);
      return recordFrame(GRID, today, average);
    }
    if (progress === null) return placeholderFrame(GRID);
    return walkFrame(GRID, walked);
  }, [page, today, average, mark, progress, walked]);

  const monthDays = reading?.month ?? [];
  const todayDate = days[days.length - 1]?.date ?? "";
  /* Which column the 1st falls in, so the rest of the month lays out by counting
     from it rather than by parsing every date twice. */
  const firstColumn = monthDays.length > 0 ? columnOf(monthDays[0].date) : 0;
  const todayIndex = monthDays.findIndex((day) => day.date === todayDate);
  const todayColumn = todayIndex >= 0 ? columnOf(todayDate) : 0;
  const todayRow = todayIndex >= 0 ? Math.floor((todayIndex + firstColumn) / 7) : -1;

  const todaySaid =
    today === null
      ? "not reported yet"
      : `${groupDigits(today)} of ${groupDigits(goal)}, ${share(today, goal)} of the goal`;
  const averageSaid =
    average === null ? "not reported yet" : `${groupDigits(average)}, ${share(average, goal)}`;

  const met = monthDays.filter((day) => dayState(day, goal, todayDate) === "met").length;
  const missed = monthDays.filter((day) => dayState(day, goal, todayDate) === "missed").length;
  const said =
    page === 3
      ? drawn?.some(Boolean)
        ? "The glyph you drew in the colophon's forge, kept on this device"
        : "The maker's mark. Draw your own in the colophon's forge and it takes this page"
      : page === 0
        ? `Steps today ${todaySaid}`
        : page === 1
          ? `Steps today ${todaySaid}. Seven-day average ${averageSaid}`
          : met + missed === 0
            ? "This month, no day reported yet"
            : `This month, ${met} days at or over the goal and ${missed} under it`;

  /* The hidden page names itself rather than counting itself. Announcing "4 of
     4" on the three pages that do show a dot would give it away to exactly the
     visitors who cannot see that there are three dots — and calling it "3 of 3"
     once they got there would be the site lying about where they are. */
  const turning = "Click, swipe, or use the left and right arrow keys to turn the page.";
  const label =
    page === 3
      ? `Steps, one page past the week: ${HIDDEN_FACE}. ${said}. ${turning}`
      : `Steps, page ${page + 1} of ${FACES.length}: ${FACES[page]}. ${said}. ${turning}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {/* The indicator hangs off the card's right, so an equal blank hangs
            off its left. Without it the card sits a dot's width left of the
            record line beneath it, and the pair stops reading as one object. */}
        <span aria-hidden className="w-4" />
        <GlyphCell
          grid={GRID}
          size={SIZE}
          frame={frame}
          polarity="ink"
          pages={PAGES}
          page={page}
          onPageChange={setPage}
          label={label}
          className="w-[144px] cursor-pointer text-ink select-none sm:w-[176px]"
        >
          {page === 1 ? (
            <>
              <RecordLabel top="39%" name="Total today" value={share(today, goal)} />
              <RecordLabel top="83%" name="7-day average" value={share(average, goal)} />
            </>
          ) : null}

          {page === 2 ? (
            <>
              <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 h-full w-full">
                {monthDays.map((day) => {
                  const index = Number(day.date.slice(8)) - 1;
                  const col = columnOf(day.date);
                  const row = Math.floor((index + firstColumn) / 7);
                  if (row >= WEEK_ROWS) return null;
                  const state = dayState(day, goal, todayDate);
                  return (
                    <circle
                      key={day.date}
                      cx={COL_X + col * COL_STEP}
                      cy={ROW_Y + row * ROW_STEP}
                      r={state === "unknown" ? DOT_R * 0.5 : DOT_R}
                      /* Met is ink and reads as the page's own colour on either
                         skin. Missed is the one hue on the site. Unknown is a
                         smaller, quieter dot — present, because the day exists,
                         and dim, because nothing is being claimed about it. */
                      fill={state === "missed" ? "var(--color-miss)" : "currentColor"}
                      opacity={state === "unknown" ? 0.28 : 1}
                    />
                  );
                })}

                {/* You are here. The ring is free to mean this now that red
                    carries "missed" — a hollow mark no longer says anything
                    else on this face. */}
                {todayIndex >= 0 && todayRow < WEEK_ROWS ? (
                  <circle
                    cx={COL_X + todayColumn * COL_STEP}
                    cy={ROW_Y + todayRow * ROW_STEP}
                    r={DOT_R + 2.2}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={0.9}
                    opacity={0.55}
                  />
                ) : null}
              </svg>
              {LETTERS.map((letter, col) => (
                <span
                  key={col}
                  style={{ left: `${COL_X + col * COL_STEP}%`, top: "85%" }}
                  className="absolute -translate-x-1/2 font-mono text-[0.5625rem] uppercase tracking-[0.06em] text-ink-2"
                >
                  {letter}
                </span>
              ))}
            </>
          ) : null}
        </GlyphCell>

        {/* Three dots, and each of them a real control — arrow keys are the
            gesture's keyboard equivalent, but a page you can only reach by
            guessing that arrow keys work is a page most people cannot reach. */}
        <div className="flex flex-col gap-0.5">
          {FACES.map((face, index) => (
            <button
              key={face}
              type="button"
              onClick={() => setPage(index)}
              aria-label={`Show ${face}`}
              aria-current={page === index ? "true" : undefined}
              className="grid h-5 w-4 place-items-center"
            >
              <span
                className={`h-1 w-1 rounded-full bg-ink transition-opacity duration-200 ${
                  page === index ? "opacity-100" : "opacity-25"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Every value the field carries, in text, so nothing here depends on
          being able to see a canvas. */}
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

      {/* The record line, sized and placed as the disc's is, so the two cards
          sit on the same baseline whatever either of them has to say. It gives
          up width on a phone because the two fields stand side by side there,
          and a caption wider than its own card would push its neighbour off. */}
      <div className="h-9 w-[9rem] max-w-full text-center sm:w-[15rem]">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">Steps</p>
        {today === null ? (
          <p className="mt-0.5 text-[0.6875rem] text-ink-3">Not reported yet</p>
        ) : (
          <p className="mt-0.5 text-[0.6875rem] text-ink-2">
            <span className="text-ink">{groupDigits(today)}</span> of {groupDigits(goal)} today
            <span className="text-ink-3"> {share(today, goal)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The bay: the two live readouts the home carries, side by side.
 *
 * They are siblings on purpose — same dot field at the same size, same mono
 * label, same record line under each — because the argument of the whole thing
 * is that one instrument is wearing two faces, not that the page has collected
 * two widgets. They stand side by side at every width for the same reason: a
 * phone that stacks them turns a pair into a list.
 */
export function GlyphBay({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-end justify-center gap-6 sm:justify-end sm:gap-14 ${className}`}
    >
      <NowPlayingDisc />
      <Pedometer />
    </div>
  );
}
