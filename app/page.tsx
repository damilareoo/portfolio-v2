import Link from "next/link";
import { EraSection } from "@/components/era-section";
import { GlyphBay } from "@/components/glyph-bay";
import { GlyphIcon } from "@/components/glyph-icon";
import { InstrumentPair } from "@/components/instrument-pair";
import { SiteNav } from "@/components/site-nav";
import { orderEras } from "@/lib/eras";
import { eras } from "@/data/eras";
import { elsewhere, site } from "@/data/site";

/**
 * The home is the work.
 *
 * There is no index and no selected grid: a lockup, a short record, then the
 * eras themselves. The reference this came from removes its nav for the same
 * reason — if the work is the page, there is nowhere else it could be. The nav
 * stays here only because /shots, /about and /colophon still exist.
 */
export default function Home() {
  const ordered = orderEras(eras);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6">
      <SiteNav current="/" />

      {/* One band, not a section. The record table it replaces read as a form,
          and ten comma-separated skills was the least evidential thing on the
          page — the work below argues it better. Contact and Elsewhere moved to
          the footer, where a reader looks once they have seen something worth
          writing about. */}
      <header className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-6 pb-8">
        <div className="min-w-0">
          <h1 className="text-lg font-medium leading-tight tracking-tight">
            &rsquo;{site.name} <span className="text-ink-3">·</span>{" "}
            <span className="font-normal text-ink-2">Product designer</span>
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Lagos ·{" "}
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
            >
              {site.email}
            </a>
          </p>
        </div>
        <InstrumentPair size={56} />
      </header>

      <div className="mt-14 space-y-16">
        {ordered.map((era, i) => (
          <EraSection key={era.id} era={era} index={i} />
        ))}
      </div>

      <GlyphBay className="mt-20" />

      {/* Closes on the same two readings the header opened on — larger, so the
          echo reads as deliberate rather than a re-used component by accident.
          Elsewhere sits here rather than in the header because a reader looks
          for contact after seeing the work, not before it. */}
      <footer className="mt-8 rule-t pt-6 pb-8">
        <InstrumentPair size={72} />
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/shots"
            className="text-xs text-ink-2 transition-colors hover:text-ink"
          >
            Shots
          </Link>
          <Link
            href="/colophon"
            className="text-xs text-ink-2 transition-colors hover:text-ink"
          >
            Colophon
          </Link>
          {elsewhere.map((place) => (
            <a
              key={place.label}
              href={place.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ink-2 transition-colors hover:text-ink"
            >
              {place.label}{" "}
              <GlyphIcon
                name="arrow-out"
                size="0.5rem"
                className="inline-block align-baseline"
              />
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
