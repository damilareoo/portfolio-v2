import Link from "next/link";
import { GlyphIcon } from "@/components/glyph-icon";
import { InstrumentBank } from "@/components/instrument-bank";
import { Product } from "@/components/product";
import { SiteNav } from "@/components/site-nav";
import { workAssets } from "@/data/assets.generated";
import { elsewhere, site } from "@/data/site";
import { work } from "@/data/work";

/**
 * The home is the work.
 *
 * There is no index and no selected grid: a lockup, a short record, then three
 * products, numbered, in the order `data/work.ts` lists them. The era layer
 * that used to group them by employer is gone — it spent two of its five
 * sections announcing it had nothing to show, which is furniture arguing with
 * itself. The reference this came from removes its nav for the same reason —
 * if the work is the page, there is nowhere else it could be. The nav stays
 * here only because /shots, /about and /colophon still exist.
 */
export default function Home() {
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
          <h1 className="max-w-[24ch] text-xl font-medium leading-[1.15] tracking-tight">
            I design and build the parts of a product people actually touch.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-2">
            Interfaces, identity, and the systems underneath them — taken from
            nothing to shipped. Most recently for chess platforms and a revenue
            intelligence tool.
          </p>
          <p className="mt-5 text-sm text-ink-3">
            &rsquo;{site.name} · Lagos ·{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
            >
              {site.email}
            </a>
          </p>
        </div>
      </header>

      <div className="space-y-20">
        {work.map((item, i) => (
          <Product key={item.slug} item={item} assets={workAssets[item.slug] ?? []} index={i} />
        ))}
      </div>

      {/* Closes on the same two readings the header opened on — larger, so the
          echo reads as deliberate rather than a re-used component by accident.
          Elsewhere sits here rather than in the header because a reader looks
          for contact after seeing the work, not before it. */}
      <footer className="mt-8 rule-t pt-6 pb-8">
        <InstrumentBank />
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
