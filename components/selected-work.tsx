import Link from "next/link";
import { selected, work } from "@/data/work";
import { TileFace, Tags, tileSurface } from "@/components/work-tile";

/**
 * The home rail no longer holds the archive — it holds the argument.
 * Two or three pieces with real room, and one route deeper into the site.
 */
export function SelectedWork() {
  return (
    <div className="flex h-full flex-col gap-[var(--pg-gap)]">
      {selected.map((item) => (
        // A strip, not a slide — the second piece has to peek in, or the set never reads.
        <Link key={item.slug} href={`/work/${item.slug}`} className="group block">
          <div
            className={`relative aspect-[21/9] overflow-hidden rounded-[var(--radius-tile)] border border-line transition-colors group-hover:border-ink-3 ${tileSurface(item)}`}
          >
            <TileFace item={item} markSize="text-[3.5rem]" sizes="(min-width: 1024px) 60vw, 92vw" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 className="text-[0.9375rem] font-medium tracking-tight">{item.title}</h2>
            <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
              {item.year}
            </span>
          </div>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">{item.oneLiner}</p>
          <div className="mt-2">
            <Tags items={item.disciplines} />
          </div>
        </Link>
      ))}

      <Link
        href="/work"
        className="group mt-auto flex items-center justify-between border-t border-line pt-4 text-[0.8125rem]"
      >
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          Archive
        </span>
        <span className="text-ink-2 transition-colors group-hover:text-ink">
          All work ({String(work.length).padStart(2, "0")}){" "}
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </Link>
    </div>
  );
}
