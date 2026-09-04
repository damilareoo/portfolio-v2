"use client";

import type { CSSProperties } from "react";
import { CompanyMark, MARK_HEIGHT } from "@/components/company-marks";
import { GlyphIcon } from "@/components/glyph-icon";
import type { Role } from "@/data/experience";
import { buildTimeline, type TimelineEntry } from "@/lib/experience";
import { useSeenOnce } from "@/lib/reveal";

/**
 * The roles, on an axis, with the line that travels them.
 *
 * The brief for this was a ladder — "from where I started to my last role" —
 * and the data will not carry one. Two of the three roles ran at the same time
 * and the whole span is seventeen months, so a staircase would have to draw a
 * rung that was never climbed and a line "travelling" it would have almost no
 * distance to cover. What is drawn instead is a timeline that admits
 * concurrency: tracks that run beside each other where the dates overlap, and
 * one track where they do not. It still reads as progression, because the axis
 * is time and time only goes one way; it just does not pretend the middle of it
 * was a single file.
 *
 * Nothing in here is written for three roles. Lanes, rows and the line's timing
 * are all derived in `lib/experience.ts` from the periods themselves, so an
 * earlier job dropped into `data/experience.ts` lands on the chart without a
 * line of this file changing. That is the test the brief set and it is the only
 * reason the layout is built out of a solved interval model rather than out of
 * three hand-placed blocks.
 *
 * Two arrangements, not one scaled.
 *
 * Wide: lanes are columns and rows are the moments anything started or ended,
 * so two concurrent roles are literally two blocks standing side by side across
 * the same rows. Each row's *floor* is its own duration in months (see
 * PX_PER_MONTH), which is what puts ChessEver's start a visible step below
 * HEX's rather than level with it, and content wins wherever a month's worth of
 * pixels cannot hold four lines of type.
 *
 * Narrow: a 320px screen has no second column to give a second track, so the
 * arrangement changes rather than shrinking. The roles stack in start order —
 * the same document order, so the reading is unchanged — the spine steps right
 * for a role on a second track and back again when it rejoins the first, and
 * the roles that were held at once say so in a word. Concurrency told in text
 * costs no width; concurrency told in columns costs 250px of it.
 */
export function ExperienceTimeline({ roles }: { roles: readonly Role[] }) {
  const timeline = buildTimeline(roles);
  /* The line is an arrival: it fires the first time the section is scrolled
     into view and never again, and `useSeenOnce` is already the site's one
     answer for that — the observer disconnects on first intersection, and a
     visitor who asked for less motion is told "seen" immediately so the line is
     simply there. A second observer written here would be a second set of
     rules about what counts as arriving. */
  const { ref, seen } = useSeenOnce<HTMLDivElement>();

  if (timeline.entries.length === 0) return null;

  return (
    <div
      ref={ref}
      data-drawn={seen || undefined}
      style={
        {
          "--tl-cols": `repeat(${timeline.lanes}, minmax(0, 1fr))`,
          "--tl-rows": timeline.template,
        } as CSSProperties
      }
      className="grid sm:gap-x-5 sm:[grid-template-columns:var(--tl-cols)] sm:[grid-template-rows:var(--tl-rows)]"
    >
      {timeline.entries.map((entry) => (
        <Track key={`${entry.role.company}-${entry.role.period}`} entry={entry} />
      ))}
    </div>
  );
}

