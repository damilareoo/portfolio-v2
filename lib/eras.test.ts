import { describe, expect, it } from "vitest";
import { blockAssetCost, orderEras, splitBlocks, type Era } from "./eras";
import type { CaseBlock } from "@/data/work";

const era = (id: string, sort: string): Era => ({
  id, name: id, period: "", sort, blurb: "", entries: [],
});

describe("orderEras", () => {
  it("puts the most recently ended era first", () => {
    const ordered = orderEras([era("old", "2025-04"), era("new", "2026-08")]);
    expect(ordered.map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("sorts an undated era last, however it was authored", () => {
    // Side projects have no end date and must not float to the top of a page
    // whose whole argument is reverse chronology.
    const ordered = orderEras([era("side", ""), era("dated", "2025-04")]);
    expect(ordered.map((e) => e.id)).toEqual(["dated", "side"]);
  });

  it("breaks a tie on authored order, and does not mutate its input", () => {
    const input = [era("first", "2026-04"), era("second", "2026-04")];
    expect(orderEras(input).map((e) => e.id)).toEqual(["first", "second"]);
    expect(input.map((e) => e.id)).toEqual(["first", "second"]);
  });
});

describe("blockAssetCost", () => {
  it("costs nothing for a block that carries no media", () => {
    expect(blockAssetCost({ kind: "text", body: ["a"] })).toBe(0);
    expect(blockAssetCost({ kind: "quote", body: "a" })).toBe(0);
  });

  it("costs nothing for media that names its own src", () => {
    expect(blockAssetCost({ kind: "full", src: "/work/a/1.png" })).toBe(0);
  });

  it("counts every slot that will fall through to the folder", () => {
    expect(blockAssetCost({ kind: "full" })).toBe(1);
    expect(blockAssetCost({ kind: "pair", items: [{}, {}] })).toBe(2);
    expect(blockAssetCost({ kind: "inset", items: [{ src: "/x.png" }, {}] })).toBe(1);
  });
});

describe("splitBlocks", () => {
  const blocks: CaseBlock[] = [
    { kind: "full" },
    { kind: "pair", items: [{}, {}] },
    { kind: "full" },
  ];

  it("keeps the first two blocks as the lede", () => {
    const { lede, rest } = splitBlocks(blocks);
    expect(lede).toHaveLength(2);
    expect(rest).toHaveLength(1);
  });

  it("tells the tail how many assets the lede already took", () => {
    // The regression this guards: two reels over one folder, the second
    // starting its counter at zero and re-showing the lede's frames.
    expect(splitBlocks(blocks).restAssetOffset).toBe(3);
  });

  it("honours a per-entry override", () => {
    expect(splitBlocks(blocks, 1).rest).toHaveLength(2);
    expect(splitBlocks(blocks, 1).restAssetOffset).toBe(1);
  });

  it("leaves an empty tail when the lede is the whole reel", () => {
    const { rest, restAssetOffset } = splitBlocks(blocks, 9);
    expect(rest).toEqual([]);
    expect(restAssetOffset).toBe(4);
  });
});
