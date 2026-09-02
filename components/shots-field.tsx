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
          className="relative col-span-1 overflow-hidden bg-surface-2 lg:[grid-column:span_var(--span)]"
          style={{ "--span": span, aspectRatio: `${item.width} / ${item.height}` } as React.CSSProperties}
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
