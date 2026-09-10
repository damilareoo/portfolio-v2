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
 * Held frames on plates, which is the reel's existing vocabulary for a phone
 * capture, so an app entry reads as the same kind of object as the two entries
 * that are not apps. The device treatment and the 22rem hold both come from
 * `CaseReel`; nothing new is drawn here.
 */

/**
 * How many screens a card spends.
 *
 * Four, in two plates of two, and the number is here rather than at the call
 * site because it is a layout decision and not a property of any listing:
 * Endgame publishes eight screens and ChessEver six, and a card that showed
 * every one of them would be a gallery with a product entry attached. The rest
 * are still on the rail inside the card, which is where a listing shows them
 * all and where scrolling them is the visitor's own business.
 */
export const SNIPS = 4;

/** Two to a plate, which is what puts them side by side from `sm` up. */
const PER_PLATE = 2;

/**
 * Two plates of screens, in the order the listing publishes them.
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
 */
export function appReel(app: AppCard): CaseBlock[] {
  const shots = app.shots.slice(0, SNIPS);
  const plates: CaseBlock[] = [];

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

  for (let at = 0; at < shots.length; at += PER_PLATE) {
    /* Destructured rather than mapped, because `inset` takes a one- or
       two-item tuple and a mapped array is neither until it is asserted to be
       one. An odd last screen is a plate of one, which the plate already
       draws. */
    const [first, second] = shots.slice(at, at + PER_PLATE);
    plates.push({
      kind: "inset",
      items: second
        ? [held(first, at + 1), held(second, at + 2)]
        : [held(first, at + 1)],
    });
  }

  /* The last plate is the dark one, as it is on every other reel — a card ends
     on the strong tone or it just stops. Only when there is a plate before it
     to end after: one plate on a strong ground is a card that opens dark. */
  const last = plates.at(-1);
  if (last && last.kind === "inset" && plates.length > 1) last.tone = "strong";

  return plates;
}
