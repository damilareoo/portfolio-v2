import type { CaseBlock } from "@/data/work";
import type { AppCard } from "@/lib/app-store";

/**
 * The reel an app entry gets, built from its store listing.
 *
 * *"then some snips for the other frames"* — for an app, the store's own
 * screenshots are the snips. They are the product's published marketing shots,
 * already correctly sized, already approved by the person who shipped them, and
 * they arrive in the same payload as the card. Nothing else the repo could put
 * here would be more honest than the pictures the product ships with.
 *
 * This is what closes a real gap rather than a theoretical one:
 * `public/work/chessever` holds exactly one file against six authored blocks,
 * so ChessEver's second frame has been rendering "Awaiting art" twice on the
 * live home page — a third of the card showing a hole. `public/work` has no
 * directory for Endgame at all.
 *
 * Held frames on a plate, which is the reel's existing vocabulary for a phone
 * capture, so an app entry reads as the same kind of object as the two entries
 * that are not apps. The device treatment and the 22rem hold both come from
 * `CaseReel`; nothing new is drawn here.
 *
 * **Where this plate stands is the whole of the layout decision.** It is
 * behind the fold, not under the card, and `Product` is what puts it there.
 * The card carries a rail of every screen the listing publishes; a plate of
 * the first two directly beneath it was the same two pictures twice inside one
 * screen — measured on a 375px phone, the rail's opening screen and the plate's
 * blow-up of it stood 1043px apart, which is the page showing a reader what
 * they had just finished looking at. Behind the control it is the opposite: a
 * visitor who opened the case wants the screens at reading size, and by then
 * the rail is a page and a half above them.
 */

/**
 * How many screens a card spends on the page outside its rail.
 *
 * Two, which is exactly *"then some snips for the other frames"* and exactly
 * what fits: `TAIL_BLOCKS` is 1, so one plate is all an app entry can render,
 * and a plate holds two frames. It was four while the reel was split across
 * the fold, and two of those four were built on every render into a second
 * plate that nothing drew. The rest of the listing is still on the rail inside
 * the card, which is where a listing shows them all and where scrolling them
 * is the visitor's own business.
 */
export const SNIPS = 2;

/**
 * One plate of screens, in the order the listing publishes them.
 *
 * In the listing's order, not reordered by anything this file could measure.
 * The sequence of screens on an App Store page is a decision somebody made
 * about how to introduce the product, and a portfolio re-cutting it would be
 * presenting its own edit of a listing as the listing.
 *
 * No captions. Every other reel on the site captions its frames — "The rail
 * becomes a row of chips", "sylvanlabs.com" — because somebody who made the
 * screen wrote the caption. Nothing here knows what is on these screens, and a
 * caption written to fill the slot would be the site describing a picture it is
 * looking at for the first time along with the reader.
 *
 * No `tone` either. The plate used to be the second of two and took the strong
 * ground, because a reel ends on the strong tone or it just stops. One plate
 * is not the end of a reel, it is the whole of one, and a single plate on the
 * strong ground is a card that opens dark for no reason.
 */
export function appReel(app: AppCard): CaseBlock[] {
  const shots = app.shots.slice(0, SNIPS);
  if (shots.length === 0) return [];

  const held = (src: string, n: number) => ({
    src,
    /* The device treatment and the 22rem hold that goes with it both live in
       `CaseReel`. This only says which kind of capture it is. */
    frame: "phone" as const,
    /* The listing's own shape, measured off its files — see `data/app-store.ts`
       for why it is per app and not one number for both. */
    ratio: app.shotRatio,
    alt: `${app.name} — screen ${n}`,
  });

  /* Destructured rather than mapped, because `inset` takes a one- or two-item
     tuple and a mapped array is neither until it is asserted to be one. A
     listing that publishes a single screen is a plate of one, which the plate
     already draws. */
  const [first, second] = shots;
  return [
    {
      kind: "inset",
      items: second ? [held(first, 1), held(second, 2)] : [held(first, 1)],
    },
  ];
}
