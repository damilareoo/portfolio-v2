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
 * How many blocks the fold adds when it opens.
 *
 * One, and that is the whole of the owner's instruction on it: *"after opening
 * case study leave one more frame and take out the rest"*. A card was two
 * blocks closed and up to seven open, which made the fold a door onto a second
 * page rather than onto the rest of a card.
 *
 * The blocks past it are not deleted and are not meant to be. `data/work.ts`
 * still holds every one of them — a deletion there is unrecoverable without git
 * and nobody asked for one — so raising this number is all it takes to show
 * them again.
 */
export const TAIL_BLOCKS = 1;

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
 *
 * The tail is bounded rather than "everything after the lede". That is the only
 * change of substance in this file and it is a rendering decision, not an edit
 * to the record: the reel keeps every block it was authored with, and this says
 * how many of them a card shows.
 */
export function splitBlocks(
  blocks: CaseBlock[],
  lede: number = LEDE_BLOCKS,
  tail: number = TAIL_BLOCKS,
) {
  const head = blocks.slice(0, lede);
  return {
    lede: head,
    rest: blocks.slice(lede, lede + tail),
    restAssetOffset: head.reduce((total, block) => total + blockAssetCost(block), 0),
  };
}
