import { describe, expect, it } from "vitest";
import { appReel, SNIPS } from "./app-reel";
import { LEDE_BLOCKS, TAIL_BLOCKS, splitBlocks } from "./case-blocks";
import type { AppCard } from "./app-store";

const card = (shots: string[]): AppCard => ({
  slug: "app",
  storeUrl: "https://apps.apple.com/us/app/x/id1",
  name: "App",
  seller: "Seller",
  genre: "Games",
  rating: 4.5,
  ratingCount: 10,
  icon: "/apps/app/icon.jpg",
  shots,
  shotRatio: "626 / 1354",
  source: "live",
});

const shots = (n: number) => Array.from({ length: n }, (_, i) => `/s/${i + 1}.jpg`);

describe("the reel an app entry gets", () => {
  it("spends two screens on one plate", () => {
    const reel = appReel(card(shots(8)));
    expect(reel).toHaveLength(1);
    expect(reel[0].kind).toBe("inset");
    if (reel[0].kind === "inset") expect(reel[0].items).toHaveLength(2);
  });

  it("leaves the rest of the listing on the rail rather than on the page", () => {
    /* Endgame publishes eight screens and ChessEver six. A card that showed
       every one of them would be a gallery with a product entry attached; the
       rest are inside the card, where scrolling them is the visitor's business. */
    const used = appReel(card(shots(8))).flatMap((plate) =>
      plate.kind === "inset" ? plate.items.map((m) => m.src) : [],
    );
    expect(used).toHaveLength(SNIPS);
    expect(used).toEqual(shots(8).slice(0, SNIPS));
  });

  it("keeps the listing's own order", () => {
    // The sequence of screens on a store page is somebody's decision about how
    // to introduce the product. Re-cutting it would be presenting an edit of a
    // listing as the listing.
    const first = appReel(card(shots(4)))[0];
    expect(first.kind === "inset" && first.items.map((m) => m.src)).toEqual([
      "/s/1.jpg",
      "/s/2.jpg",
    ]);
  });

  it("gives every screen the phone treatment and the listing's own shape", () => {
    const reel = appReel(card(shots(4)));
    for (const plate of reel) {
      if (plate.kind !== "inset") continue;
      for (const media of plate.items) {
        expect(media.frame).toBe("phone");
        expect(media.ratio).toBe("626 / 1354");
        expect(media.alt).toMatch(/^App — screen \d$/);
      }
    }
  });

  it("stands on the quiet ground, never the dark one", () => {
    /* A reel ends on the strong tone or it just stops, and the plate took it
       while it was the second of two. One plate is the whole of a reel rather
       than the end of one, and a lone plate on the strong ground is a card that
       opens dark for no reason anybody could name. */
    const reel = appReel(card(shots(4)));
    expect(reel[0].kind === "inset" && reel[0].tone).toBeUndefined();
  });

  it("takes a listing that publishes one screen as a plate of one", () => {
    const reel = appReel(card(shots(1)));
    expect(reel).toHaveLength(1);
    expect(reel[0].kind === "inset" && reel[0].items).toHaveLength(1);
  });

  it("draws nothing at all rather than an empty plate", () => {
    expect(appReel(card([]))).toEqual([]);
  });

  it("fits the three frames a card is allowed, counting the store card as one", () => {
    /* Phase 6 cut an opened card to three frames and a test pins the tail at
       one. For an app entry the store card is the frame that stands open and
       this plate is the two behind the control — three in all, the same count
       every other product on the home is held to.

       Nothing here is left over. The plate is exactly the tail's one block, so
       an app entry with a lede of nothing renders every block this builds. A
       reel longer than `TAIL_BLOCKS` would be screens assembled on every render
       that no width of the page could ever draw. */
    const reel = appReel(card(shots(8)));
    expect(reel).toHaveLength(TAIL_BLOCKS);
    const { lede, rest } = splitBlocks(reel, 0);
    expect(lede).toHaveLength(0);
    expect(rest).toEqual(reel);
    /* The card, plus this plate's two screens: the same three frames a
       product that is not an app is held to. */
    expect(1 + SNIPS).toBe(LEDE_BLOCKS + TAIL_BLOCKS);
  });
});
