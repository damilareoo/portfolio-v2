import Link from "next/link";
import type { ReactNode } from "react";
import { Frame } from "@/components/frame";
import { GlyphBay } from "@/components/glyph-bay";
import { SiteNav } from "@/components/site-nav";
import { Tags } from "@/components/work-tile";
import { Reveal } from "@/lib/reveal";
import { selected, type WorkItem } from "@/data/work";
import { workAssets } from "@/data/assets.generated";
import { site } from "@/data/site";

/** A mono rule-and-label head, as the selected section carried in v1.0.0. */
function SectionHead({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      {right}
    </div>
  );
}

/** The first frame a project has is its face, so the home never invents artwork. */
function cover(slug: string) {
  return workAssets[slug]?.[0];
}

/**
 * A selected piece with real room: the face, then the title against its year,
 * then the one line that has to earn the click. No palette chips, no domain —
 * the argument is the work, and the metadata belongs on the case page.
 */
function SelectedPiece({ item, index }: { item: WorkItem; index: number }) {
  const art = cover(item.slug);

  return (
    <Link href={`/work/${item.slug}`} className="group block">
      <Frame
        src={art?.src}
        alt={item.title}
        width={art?.width}
        height={art?.height}
        ratio="16 / 10"
        label={item.title}
        priority={index === 0}
        sizes="(min-width: 640px) 45vw, 92vw"
        /* The face lifts a little under the pointer, as the v1.0.0 tiles did.
           Reduced-motion is handled globally, so this stays a plain hover. */
        className="group-hover:border-ink-3 [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out group-hover:[&_img]:scale-[1.02]"
      />
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
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6">
      <SiteNav current="/" />

      {/* The lockup. The apostrophe is the mark — a name in quotation. */}
      <header className="mt-12 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="text-[1.25rem] font-medium leading-tight tracking-tight">
            &rsquo;{site.name}
          </h1>
          <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-ink">
            Product designer and builder creating 0&ndash;1 experiences.
          </p>
          <p className="text-[0.8125rem] leading-snug text-ink-2">
            Specialising in interfaces, systems, and shipping them.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <a
            href={`mailto:${site.email}`}
            className="text-[0.8125rem] text-ink transition-colors hover:text-ink-2"
          >
            {site.email}
          </a>
          <p className="mt-0.5 text-[0.75rem] text-ink-3">{site.coordinates}</p>
        </div>
      </header>

      {/* The whole of the home's work now. The archive list is gone: four
          pieces with room read as an argument, a list reads as an inventory. */}
      <section className="mt-12">
        <SectionHead
          label="Selected"
          right={
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
              {String(selected.length).padStart(2, "0")} pieces
            </span>
          }
        />
        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2">
          {selected.map((item, i) => (
            <Reveal key={item.slug} index={i} as="article">
              <SelectedPiece item={item} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* The readouts lost their column when the list went. They sit with the
          footer now — instruments on the shelf, not badges stuck to the corner. */}
      <GlyphBay className="mt-16" />

      <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 pb-8">
        <a
          href={site.x}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
        >
          X
        </a>
        <a
          href={site.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
        >
          GitHub
        </a>
        <Link
          href="/colophon"
          className="text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
        >
          Colophon
        </Link>
      </footer>
    </main>
  );
}
