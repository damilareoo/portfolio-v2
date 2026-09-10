import { Frame } from "@/components/frame";
import { PanelField } from "@/components/panel-field";
import { PITCH } from "@/lib/glyph/panel";
import { PAIR_NARROW, PAIR_WIDE, TRACKS, composeShots, trackClass } from "@/lib/shots-layout";
import type { Asset } from "@/data/assets.generated";

/**
 * What each frame tells the browser it will be drawn at.
 *
 * Three values, one per span the cadence can produce, and every one of them is
 * the arithmetic in `lib/shots-layout.ts` carried out at two widths: the
 * measure stops growing at 1320px, so above that a frame is a fixed number of
 * pixels, and between `lg` and there it is a fraction of the window. Below
 * `lg` there is one track and every frame takes the measure, which at 375px is
 * 89% of the window and at 768px is 94% — the higher of the two, because
 * asking for a file slightly too large costs bytes and asking for one too
 * small costs the picture.
 *
 * The frame cap can still narrow any of these on a short screen. It is not
 * expressible here — `sizes` has no viewport-height unit — and it does not
 * need to be: it only ever makes the drawn frame smaller than the hint.
 */
const SIZES: Record<number, string> = {
  [TRACKS]: "(min-width: 1368px) 1272px, (min-width: 1024px) 95vw, 96vw",
  [PAIR_WIDE]: "(min-width: 1368px) 730px, (min-width: 1024px) 55vw, 96vw",
  [PAIR_NARROW]: "(min-width: 1368px) 521px, (min-width: 1024px) 40vw, 96vw",
};

/**
 * The shots feed, composed rather than packed. See `lib/shots-layout.ts` for
 * the cadence and why it replaced four balanced columns.
 *
 * Not a client component any more, and that is the layout change showing up in
 * the bundle. The old field asked `matchMedia` how many columns to build and
 * then built them in JavaScript, which meant the whole grid was client work
 * and — worse — that crossing `lg` rebuilt the buckets, remounted every frame
 * and swept the page a second time. A frame that dissolves again because the
 * window was resized is a performance, which is the one thing Law 4 forbids of
 * an arrival. The twelve-track grid collapses to one track in CSS, so the
 * frames are the same elements at every width and each one still arrives
 * exactly once. `PanelField`'s revision is back to the feed's own length,
 * which is what its documentation always said this caller passed.
 */
export function ShotsField({ shots }: { shots: Asset[] }) {
  return (
    <PanelField
      revision={shots.length}
      /* No lead. The default 220px was measured against 302px tiles arriving
         several at a time and sharing one wavefront; a full-measure frame here
         is 702px tall on a 1440x900 screen and has no batch to share with, so
         its own 620ms dissolve fits inside 220px of early arrival plus its own
         height and finishes before any of it is on screen. The sweep would run
         correctly and invisibly and the panel — the entire reason a photograph
         arrives this way — would never be seen. The same reasoning, and the
         same value, as the full-bleed case frames on the home page. */
      rootMargin="0px"
      className="grid grid-cols-1 gap-x-[21px] gap-y-[42px] lg:grid-cols-12 lg:gap-y-[63px]"
      /* Runs are not rows of equal height and must not be stretched into any.
         A frame is sized by its width and its own ratio; `stretch` would hand
         the shorter half of a run the taller half's height. */
      style={{ alignItems: "start" }}
    >
      {composeShots(shots).map(({ shot, place }, index) => (
        <div
          key={shot.src}
          /* The drift is a custom property rather than a padding written
             inline, because it must only apply where the runs exist. Below
             `lg` every frame is on its own row and a frame pushed down its own
             row is just a bigger gap. */
          style={{ "--shot-drift": `${place.drift * PITCH}px` } as React.CSSProperties}
          className={`${trackClass(place)} lg:pt-[var(--shot-drift)]`}
        >
          <Frame
            src={shot.src}
            alt={shot.title}
            width={shot.width}
            height={shot.height}
            sizes={SIZES[place.span]}
            /* Exactly one frame on the page asks, and at this scale it is the
               LCP candidate by a wide margin: the first shot is drawn at
               1248px on a 1440x900 screen, where the whole feed used to fit
               above the fold at 302px each. */
            preload={index === 0}
            panel
          />
        </div>
      ))}
    </PanelField>
  );
}
