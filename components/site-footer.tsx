import Link from "next/link";
import { elsewhere, site } from "@/data/site";
import { changelog } from "@/data/changelog";
import { GlyphIcon } from "@/components/glyph-icon";
import { InstrumentPair } from "@/components/instrument-pair";

export function SiteFooter() {
  const current = changelog[0];
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <div className="rule-t pt-6">
        <InstrumentPair size={72} />
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-tight">damilareoo</span>
            <span className="text-sm text-ink-3">Lagos, WAT</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {elsewhere.map((place) => (
              <a
                key={place.label}
                href={place.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-2 transition-colors hover:text-ink"
              >
                {place.label} <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
              </a>
            ))}
            <a
              href={`mailto:${site.email}`}
              className="text-sm text-ink-2 transition-colors hover:text-ink"
            >
              Email <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
            </a>
            <Link
              href="/changelog"
              className="rounded-full border border-line px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-ink-2 transition-colors hover:text-ink"
            >
              v{current.version}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
