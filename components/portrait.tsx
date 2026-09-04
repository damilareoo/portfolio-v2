"use client";

import { Frame } from "@/components/frame";
import { PanelField } from "@/components/panel-field";
import { centreMidtone } from "@/lib/glyph/tone";

/**
 * Him, resolved out of the matrix.
 *
 * The one photograph on /about, and the only image on it, so it arrives the way
 * every other photograph on this site arrives: as a dot-matrix panel that
 * dissolves into the picture. That is `lib/glyph/sweep.ts` driving
 * `lib/glyph/panel.ts` — the *panel* renderer, whose emitters are all one size
 * and carry tone in brightness. It is not `lib/glyph/pixel.ts`, which draws the
 * dot language behind GlyphCell, GlyphIcon and GlyphText. The two are
 * constantly mistaken for each other and nothing here belongs to the second.
 *
 * **The arrival is the sweep's own and there is no second observer.** Law 4
 * wants this to resolve once on first sight and never again, and
 * `runPanelSweep` already is that: its IntersectionObserver unobserves each
 * frame the moment it is queued, and a visitor who asked for reduced motion is
 * given the photograph at full opacity immediately, never the journey to it.
 * Wrapping this in `useSeenOnce` as well would put two observers on one frame
 * and two opinions on what counts as arriving — which is the thing phase 4 was
 * told not to do, pointing the other way.
 *
 * `rootMargin="0px"` because this is a lone frame, not a batch. The sweep's
 * docblock says why: the default 220px lead is the shots grid's, where a batch
 * of tiles shares one front; a single frame's front spans only its own box, so
 * with the lead it finishes before the frame is anywhere a reader is looking.
 *
 * `tone` is the correction this photograph needs and nothing else does. It is a
 * night shot with a dark table and a dark shirt, so its levelled cell values
 * pile a third of the panel onto one brightness step — the extent is right and
 * the picture is a slab. `centreMidtone` lands the frame's median in the middle
 * of the panel's range; measured, the top step falls from 32% of the emitters
 * to 17%. It is passed here rather than folded into `panelFrom` because the
 * panel's constants are shared with every shot and case frame on the site.
 * Passing a function is what makes this a client component, which is honest:
 * the correction happens in the browser.
 */
export function Portrait({ className = "" }: { className?: string }) {
  return (
    <PanelField rootMargin="0px" tone={centreMidtone} className={className}>
      <Frame
        src="/about/portrait.png"
        /* Him, not the effect. A reader who cannot see the picture is owed
           what is in it, and the dissolve is not in it — it is how the page
           chose to draw it. */
        alt="Damilare in a cap and a dark polo shirt, leaning on a table at a restaurant at night."
        width={621}
        height={1104}
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 16rem, 74vw"
        preload
        panel
      />
    </PanelField>
  );
}
