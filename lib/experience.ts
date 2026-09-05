import type { Role } from "@/data/experience";

/**
 * The roles, read as intervals on one axis.
 *
 * `data/experience.ts` records a period as a human sentence — "Mar 2025 — Apr
 * 2026" — because that is the form a person keeps a CV in and the form the page
 * prints. Everything the About timeline needs beyond that is arithmetic on
 * those two months: which roles ran at the same time, how many tracks that
 * takes, how far apart two starts are, and which role the site is standing on
 * now. All of it is derived here rather than restated anywhere, which is the
 * whole point: a second hand-written copy of the roles is what went stale on
 * /about in the first place.
 *
 * There is no clock in this file. A build-time `new Date()` would freeze the
 * page's idea of "now" at whenever it last deployed, which is the same defect
 * one layer down. Currency is a property of the *data* instead: a role that has
 * not ended is written with "Present" as its end, and that word — not the
 * calendar — is what makes the site say "Currently".
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A month, as a single number: years times twelve plus the month's index. */
function month(text: string): number {
  const [name, year] = text.split(/\s+/);
  const index = MONTHS.indexOf(name);
  const y = Number(year);
  if (index < 0 || !Number.isInteger(y)) {
    throw new Error(`experience: "${text}" is not a month — expected e.g. "Mar 2025"`);
  }
  return y * 12 + index;
}

/**
 * A period, half-open.
 *
 * "Mar 2025 — Apr 2026" is read as two points on a line rather than as two
 * months worked, so the interval is [Mar 2025, Apr 2026) and a role that ends
 * in April does not overlap one that begins in April. That reading is what
 * keeps three roles on two tracks here instead of three: HEX ends and Endgame
 * begins in the same month, and a closed interval would have to draw them as
 * concurrent, which they were not. It is also the reading the dash already
 * carries — a dash between two dates names the ends of a span, not a set of
 * months that includes both.
 */
export type Span = {
  start: number;
  end: number;
  /** Written as "Present": the role has no end recorded. */
  open: boolean;
};

const DASH = /\s*[—–-]\s*/;

export function parsePeriod(period: string): Span {
  const [from, to] = period.split(DASH);
  if (!from || !to) throw new Error(`experience: "${period}" is not a period`);
  const start = month(from);
  if (/^present$/i.test(to.trim())) return { start, end: start, open: true };
  const end = month(to);
  if (end < start) throw new Error(`experience: "${period}" ends before it begins`);
  return { start, end, open: false };
}

/**
 * How much vertical room one month is worth on the wide arrangement, and how
 * long the line spends travelling it.
 *
 * The first is a *floor*, not a height: a row is `minmax(months × PX_PER_MONTH,
 * auto)`, so the axis is metric until a role's own text needs more than its
 * duration bought, and then the text wins. That is the honest compromise in a
 * 544px column — a strictly proportional axis would give a one-month role
 * sixteen pixels to hold four lines of type, and a purely ordinal one would
 * place two starts a month apart at the same height and lose the stagger that
 * says one began before the other.
 *
 * The second is the same axis in time. The line travels at a constant speed in
 * *months*, so two tracks that overlap are drawn at once and a four-month
 * contract takes less of the animation than a thirteen-month one. Capped in
 * total, because a career is not required to stay short and an arrival that
 * runs for four seconds has stopped being an arrival.
 */
const PX_PER_MONTH = 12;
const MS_PER_MONTH = 55;
const MAX_DRAW_MS = 1400;

export type TimelineEntry = {
  role: Role;
  span: Span;
  /** Which track the role runs on. Zero is the first. */
  lane: number;
  /** Grid line the role's block starts and ends on, 1-based, as CSS counts. */
  rowStart: number;
  rowEnd: number;
  /** No later role takes this lane, so the track stops here and is capped. */
  terminal: boolean;
  /** Runs at the same time as at least one other role. */
  concurrent: boolean;
  delayMs: number;
  drawMs: number;
};

export type Timeline = {
  /** Earliest start first — the order the line travels and the page reads. */
  entries: TimelineEntry[];
  lanes: number;
  /** Every row of the wide grid, as a months count, in order. */
  rows: number[];
  /** `grid-template-rows` for those rows. */
  template: string;
};

/**
 * Roles in, tracks out.
 *
 * Lanes are assigned by the standard greedy sweep: take the roles in start
 * order and give each one the first track that is free by the time it begins.
 * Two roles share a track only when they cannot have been held at once, so the
 * number of tracks is exactly the largest number of roles ever running
 * together — two, today. Nothing here is tuned to three roles: a fourth that
 * overlaps both opens a third track, and one that does not simply lands back on
 * the first. That is the test of whether this is a timeline or a drawing of
 * one.
 *
 * Rows are the distinct moments anything started or ended. Every role spans
 * from its own start line to its own end line, so the grid places concurrency
 * without being told about it — two blocks in two columns across the same rows
 * are two roles held at the same time, and there is no second representation of
 * that fact to keep in step.
 */
