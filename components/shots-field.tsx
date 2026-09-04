"use client";

import Image from "next/image";
import { PanelField } from "@/components/panel-field";
import { composeMosaic } from "@/lib/mosaic";
import type { Asset } from "@/data/assets.generated";

export function ShotsField({ shots }: { shots: Asset[] }) {
  const bands = composeMosaic(shots);

  return (
    /* Shot count is the revision: it only changes when the feed itself
       changes, and the observer has to be rebuilt with it or it spends the
       rest of the page watching frames that are no longer in the document. */
    <PanelField
      revision={shots.length}
      className="grid grid-cols-2 gap-[21px] lg:grid-cols-12"
      style={{ alignItems: "start" }}
    >
      {bands.flat().map(({ item, span }) => (
        <div
          key={item.src}
          data-frame
          /* `frame-cap` is the same rule the case frames carry — a shot may not
             be taller than the screen either. A band whose item is capped no
             longer fills the measure edge to edge, which is the honest cost of
             the whole picture being visible: the mosaic's rhythm is in the
             band widths, and a band that runs off the bottom of the screen has
             no rhythm to read. */
          className="frame-cap relative col-span-1 overflow-hidden bg-surface-2 lg:[grid-column:span_var(--span)]"
          style={
            {
              "--span": span,
              "--frame-ratio": item.width / item.height,
              aspectRatio: `${item.width} / ${item.height}`,
            } as React.CSSProperties
          }
        >
          <canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
          <Image
            src={item.src}
            alt={item.title}
            width={item.width}
            height={item.height}
            sizes="(min-width: 1024px) 50vw, 92vw"
            className="h-full w-full object-cover opacity-0"
          />
        </div>
      ))}
    </PanelField>
  );
}
