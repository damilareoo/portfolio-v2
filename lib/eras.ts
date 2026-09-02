import type { CaseBlock } from "@/data/work";

/**
 * An era is a stretch of working life — a company, a contract, or the standing
 * category side projects fall into. It groups work by *when and for whom*,
 * which is the only hierarchy the home has now that tiers are gone.
 *
 * Entries are slugs rather than items: `data/work.ts` stays the one place a
 * piece is defined, and moving a piece between eras is a one-line edit.
 */
export type Era = {
  /** Anchor slug — the home links to `/#<id>` and the redirects land there. */
  id: string;
  name: string;
  role?: string;
  /** As displayed, e.g. "Apr 2026 — Aug 2026". Never parsed. */
  period: string;
  /**
   * The era's end, as a sortable prefix ("2026-08"). Empty means undated, and
   * an undated era sorts last — descending compare puts "" behind every real
   * date without a special case. Ordering is derived from this, never from the
   * order eras happen to be written in; ties fall back to authored order,
   * because Array.prototype.sort is stable.
   */
  sort: string;
  href?: string;
  blurb: string;
  entries: string[];
};

/** How many blocks stand above the fold of an entry before it must be opened. */
export const LEDE_BLOCKS = 2;

/**
 * Sort eras into reverse chronological order by end date, placing undated eras last.
 *
 * Ordering is derived from `sort` rather than from the authored array order,
 * so the home always reads newest first regardless of how eras are listed in
 * the data file. Ties fall back to authored order because Array.prototype.sort
 * is stable, and the function does not mutate the input.
 */
export function orderEras(eras: Era[]): Era[] {
  return [...eras].sort((a, b) => b.sort.localeCompare(a.sort));
}

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
