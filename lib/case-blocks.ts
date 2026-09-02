import type { CaseBlock } from "@/data/work";

/**
 * The arithmetic behind splitting one case reel into a lede and a tail over one
 * asset folder.
 *
 * A product on the home shows the first blocks of its reel openly and keeps the
 * rest behind an unfold. Both halves draw their art from the same folder, and
 * `CaseReel` fills empty slots with a counter that starts at zero — so the
 * split has to say how many frames the lede spent, or the tail shows them all
 * over again. That is the only reason this module exists, and it is deliberately
 * pure: no React, no data, just the counting.
 */

/** How many blocks stand above the fold of a product before it must be opened. */
export const LEDE_BLOCKS = 2;

/**
 * How many frames a block will take from its project's asset folder.
 *
 * Media that names its own `src` costs nothing: `CaseReel` only reaches for the
 * folder when a slot is empty.
 */
export function blockAssetCost(block: CaseBlock): number {
  switch (block.kind) {
    case "text":
    case "quote":
      return 0;
    case "pair":
    case "inset":
      return block.items.filter((media) => !media.src).length;
    default:
      return block.src ? 0 : 1;
  }
}

/**
 * Split a block list into a lede and a tail, returning the asset offset the tail needs.
 *
 * CaseReel fills any block without a `src` from the project's asset folder using a
 * positional counter that starts at zero. Split one reel into two and the second
 * starts counting from zero again — the tail would re-show the frames the lede
 * already used. `restAssetOffset` is how many assets the lede consumed, so the
 * caller can hand the tail `assets.slice(restAssetOffset)` and have the counter
 * pick up where the lede left off.
 */
export function splitBlocks(blocks: CaseBlock[], lede: number = LEDE_BLOCKS) {
  const head = blocks.slice(0, lede);
  return {
    lede: head,
    rest: blocks.slice(lede),
    restAssetOffset: head.reduce((total, block) => total + blockAssetCost(block), 0),
  };
}
