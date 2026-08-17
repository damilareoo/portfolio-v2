import Link from "next/link";
import type { ReactNode } from "react";
import { HalftoneDisc } from "@/components/halftone-disc";
import { SiteNav } from "@/components/site-nav";
import { Reveal } from "@/lib/reveal";
import { index, projects, selected, type WorkItem } from "@/data/work";
import { workAssets } from "@/data/assets.generated";
import { site } from "@/data/site";

/** Section headings are sentence case here, not mono — they title, not label. */
function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-[0.75rem] text-ink-2">{children}</h2>;
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="shrink-0 text-[0.625rem] text-ink-3 transition-colors group-hover:text-ink"
    >
      ↗
    </span>
  );
}

/** The project's real palette. Only shown where one is actually recorded. */
function Palette({ colors }: { colors?: string[] }) {
  if (!colors?.length) return null;
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {colors.map((hex, i) => (
        <span
          key={`${hex}-${i}`}
          style={{ background: hex }}
          className="size-[7px] rounded-full ring-[0.5px] ring-inset ring-black/20"
        />
      ))}
    </span>
  );
}

function cover(slug: string) {
  return workAssets[slug]?.[0];
}

/**
 * A selected card: the face above, and a bordered record below it carrying
 * everything the site actually knows about the piece.
 */
function SelectedCard({ item }: { item: WorkItem }) {
  const art = cover(item.slug);

  return (
    <Link href={`/work/${item.slug}`} className="group block">
      <div className="relative aspect-[16/11] overflow-hidden bg-surface-2">
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art.src} alt={item.title} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">
            {item.title}
          </span>
        )}
      </div>

      <div className="flex min-h-[74px] flex-col border-x border-b border-line px-2.5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[0.6875rem] leading-[1.35] text-ink">{item.oneLiner}</p>
          <Arrow />
        </div>
        {item.domain && (
          <p className="mt-1 font-mono text-[0.625rem] text-ink-3">{item.domain}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Palette colors={item.palette} />
          {item.category && (
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">
              {item.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** A work row: period on the left of a rule, the piece on the right of it. */
function WorkRow({ item }: { item: WorkItem }) {
  const art = cover(item.slug);
  const body = (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[0.75rem] font-medium tracking-tight text-ink">{item.title}</span>
        {item.href && <Arrow />}
      </div>
      <p className="mt-1 max-w-[34rem] text-[0.6875rem] leading-[1.45] text-ink-2">
        {item.oneLiner}
      </p>
      <div className="relative mt-3 aspect-[2/1] w-[112px] overflow-hidden border border-line bg-surface-2">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art.src} alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </div>
    </>
  );

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="pt-px text-[0.6875rem] text-ink-3">{item.period ?? item.year}</span>
      <div className="border-l border-line pb-9 pl-5">
        {item.href ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block">
            {body}
          </a>
        ) : (
          body
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const rest = [...projects, ...index];

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

      <section className="mt-10">
        <Heading>Selected Work</Heading>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {selected.map((item, i) => (
            <Reveal key={item.slug} index={i} as="article">
              <SelectedCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <Heading>Work</Heading>
        <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div>
            {rest.map((item, i) => (
              <Reveal key={item.slug} index={i}>
                <WorkRow item={item} />
              </Reveal>
            ))}
          </div>

          {/* The disc sits in the layout, not over it — it is part of the
              record, not a badge stuck to the corner of the window. */}
          <div className="flex justify-center lg:justify-end lg:pt-4">
            <HalftoneDisc />
          </div>
        </div>
      </section>

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
