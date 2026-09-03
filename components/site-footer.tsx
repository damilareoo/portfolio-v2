import Link from "next/link";
import { elsewhere, site } from "@/data/site";
import { changelog } from "@/data/changelog";
import { GlyphIcon } from "@/components/glyph-icon";
import { InstrumentWall } from "@/components/instrument-wall";

/**
 * The same footer the home page carries, for the routes that do not write their
 * own: the instrument wall edge to edge, and one quiet line beneath it.
 *
 * What went: the two-part row this used to end on — name and "Lagos, WAT" on
 * one side, links and a bordered version pill on the other. It was three
 * competing groups under four competing cards, which is the chaos the wall was
 * built to end. "Lagos, WAT" is now the wall's first reading, told by a clock;
 * saying it again in words is the echo this codebase keeps deleting. The
 * version keeps its place, because it is the only way to /changelog from here,
 * but it loses its pill: a boxed chip beside a hairline-ruled panel is one more
 * edge on a page that has just been given a single one.
 */
export function SiteFooter() {
  const current = changelog[0];
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <InstrumentWall />
      {/* The `rule-t` here is the wall's bottom edge — one pixel, drawn once. */}
      <div className="rule-t flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-xs">
        <span className="font-medium tracking-tight text-ink">{site.handle}</span>
        {elsewhere.map((place) => (
          <a
            key={place.label}
            href={place.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-2 transition-colors hover:text-ink"
          >
            {place.label}{" "}
            <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
          </a>
        ))}
        <a
          href={`mailto:${site.email}`}
          className="text-ink-2 transition-colors hover:text-ink"
        >
          Email{" "}
          <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
        </a>
        <Link
          href="/changelog"
          className="font-mono uppercase tracking-wider text-ink-3 transition-colors hover:text-ink"
        >
          v{current.version}
        </Link>
      </div>
    </footer>
  );
}
