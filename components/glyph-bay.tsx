"use client";

import { useEffect, useMemo, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { emptyFrame } from "@/lib/glyph/glyphs";
import {
  groupDigits,
  recordFrame,
  UNREPORTED,
  walkFrame,
  weekMarks,
} from "@/lib/glyph/steps-frames";
import type { StepsDay, StepsReading } from "@/lib/steps";

const GRID = 25; // dots across
const SIZE = 300; // canvas units; CSS scales it

/** The walk, the record, the week — in that order, because that is their order. */
const FACES = ["the walk", "the record", "the week"] as const;

/* The week's geometry, in the SVG's own 100-unit box. Seven columns and seven
   rows, stopped short of the right edge so the day letters below them line up
   with something rather than floating. */
const COL_X = 14;
const COL_STEP = 12;
const ROW_Y = 16;
const ROW_STEP = 9.5;
const DOT_MAX = 4;

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
 * The pedometer, as three pages of one field.
 *
 * The walk carries the idea: a figure on a path, ground covered behind it at
 * full size and brightness, the road ahead small and dim. The record states the
 * numbers. The week sets today against the six days behind it, and says whether
 * each was met without spending a hue on it — a missed day is an absence, and
 * an open ring is what an absence looks like in a field of dots.
 *
 * Nothing here runs a loop of its own. Frames arrive as props, so the field
 * moves when a page is turned or a finger crosses it and is otherwise as still
 * as the rest of the page.
 */
function Pedometer() {
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

  /* Memoised on the values rather than the reading, so a poll that comes back
     saying the same thing hands the field the same array and wakes nothing. */
  const frame = useMemo(() => {
    if (page === 2) return emptyFrame(GRID); // the week is drawn over the field
    if (page === 1) {
      if (today === null && average === null) return placeholderFrame(GRID);
      return recordFrame(GRID, today, average);
    }
    if (today === null || goal <= 0) return placeholderFrame(GRID);
    return walkFrame(GRID, today / goal);
  }, [page, today, average, goal]);

  const marks = useMemo(() => weekMarks(days, goal), [days, goal]);

  const todaySaid =
    today === null
      ? "not reported yet"
      : `${groupDigits(today)} of ${groupDigits(goal)}, ${share(today, goal)} of the goal`;
  const averageSaid =
    average === null ? "not reported yet" : `${groupDigits(average)}, ${share(average, goal)}`;

  const met = days.filter((day) => day.steps !== null && day.steps >= goal).length;
  const said =
    page === 0
      ? `Steps today ${todaySaid}`
      : page === 1
        ? `Steps today ${todaySaid}. Seven-day average ${averageSaid}`
        : average === null
          ? "The last seven days, none of them reported yet"
          : `The last seven days, ${met} of them at or over the goal`;

  const label = `Steps, page ${page + 1} of ${FACES.length}: ${FACES[page]}. ${said}. Click, swipe, or use the left and right arrow keys to turn the page.`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <GlyphCell
          grid={GRID}
          size={SIZE}
          frame={frame}
          polarity="ink"
          pages={FACES.length}
          page={page}
          onPageChange={setPage}
          label={label}
          className="w-[240px] cursor-pointer text-ink select-none sm:w-[204px]"
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
                {marks.map((column, col) =>
                  column.map((mark, row) => {
                    const cx = COL_X + col * COL_STEP;
                    const cy = ROW_Y + row * ROW_STEP;
                    /* A floor under the radius so a day of no walking is still
                       seven rings and not an empty gap in the week. */
                    const r = Math.max(mark.hollow ? 1.6 : 0.9, mark.value * DOT_MAX);
                    return mark.hollow ? (
                      <circle
                        key={`${col}-${row}`}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={0.8}
                        opacity={0.32 + mark.value * 0.68}
                      />
                    ) : (
                      <circle
                        key={`${col}-${row}`}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="currentColor"
                        opacity={0.2 + mark.value * 0.8}
                      />
                    );
                  }),
                )}
              </svg>
              {marks.map((_, col) => (
                <span
                  key={col}
                  style={{ left: `${COL_X + col * COL_STEP}%`, top: "79%" }}
                  className="absolute -translate-x-1/2 font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3"
                >
                  {weekday(days[col], col).letter}
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
          sit on the same baseline whatever either of them has to say. */}
      <div className="h-9 w-[15rem] max-w-full text-center">
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
 * They are siblings on purpose — same dot field, same mono label, same record
 * line under each — because the argument of the whole thing is that one
 * instrument is wearing two faces, not that the page has collected two widgets.
 */
export function GlyphBay({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-12 sm:flex-row sm:items-end sm:justify-end sm:gap-14 ${className}`}
    >
      <NowPlayingDisc />
      <Pedometer />
    </div>
  );
}
