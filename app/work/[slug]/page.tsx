import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findWork, selected } from "@/data/work";
import { TileFace, tileSurface } from "@/components/work-tile";

export function generateStaticParams() {
  return selected.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findWork(slug);
  if (!item) return {};
  return {
    title: `${item.title} — Damilare Osofisan`,
    description: item.oneLiner,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      <span className="min-w-0 text-right text-[0.8125rem]">{children}</span>
    </div>
  );
}

export default async function CasePage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const item = findWork(slug);

  // Only selected work earns a case page; everything else lives in the archive.
  if (!item || item.tier !== "selected") notFound();

  // Cycles through selected work; with only one piece there is nowhere to go next.
  const position = selected.findIndex((w) => w.slug === item.slug);
  const next = selected.length > 1 ? selected[(position + 1) % selected.length] : null;

  return (
    <main className="mx-auto w-full max-w-[760px] px-[var(--pg-gap)] py-10">
      <Link
        href="/work"
        className="group inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
      >
        <span className="inline-block transition-transform group-hover:-translate-x-0.5">←</span>
        Work
      </Link>

      <header className="mt-10">
        <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight">{item.title}</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{item.oneLiner}</p>
      </header>

      <div
        className={`relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-window)] border border-line ${tileSurface(item)}`}
      >
        <TileFace item={item} markSize="text-[5rem]" sizes="(min-width: 760px) 760px, 92vw" />
      </div>

      <div className="mt-8">
        <Row label="Year">{item.year}</Row>
        <Row label="Disciplines">{item.disciplines.join(", ")}</Row>
        {item.href && (
          <Row label="Live">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
            >
              {new URL(item.href).hostname.replace(/^www\./, "")}
            </a>
          </Row>
        )}
      </div>

      {item.sections?.length ? (
        <div className="mt-12 space-y-10">
          {item.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[0.9375rem] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* No padding to fake depth — the site says what is true and points at the real thing. */
        <div className="mt-12 rounded-[var(--radius-tile)] border border-dashed border-line p-[var(--pad)]">
          <p className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            Case study in progress
          </p>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
            The write-up isn&apos;t finished yet.
            {item.href ? " The product is live in the meantime — that is the honest version." : ""}
          </p>
        </div>
      )}

      {next && (
        <nav className="mt-16 border-t border-line pt-5">
          <Link
            href={`/work/${next.slug}`}
            className="group flex items-baseline justify-between gap-4"
          >
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
              Next
            </span>
            <span className="text-[0.9375rem] font-medium tracking-tight transition-colors group-hover:text-ink-2">
              {next.title}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        </nav>
      )}
    </main>
  );
}
