"use client";

import Image from "next/image";
import { motion, MotionConfig } from "motion/react";
import type { Tile } from "@/data/playground";

const aspectCls: Record<Tile["aspect"], string> = {
  square: "aspect-square",
  tall: "aspect-[3/4]",
  wide: "aspect-[4/3]",
};

function TileFace({ tile }: { tile: Tile }) {
  if (tile.kind === "image" && tile.image) {
    return (
      <Image
        src={tile.image}
        alt={tile.title}
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex h-full w-full items-center justify-center text-[56px] font-medium tracking-tight transition-transform duration-300 group-hover:scale-[1.06] ${
        tile.tone === "strong" ? "text-on-strong" : "text-ink"
      }`}
    >
      {tile.mark}
    </span>
  );
}

export function Playground({ tiles }: { tiles: Tile[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="columns-1 gap-4 sm:columns-2">
        {tiles.map((tile, i) => (
          <motion.a
            key={tile.slug}
            href={tile.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            whileHover={{ y: -3 }}
            className={`group relative mb-4 block overflow-hidden rounded-xl border border-line break-inside-avoid ${
              aspectCls[tile.aspect]
            } ${tile.tone === "strong" ? "bg-strong" : "bg-surface-2"}`}
          >
            <TileFace tile={tile} />
            <span className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3 pr-2.5 transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
              <span className="truncate text-[12px] font-medium tracking-tight text-ink">
                {tile.title}
              </span>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-ink-3">
                {tile.meta}
              </span>
            </span>
          </motion.a>
        ))}
      </div>
    </MotionConfig>
  );
}
