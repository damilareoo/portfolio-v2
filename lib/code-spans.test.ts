import { describe, expect, it } from "vitest";
import { changelog } from "@/data/changelog";
import { splitTicks } from "./code-spans";

const said = (source: string) =>
  splitTicks(source)
    .map((span) => span.text)
    .join("");

describe("splitTicks", () => {
  it("leaves prose with no ticks in one piece", () => {
    expect(splitTicks("The picture is of somebody")).toEqual([
      { text: "The picture is of somebody", code: false },
    ]);
  });

  it("marks what a pair of ticks encloses", () => {
    expect(splitTicks("So `unsharp` runs first")).toEqual([
      { text: "So ", code: false },
      { text: "unsharp", code: true },
      { text: " runs first", code: false },
    ]);
  });

  it("takes every pair in a line, not only the first", () => {
    const spans = splitTicks("`a` and `b` and `c`");
    expect(spans.filter((s) => s.code).map((s) => s.text)).toEqual(["a", "b", "c"]);
  });

  it("drops the empty piece a leading tick leaves in front of it", () => {
    expect(splitTicks("`unsharp` first")[0]).toEqual({ text: "unsharp", code: true });
  });

  it("keeps an unclosed tick as the character it is", () => {
    expect(splitTicks("a note about `overflow")).toEqual([
      { text: "a note about ", code: false },
      { text: "`overflow", code: false },
    ]);
  });

  it("never loses or invents a character of prose", () => {
    /* The ticks themselves are the one thing allowed to go, and only when they
       are a matched pair. Everything else has to survive the trip. */
    for (const source of ["plain", "a `b` c", "`b`", "a `b", "``", "a``b"]) {
      expect(said(source).replace(/`/g, ""), source).toBe(source.replace(/`/g, ""));
    }
  });

  it("closes every tick it is actually given", () => {
    /* The notes are hand-written, so an odd tick is a typo rather than a
       feature. This is the check that catches it before it ships as prose with
       a stray backtick in the middle of it. */
    for (const entry of changelog) {
      for (const note of entry.notes) {
        const ticks = (note.match(/`/g) ?? []).length;
        expect(ticks % 2, `v${entry.version}: ${note.slice(0, 60)}`).toBe(0);
      }
    }
  });
});
