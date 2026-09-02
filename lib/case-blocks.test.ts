import { describe, expect, it } from "vitest";
import { blockAssetCost, splitBlocks } from "./case-blocks";
import type { CaseBlock } from "@/data/work";

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
