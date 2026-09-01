import { describe, expect, it } from "vitest";
import { eras } from "./eras";
import { work } from "./work";
import { orderEras } from "@/lib/eras";

describe("the eras", () => {
  it("names only slugs that exist", () => {
    const slugs = new Set(work.map((item) => item.slug));
    for (const era of eras) {
      for (const slug of era.entries) expect(slugs, era.id).toContain(slug);
    }
  });

  it("gives every piece of work exactly one era", () => {
    // A piece in two eras renders twice; a piece in none is invisible, and the
    // home is the only surface work has now.
    const placed = eras.flatMap((era) => era.entries);
    expect([...placed].sort()).toEqual(work.map((item) => item.slug).sort());
  });

  it("uses each id once, because ids are anchors", () => {
    const ids = eras.map((era) => era.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reads newest first with side projects last", () => {
    const ordered = orderEras(eras).map((era) => era.id);
    expect(ordered[0]).toBe("endgame");
    expect(ordered.at(-1)).toBe("side-projects");
  });
});
