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
  it("spends four screens on two plates of two", () => {
    const reel = appReel(card(shots(8)));
    expect(reel).toHaveLength(2);
    for (const plate of reel) {
      expect(plate.kind).toBe("inset");
      if (plate.kind === "inset") expect(plate.items).toHaveLength(2);
    }
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

  it("ends on the strong plate, as every other reel does", () => {
    const reel = appReel(card(shots(4)));
    expect(reel[0].kind === "inset" && reel[0].tone).toBeUndefined();
    expect(reel[1].kind === "inset" && reel[1].tone).toBe("strong");
  });

  it("does not open a card on the dark plate when there is only one", () => {
    const reel = appReel(card(shots(2)));
    expect(reel).toHaveLength(1);
    expect(reel[0].kind === "inset" && reel[0].tone).toBeUndefined();
  });

  it("takes an odd last screen as a plate of one rather than dropping it", () => {
    const reel = appReel(card(shots(3)));
    expect(reel).toHaveLength(2);
    expect(reel[1].kind === "inset" && reel[1].items).toHaveLength(1);
  });

  it("draws nothing at all rather than an empty plate", () => {
    expect(appReel(card([]))).toEqual([]);
  });

  it("fits the three frames a card is allowed, counting the store card as one", () => {
    /* Phase 6 cut an opened card to three frames and a test pins the tail at
       one. The store card is the first of those three for an app entry, not a
       fourth thing added in front of them — so the reel behind it is exactly
       two blocks, and the split that `Product` performs leaves one open and one
       behind the control. */
    const reel = appReel(card(shots(8)));
    expect(reel).toHaveLength(LEDE_BLOCKS - 1 + TAIL_BLOCKS);
    const { lede, rest } = splitBlocks(reel, LEDE_BLOCKS - 1);
    expect(lede).toHaveLength(1);
    expect(rest).toHaveLength(TAIL_BLOCKS);
  });
});
