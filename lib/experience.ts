import type { Role } from "@/data/experience";

/**
 * The roles, read as intervals on one axis.
 *
 * `data/experience.ts` records a period as a human sentence — "Mar 2025 — Apr
 * 2026" — because that is the form a person keeps a CV in and the form the page
 * prints. Everything /about needs beyond that is arithmetic on
 * those two months, and it is derived here rather than restated anywhere —
 * which is the whole point, because a second hand-written copy of the roles is
 * what went stale on that page in the first place.
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
 * in April does not overlap one that begins in April. It is the reading the
 * dash already carries — a dash between two dates names the ends of a span,
 * not a set of months that includes both — and it is what will let this page
 * say which of these roles were held at the same time without claiming an
 * overlap in the month one handed over to the next.
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
 * What the site is standing on, for the Record row that used to say it by hand.
 *
 * The row read "Currently: ChessEver, Hex" for four months after both of those
 * ended, because it was a second copy of the roles written in prose. It is
 * derived now, and the label moves with the answer: a role recorded as running
 * to "Present" is something the owner is *currently* doing, and when nothing is
 * open the truthful thing to say is which engagement was the last one — the
 * same words the home's hero already uses for the same fact. Neither branch can
 * name a company that is not in `data/experience.ts`, so the row cannot invent
 * an engagement and cannot go stale on its own; it changes when the data does.
 */
export function standing(roles: readonly Role[]): { label: string; roles: Role[] } {
  const spans = roles.map((role) => ({ role, span: parsePeriod(role.period) }));
  const open = spans.filter(({ span }) => span.open);
  if (open.length > 0) return { label: "Currently", roles: open.map(({ role }) => role) };

  const last = Math.max(...spans.map(({ span }) => span.end));
  return {
    label: "Most recently",
    roles: spans.filter(({ span }) => span.end === last).map(({ role }) => role),
  };
}
