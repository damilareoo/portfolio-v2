import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseReel } from "@/components/case-reel";
import { Frame } from "@/components/frame";
import { findWork, selected, type CaseBlock } from "@/data/work";
import { workAssets } from "@/data/assets.generated";

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

  const assets = workAssets[item.slug] ?? [];

  /* Old entries authored as prose sections still render — they become text
     blocks rather than being dropped on the floor. */
  const legacy: CaseBlock[] = (item.sections ?? []).map((section) => ({
    kind: "text",
    heading: section.heading,
    body: section.body,
  }));
  const blocks = item.blocks ?? legacy;

  /* Art with no blocks authored for it is still worth showing: the reel falls
     back to one full frame per asset, in filename order. */
  const reel: CaseBlock[] =
    blocks.length > 0
      ? blocks
      : assets.map<CaseBlock>((asset) => ({ kind: "full", alt: asset.title }));

  const position = selected.findIndex((w) => w.slug === item.slug);
  const next = selected.length > 1 ? selected[(position + 1) % selected.length] : null;

  return (
    <main className="mx-auto w-full max-w-[1180px] px-[var(--pg-gap)] py-8 sm:py-10">
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        {/* The rail — on a phone a band above the work, not a screen of chrome. */}
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-[4px] bg-surface-2 px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-ink"
          >
            <span className="inline-block transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            Home
          </Link>

          <h1 className="mt-7 text-[1.5rem] font-medium leading-tight tracking-tight">
            {item.title}
          </h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">{item.oneLiner}</p>

          <div className="mt-7">
            {item.client && <Row label="Client">{item.client}</Row>}
            <Row label="Year">{item.year}</Row>
            {item.role && <Row label="Role">{item.role}</Row>}
            <Row label="Discipline">{item.disciplines.join(", ")}</Row>
            {item.stack && <Row label="Stack">{item.stack}</Row>}
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
        </aside>

        {/* The column — the work itself. */}
        <div className="min-w-0">
          {reel.length > 0 ? (
            <CaseReel blocks={reel} assets={assets} />
          ) : (
            <>
              <Frame ratio="16 / 9" label={item.title} sizes="(min-width: 1024px) 62vw, 92vw" />
              {/* No padding to fake depth — the site says what is true. */}
              <div className="mt-[var(--pg-gap)] rounded-[var(--radius-tile)] border border-dashed border-line p-[var(--pad)]">
                <p className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
                  Case study in progress
                </p>
                <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-ink-2">
                  The write-up isn&apos;t finished yet.
                  {item.href
                    ? " The product is live in the meantime — that is the honest version."
                    : ""}
                </p>
              </div>
            </>
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
        </div>
      </div>
    </main>
  );
}
