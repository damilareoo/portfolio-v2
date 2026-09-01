"use client";

import Image from "next/image";
import { PanelField } from "@/components/panel-field";
import { PITCH } from "@/lib/glyph/panel";
import {
  COLUMNS_NARROW,
  COLUMNS_WIDE,
  DRIFT,
  WIDE_QUERY,
  bucketShots,
} from "@/lib/shots-layout";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Asset } from "@/data/assets.generated";

export function ShotsField({ shots }: { shots: Asset[] }) {
  const columns = useMediaQuery(WIDE_QUERY) ? COLUMNS_WIDE : COLUMNS_NARROW;

  const buckets = bucketShots(shots, columns);

  return (
    /* Columns is the revision: crossing the breakpoint rebuilds the columns,
       and the observer has to be rebuilt with them or it spends the rest of
       the page watching frames that are no longer in the document. */
    <PanelField
      revision={columns}
      className="grid grid-cols-2 gap-[21px] lg:grid-cols-4"
      style={{ alignItems: "start" }}
    >
      {buckets.map((bucket, c) => (
        <div
          key={c}
          className="flex flex-col gap-[21px]"
          style={{ paddingTop: `${DRIFT[c % DRIFT.length] * PITCH}px` }}
        >
          {bucket.map((shot) => (
            <div
              key={shot.src}
              data-frame
              className="relative overflow-hidden bg-surface-2"
              style={{ aspectRatio: `${shot.width} / ${shot.height}` }}
            >
              <canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
              <Image
                src={shot.src}
                alt={shot.title}
                width={shot.width}
                height={shot.height}
                sizes="(min-width: 1024px) 24vw, 46vw"
                className="h-full w-full object-cover opacity-0"
              />
            </div>
          ))}
        </div>
      ))}
    </PanelField>
  );
}
