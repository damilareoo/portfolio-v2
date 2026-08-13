import Image from "next/image";
import type { WorkItem } from "@/data/work";

/**
 * The face of a piece of work — artwork when it exists, a letterform until then.
 * Nothing here moves on its own; the scale shift belongs to the parent's hover.
 */
export function TileFace({
  item,
  markSize = "text-[3.5rem]",
  sizes = "(min-width: 1024px) 30vw, 90vw",
}: {
  item: WorkItem;
  markSize?: string;
  sizes?: string;
}) {
  if (item.image) {
    return (
      <Image
        src={item.image}
        alt={item.title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex h-full w-full items-center justify-center font-medium tracking-tight transition-transform duration-300 group-hover:scale-[1.06] ${markSize} ${
        item.tone === "strong" ? "text-on-strong" : "text-ink"
      }`}
    >
      {item.mark}
    </span>
  );
}

export function tileSurface(item: WorkItem) {
  return item.tone === "strong" ? "bg-strong" : "bg-surface-2";
}

/** Discipline tags — the metadata is the aesthetic, so it is never decoration. */
export function Tags({ items }: { items: readonly string[] }) {
  return (
    <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
      {items.join(" · ")}
    </span>
  );
}