function Track({ entry }: { entry: TimelineEntry }) {
  const { role } = entry;

  return (
    <div
      style={
        {
          "--tl-lane": String(entry.lane),
          "--tl-row": `${entry.rowStart} / ${entry.rowEnd}`,
          "--tl-col": String(entry.lane + 1),
          "--tl-delay": `${entry.delayMs}ms`,
          "--tl-draw": `${entry.drawMs}ms`,
        } as CSSProperties
      }
      /* The narrow arrangement's step-right, and the wide one's placement. The
         step is the only thing a phone can spend on a second track: ten pixels
         of indent says "this one is beside the last, not after it", and the
         word below says which. */
      className="relative ml-[calc(var(--tl-lane)*10px)] pb-8 pl-5 sm:ml-0 sm:pb-10 sm:[grid-column:var(--tl-col)] sm:[grid-row:var(--tl-row)]"
    >
      <Rail entry={entry} />

      <a
        href={role.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <p className="text-xs text-ink-3">{role.period}</p>
        {/* Fixed height so a company with a wordmark and one set in type sit on
            the same line — the difference between them is about which files the
            site holds, not about the companies. */}
        <span className="mt-2.5 flex items-center text-sm" style={{ height: MARK_HEIGHT }}>
          <CompanyMark role={role} />
        </span>
        <p className="mt-2.5 flex items-baseline gap-1.5 text-sm text-ink">
          <span className="font-medium tracking-tight">{role.role}</span>
          {role.engagement && <span className="text-ink-3">· {role.engagement}</span>}
          <GlyphIcon
            name="arrow-out"
            size="0.4375rem"
            className="shrink-0 text-ink-3 transition-colors group-hover:text-ink"
          />
        </p>
        <p className="mt-0.5 text-xs leading-[1.45] text-ink-3">{role.location}</p>
      </a>

      {entry.concurrent && (
        /* Narrow only. On the wide arrangement the two tracks say this by
           standing side by side, and a label repeating it would be the same
           fact twice. */
        <p className="mt-2 font-mono text-2xs uppercase tracking-wider text-ink-3 sm:hidden">
          Concurrent
        </p>
      )}
    </div>
  );
}

/**
 * One role's stretch of the line.
 *
 * The line is drawn per role rather than as one path across the whole chart,
 * and that is a consequence of the layout rather than a preference. The rows
 * are `auto` above their floors — the type decides where a role's block ends —
 * so no y coordinate on this chart is known until the browser has laid it out,
 * and a single path would need all of them at render time. Each role therefore
 * owns the segment that runs beside it, and the segments are timed off the
 * dates instead of off pixels: a stretch begins when its role began and lasts
 * as long as the role did, so the wavefront moves down the chart at one speed
 * in months, splits where two roles overlap and rejoins where they stop. One
 * line, travelling, assembled from the pieces the layout can actually address.
 *
 * `pathLength="1"` is what lets that survive not knowing the height. It
 * redeclares the path's length as 1 for `stroke-dasharray` and
 * `stroke-dashoffset`, so "undrawn" is offset 1 and "drawn" is offset 0
 * whatever the segment measures — no coordinate is computed from the box, and
 * there is nothing for the server and the browser to disagree about.
 *
 * `preserveAspectRatio="none"` stretches the box vertically to whatever height
 * the row settled on. It does not distort the stroke: the viewBox is one unit
 * wide in a one-pixel-wide element, so the horizontal scale — the only axis a
 * vertical line's width is measured on — is exactly 1.
 *
 * The transition itself is in globals.css, beside `.arrive`, because the shape
 * of an arrival is a property of the skin and because reduced motion has to be
 * able to reach the delay as well as the duration.
 */
function Rail({ entry }: { entry: TimelineEntry }) {
  return (
    <>
      <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 1 100"
        preserveAspectRatio="none"
        className="absolute inset-y-0 left-0 w-px overflow-visible text-ink-3"
      >
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100"
          pathLength="1"
          strokeDasharray="1"
          stroke="currentColor"
          strokeWidth="1"
          className="tl-track"
        />
      </svg>
      {/* A start is a fact the page can state before the line reaches it, so
          the dots do not animate. Filled where a role begins; hollow where its
          track stops, which is drawn only when no later role takes that lane —
          HEX's track is not capped, because Endgame continues it. */}
      <span className="absolute left-0 top-[0.3rem] size-[5px] -translate-x-[2px] rounded-full bg-ink" />
      {entry.terminal && (
        <span className="absolute bottom-8 left-0 size-[5px] -translate-x-[2px] rounded-full border border-ink-3 bg-bg sm:bottom-10" />
      )}
    </>
  );
}