export function buildTimeline(roles: readonly Role[]): Timeline {
  if (roles.length === 0) return { entries: [], lanes: 0, rows: [], template: "" };

  const spans = roles.map((role) => ({ role, span: parsePeriod(role.period) }));

  /* An open role has to end somewhere for the axis to have a length. It ends at
     the horizon: the last moment anything else recorded, or a month past the
     latest start when it is itself the latest thing. Not "today" — see the file
     docblock. The consequence is stated rather than hidden: an ongoing role is
     drawn running to the end of the chart, which is what "still going" looks
     like on a chart that stops. */
  const horizon = Math.max(
    ...spans.map(({ span }) => (span.open ? span.start + 1 : span.end)),
  );
  for (const { span } of spans) if (span.open) span.end = horizon;

  const ordered = spans
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end || a.index - b.index);

  const laneFree: number[] = [];
  const placed = ordered.map((entry) => {
    let lane = laneFree.findIndex((free) => free <= entry.span.start);
    if (lane < 0) lane = laneFree.length;
    laneFree[lane] = entry.span.end;
    return { ...entry, lane };
  });

  const points = [...new Set(placed.flatMap(({ span }) => [span.start, span.end]))].sort(
    (a, b) => a - b,
  );
  const rows = points.slice(1).map((point, i) => point - points[i]);

  const first = points[0];
  const total = points[points.length - 1] - first;
  /* Zero only when every role is a single instant, which the parser cannot
     produce, but a division is not the place to find that out. */
  const perMonth = total > 0 ? Math.min(MS_PER_MONTH, MAX_DRAW_MS / total) : MS_PER_MONTH;

  const entries = placed.map((entry) => ({
    role: entry.role,
    span: entry.span,
    lane: entry.lane,
    rowStart: points.indexOf(entry.span.start) + 1,
    rowEnd: points.indexOf(entry.span.end) + 1,
    terminal: !placed.some(
      (other) => other !== entry && other.lane === entry.lane && other.span.start >= entry.span.end,
    ),
    concurrent: placed.some(
      (other) =>
        other !== entry && other.span.start < entry.span.end && entry.span.start < other.span.end,
    ),
    /* Rounded for the same reason `clock-face.tsx` rounds its index marks: these
       numbers are written into the markup on the server and read back in the
       browser, and a value that differs in its last place is a hydration
       mismatch React reports and declines to patch. Division is exactly rounded
       by the spec where `Math.sin` is not, so this is insurance rather than a
       repair — but it is free, and a millisecond is far below anything the eye
       is owed. */
    delayMs: Math.round((entry.span.start - first) * perMonth),
    drawMs: Math.round((entry.span.end - entry.span.start) * perMonth),
  }));

  return {
    entries,
    lanes: laneFree.length,
    rows,
    template: rows.map((months) => `minmax(${months * PX_PER_MONTH}px, auto)`).join(" "),
  };
}

/**
 * What the site is standing on, for the sentence that used to say it by hand.
 *
 * /about read "Currently: ChessEver, Hex" for four months after both of those
 * ended, because it was a second copy of the roles written in prose. It is
 * derived now, and the tense moves with the answer: a role recorded as running
 * to "Present" is something the owner is *currently* doing, and when nothing is
 * open the truthful thing to say is which engagement was the last one. Neither
 * branch can name a company that is not in `data/experience.ts`, so the line
 * cannot invent an engagement and cannot go stale on its own; it changes when
 * the data does.
 *
 * Facts out, not words. This returns whether anything is open and which roles
 * answer the question; the sentence around them belongs to the page, because
 * the page is where it is being read aloud and a verb tense is not data.
 */
export function standing(roles: readonly Role[]): { open: boolean; roles: Role[] } {
  const spans = roles.map((role) => ({ role, span: parsePeriod(role.period) }));
  const open = spans.filter(({ span }) => span.open);
  if (open.length > 0) return { open: true, roles: open.map(({ role }) => role) };

  const last = Math.max(...spans.map(({ span }) => span.end));
  return {
    open: false,
    roles: spans.filter(({ span }) => span.end === last).map(({ role }) => role),
  };
}

/**
 * The roles as a sentence says them: runs of one title, in the record's order.
 *
 * The hero reads "Most recently a product designer at Endgame AI and ChessEver,
 * and design partner at HEX", and that sentence has two clauses because two of
 * the three roles share a title — not because there are three roles. Written out
 * by hand it would be prose that has to be rewritten the first time a fourth
 * company arrives, which is the defect the marks list already fixed once.
 *
 * Runs, not buckets. `data/experience.ts` is newest first and that order is the
 * record's own; gathering every Product Designer role wherever it sits would
 * reorder the sentence to suit the grammar and quietly claim a sequence the
 * record does not. Two like roles either side of an unlike one get two clauses,
 * which is the honest shape — they were two separate stretches.
 *
 * Facts out, not words, the same as `standing`. The article, the case of the
 * title and the commas belong to whoever is reading it aloud.
 */
export function byRole(roles: readonly Role[]): { role: string; companies: Role[] }[] {
  const runs: { role: string; companies: Role[] }[] = [];
  for (const role of roles) {
    const open = runs[runs.length - 1];
    if (open && open.role === role.role) open.companies.push(role);
    else runs.push({ role: role.role, companies: [role] });
  }
  return runs;
}
