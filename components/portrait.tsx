"use client";

import { Frame } from "@/components/frame";
import { PanelField } from "@/components/panel-field";
import { centreMidtone } from "@/lib/glyph/tone";

/**
 * Him, resolved out of the matrix, across the whole measure.
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
 * **Full width, which means the slot is a band and the picture is cropped into
 * it.** The file is a phone portrait, 621x1104, and a 9:16 frame cannot go full
 * width on this site — `.frame-cap` holds every frame under 78svh, so a
 * portrait spanning a 1192px column would be capped straight back to about
 * 400px and centred, which is the column it already had. So the slot is
 * declared 16:9 and `object-cover` takes the band out of the middle of the
 * file. At 1192px that is 1192x670, inside the cap with room to spare, and the
 * picture is genuinely the width of the page.
 *
 * The crop is placed rather than centred, which is what `position` was added
 * for. A 16:9 band shows 32% of this file's height; taken from the middle it
 * starts below the peak of the cap and the picture loses the top of his head.
 * 32% down puts the band at roughly a quarter to a half of the frame, which is
 * cap to chest — the part of a portrait a reader came for.
 *
 * The file itself is the limit, and it is worth saying out loud: 621px wide is
 * all there is, so a 1192px band is the picture enlarged about twice. It is a
 * phone photograph and it reads as one. A sharper full-width portrait needs a
 * larger file, not a different treatment here.
 *
 * The pitch does not change with the width, and that is what makes this worth
 * doing. `lib/glyph/panel.ts` lays emitters every 7px whatever the box, so a
 * 384px column was 55 columns of dots and 1192px is 170: the same picture at
 * three times the resolution, dissolving through three times as many cells.
 * `centreMidtone` re-derives its exponent from whatever frame it is handed, so
 * the correction follows the frame rather than being fitted to one, and it
 * still earns its place at the new width. Measured on the band at 1192px: the
 * levelled median is 0.631 where the whole file's was 0.728 — the crop drops
 * the dark table and floor that were doing most of the piling — and the top
 * brightness step falls from 16.5% of the emitters to 12.0% with the
 * correction, the busiest step from 4.7x the quietest to 1.7x. The same ten
 * steps are in use either way; `CEIL` decides that. The old numbers were 32.2%
 * and 13.6x, so both halves improved and neither made the other redundant.
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
        /* A band, not the file's own shape. See the docblock: the intrinsic
           `width`/`height` went with the column, because handing them over is
           what made the slot 9:16 and 9:16 is what cannot go full width. */
        ratio="16 / 9"
        position="50% 32%"
        sizes="100vw"
        preload
        panel
      />
    </PanelField>
  );
}
