import type { Role } from "@/data/experience";

/**
 * The roles, read as intervals on one axis.
 *
 * `data/experience.ts` records a period as a human sentence — "Mar 2025 — Apr
 * 2026" — because that is the form a person keeps a CV in and the form the page
 * prints. Whatever else the site needs to say about the roles is derived from
 * them here rather than restated anywhere, which is the whole point: a second
 * hand-written copy of the roles is what went stale on /about in the first
 * place.
 *
 * There used to be a timeline in this file — lanes, rows, a wavefront paced in
 * months — and it went with the chart it was built for. /about lists the roles
 * now, and the home says them in a sentence; neither needs to know which two
 * were held at once. What is left is two questions: which role the site is
 * standing on, and how the sentence groups them.
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
 * dash already carries: a dash between two dates names the ends of a span, not
 * a set of months that includes both. `standing` rests on it — a role that
 * ended in the last recorded month is the most recent one.
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
