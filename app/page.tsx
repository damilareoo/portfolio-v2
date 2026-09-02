import Link from "next/link";
import { EraSection } from "@/components/era-section";
import { GlyphBay } from "@/components/glyph-bay";
import { SiteNav } from "@/components/site-nav";
import { RecordRow } from "@/components/ui";
import { orderEras } from "@/lib/eras";
import { eras } from "@/data/eras";
import { elsewhere, expertise, site } from "@/data/site";

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

      {/* The lockup. The apostrophe is the mark — a name in quotation. */}
      <header className="mt-12">
        <h1 className="text-lg font-medium leading-tight tracking-tight">
          &rsquo;{site.name}
        </h1>
        <p className="mt-1.5 max-w-[38rem] text-base font-medium leading-snug text-ink">
          Product designer and builder creating 0&ndash;1 experiences.
        </p>
        <p className="max-w-[38rem] text-base leading-snug text-ink-2">
          Specialising in interfaces, systems, and shipping them.
        </p>

        {/* The record the reference carries under its lockup. Static: a marquee
            is exactly the ambient motion Law 4 forbids. */}
        <div className="mt-8 max-w-[44rem]">
          <RecordRow label="Location">{site.coordinates} &middot; Lagos</RecordRow>
          <RecordRow label="Expertise">{expertise.join(" · ")}</RecordRow>
          <RecordRow label="Contact">
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
            >
              {site.email}
            </a>
          </RecordRow>
          <RecordRow label="Elsewhere">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {elsewhere.map((place) => (
                <a
                  key={place.label}
                  href={place.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  {place.label}
                </a>
              ))}
            </span>
          </RecordRow>
        </div>
      </header>

      <div className="mt-14 space-y-16">
        {ordered.map((era, i) => (
          <EraSection key={era.id} era={era} index={i} />
        ))}
      </div>

      <GlyphBay className="mt-20" />

      <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 rule-t pt-5 pb-8">
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
      </footer>
    </main>
  );
}
