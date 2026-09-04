import { describe, expect, it } from "vitest";
import { parsePeriod, standing } from "@/lib/experience";
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
    /* The half-open reading: a role that ends in April does not overlap one
       that begins in April. */
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
  it("says Currently only when a role is actually open", () => {
    const answer = standing([role("A", "Jan 2025 — Jan 2026"), role("B", "Jun 2025 — Present")]);
    expect(answer.label).toBe("Currently");
    expect(answer.roles.map((r) => r.company)).toEqual(["B"]);
  });

  it("falls back to the last engagement rather than to a stale one", () => {
    const answer = standing([
      role("Older", "Mar 2025 — Apr 2026"),
      role("Newest", "Apr 2026 — Aug 2026"),
    ]);
    expect(answer.label).toBe("Most recently");
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
