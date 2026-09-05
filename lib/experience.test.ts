import { describe, expect, it } from "vitest";
import { byRole, parsePeriod, standing } from "@/lib/experience";
import { roles } from "@/data/experience";
import type { Role } from "@/data/experience";

const role = (company: string, period: string): Role => ({
  role: "Product Designer",
  company,
  url: `https://${company.toLowerCase()}.example`,
  period,
  location: "Remote",
});

describe("parsePeriod", () => {
  it("reads a period as two points, not as a set of months", () => {
    /* The half-open reading is the decision the whole timeline rests on: a role
       that ends in April does not overlap one that begins in April. */
    const a = parsePeriod("Mar 2025 — Apr 2026");
    const b = parsePeriod("Apr 2026 — Aug 2026");
    expect(a.end).toBe(b.start);
    expect(a.start < b.start && a.end <= b.start).toBe(true);
  });

  it("records an unfinished role as open rather than guessing an end", () => {
    expect(parsePeriod("Apr 2026 — Present").open).toBe(true);
  });

  it("refuses a period it cannot read", () => {
    expect(() => parsePeriod("sometime in 2025")).toThrow();
    expect(() => parsePeriod("Mar 2025 — Feb 2025")).toThrow();
  });
});

describe("standing", () => {
  it("reports open only when a role is actually open", () => {
    const answer = standing([role("A", "Jan 2025 — Jan 2026"), role("B", "Jun 2025 — Present")]);
    expect(answer.open).toBe(true);
    expect(answer.roles.map((r) => r.company)).toEqual(["B"]);
  });

  it("falls back to the last engagement rather than to a stale one", () => {
    const answer = standing([
      role("Older", "Mar 2025 — Apr 2026"),
      role("Newest", "Apr 2026 — Aug 2026"),
    ]);
    expect(answer.open).toBe(false);
    expect(answer.roles.map((r) => r.company)).toEqual(["Newest"]);
  });

  it("names every role that ended in the same month", () => {
    const answer = standing([
      role("A", "Mar 2025 — Apr 2026"),
      role("B", "Apr 2025 — Apr 2026"),
    ]);
    expect(answer.roles.map((r) => r.company)).toEqual(["A", "B"]);
  });

  it("says something true about the roles the site actually holds", () => {
    /* The defect this replaces: /about said "Currently: ChessEver, Hex" for
       four months after both had ended. Whatever this answers, it may only name
       companies that are in the data. */
    const answer = standing(roles);
    const known = new Set(roles.map((r) => r.company));
    expect(answer.roles.length).toBeGreaterThan(0);
    for (const r of answer.roles) expect(known.has(r.company)).toBe(true);
  });
});

describe("byRole", () => {
  const titled = (title: string, company: string): Role => ({
    ...role(company, "Mar 2025 — Apr 2026"),
    role: title,
  });

  it("gathers a run of one title so the sentence has one clause for it", () => {
    const runs = byRole([
      titled("Product Designer", "A"),
      titled("Product Designer", "B"),
      titled("Design Partner", "C"),
    ]);
    expect(runs.map((run) => run.role)).toEqual(["Product Designer", "Design Partner"]);
    expect(runs[0].companies.map((r) => r.company)).toEqual(["A", "B"]);
  });

  it("keeps the record's order rather than reordering it to suit the grammar", () => {
    /* Two like roles either side of an unlike one are two stretches, not one.
       Bucketing them would read as a single spell at both companies. */
    const runs = byRole([
      titled("Product Designer", "A"),
      titled("Design Partner", "B"),
      titled("Product Designer", "C"),
    ]);
    expect(runs.map((run) => run.role)).toEqual([
      "Product Designer",
      "Design Partner",
      "Product Designer",
    ]);
  });

  it("names every company the record holds, once", () => {
    const named = byRole(roles).flatMap((run) => run.companies.map((r) => r.company));
    expect(named).toEqual(roles.map((r) => r.company));
  });
});
