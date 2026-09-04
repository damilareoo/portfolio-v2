import { describe, expect, it } from "vitest";
import { buildTimeline, parsePeriod, standing } from "@/lib/experience";
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

describe("buildTimeline", () => {
  it("gives concurrent roles their own tracks and returns overlapping ones to the first", () => {
    const timeline = buildTimeline([
      role("HEX", "Mar 2025 — Apr 2026"),
      role("ChessEver", "Apr 2025 — Apr 2026"),
      role("Endgame", "Apr 2026 — Aug 2026"),
    ]);
    expect(timeline.lanes).toBe(2);
    expect(timeline.entries.map((e) => [e.role.company, e.lane])).toEqual([
      ["HEX", 0],
      ["ChessEver", 1],
      ["Endgame", 0],
    ]);
  });

  it("opens a third track only when three roles are actually held at once", () => {
    const timeline = buildTimeline([
      role("A", "Jan 2024 — Jan 2026"),
      role("B", "Feb 2024 — Jan 2026"),
      role("C", "Mar 2024 — Jan 2026"),
    ]);
    expect(timeline.lanes).toBe(3);
  });

  it("reads earliest first, whatever order the data is written in", () => {
    const timeline = buildTimeline([
      role("Last", "Apr 2026 — Aug 2026"),
      role("First", "Mar 2025 — Apr 2026"),
    ]);
    expect(timeline.entries.map((e) => e.role.company)).toEqual(["First", "Last"]);
  });

  it("puts every role on rows that span its own period", () => {
    const timeline = buildTimeline([
      role("HEX", "Mar 2025 — Apr 2026"),
      role("ChessEver", "Apr 2025 — Apr 2026"),
      role("Endgame", "Apr 2026 — Aug 2026"),
    ]);
    // Four moments — Mar 25, Apr 25, Apr 26, Aug 26 — so three rows.
    expect(timeline.rows).toEqual([1, 12, 4]);
    expect(timeline.entries.map((e) => [e.rowStart, e.rowEnd])).toEqual([
      [1, 3],
      [2, 3],
      [3, 4],
    ]);
  });

  it("caps a track only where no later role takes it", () => {
    const timeline = buildTimeline([
      role("HEX", "Mar 2025 — Apr 2026"),
      role("ChessEver", "Apr 2025 — Apr 2026"),
      role("Endgame", "Apr 2026 — Aug 2026"),
    ]);
    expect(timeline.entries.map((e) => e.terminal)).toEqual([false, true, true]);
  });

  it("marks the roles that ran beside another one", () => {
    const timeline = buildTimeline([
      role("HEX", "Mar 2025 — Apr 2026"),
      role("ChessEver", "Apr 2025 — Apr 2026"),
      role("Endgame", "Apr 2026 — Aug 2026"),
    ]);
    expect(timeline.entries.map((e) => e.concurrent)).toEqual([true, true, false]);
  });

  it("travels in months: a line starts when its role did and lasts as long", () => {
    const timeline = buildTimeline([
      role("HEX", "Mar 2025 — Apr 2026"),
      role("ChessEver", "Apr 2025 — Apr 2026"),
      role("Endgame", "Apr 2026 — Aug 2026"),
    ]);
    const [hex, chess, endgame] = timeline.entries;
    expect(hex.delayMs).toBe(0);
    expect(chess.delayMs).toBeGreaterThan(0);
    expect(chess.delayMs).toBeLessThan(hex.drawMs);
    expect(endgame.delayMs).toBe(hex.delayMs + hex.drawMs);
    expect(endgame.drawMs).toBeLessThan(hex.drawMs);
  });

  it("keeps a long history inside one arrival", () => {
    const timeline = buildTimeline([role("Long", "Jan 2000 — Jan 2026")]);
    const last = timeline.entries[timeline.entries.length - 1];
    expect(last.delayMs + last.drawMs).toBeLessThanOrEqual(1400);
  });

  it("gives every millisecond and pixel a value both engines agree on", () => {
    // Written on the server, read in the browser: a value that differs in its
    // last place is a hydration mismatch React declines to patch.
    const timeline = buildTimeline(roles);
    for (const entry of timeline.entries) {
      expect(Number.isInteger(entry.delayMs)).toBe(true);
      expect(Number.isInteger(entry.drawMs)).toBe(true);
    }
    expect(timeline.template).not.toMatch(/\d\.\d/);
  });

  it("draws an unfinished role out to the end of the chart", () => {
    const timeline = buildTimeline([
      role("Done", "Jan 2025 — Jan 2026"),
      role("Going", "Jun 2025 — Present"),
    ]);
    const going = timeline.entries.find((e) => e.role.company === "Going")!;
    expect(going.span.end).toBe(parsePeriod("Jan 2026 — Jan 2026").start);
    expect(going.terminal).toBe(true);
  });

  it("takes no roles at all without inventing a chart", () => {
    expect(buildTimeline([])).toEqual({ entries: [], lanes: 0, rows: [], template: "" });
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
