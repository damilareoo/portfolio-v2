import Link from "next/link";
import type { ReactNode } from "react";
import { CopyEmail } from "@/components/copy-email";
import { Frame } from "@/components/frame";
import { HalftoneDisc } from "@/components/halftone-disc";
import { LiveClock } from "@/components/live-clock";
import { SiteNav } from "@/components/site-nav";
import { ValueStrip } from "@/components/value-strip";
import { Reveal } from "@/lib/reveal";
import { index, projects, selected } from "@/data/work";
import { workAssets } from "@/data/assets.generated";
import { site } from "@/data/site";
import { changelog } from "@/data/changelog";

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

function SectionHead({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <Label>{label}</Label>
      {right}
    </div>
  );
}

/** The first frame a project has is its face, so the home never invents artwork. */
function cover(slug: string) {
  return workAssets[slug]?.[0];
}

export default function Home() {
  const rest = [...projects, ...index];
  const current = changelog[0];

  return (
    <main className="mx-auto w-full max-w-[1180px] px-[var(--pg-gap)] py-8 sm:py-10">
      <SiteNav current="/" />

      {/* The lockup — who, and what for. */}
      <header className="mt-16 max-w-[42rem] sm:mt-24">
        <h1 className="text-[1.75rem] font-medium leading-[1.15] tracking-tight sm:text-[2.25rem]">
          Damilare Osofisan
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink-2 sm:text-[1.125rem]">
          Product designer and builder creating 0–1 experiences. I design
          products, build what makes them work, and ship them.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[0.8125rem] text-ink-2">Lagos, Nigeria</span>
          <span className="text-[0.8125rem] text-ink-3">
            <LiveClock />
          </span>
        </div>
      </header>

      {/* Selected — the argument, with room. */}
      <section className="mt-16 sm:mt-20">
        <SectionHead
          label="Selected"
          right={<Label>{String(selected.length).padStart(2, "0")} pieces</Label>}
        />
        <div className="grid gap-x-[var(--pg-gap)] gap-y-9 sm:grid-cols-2">
          {selected.map((item, i) => {
            const art = cover(item.slug);
            return (
              <Reveal key={item.slug} index={i} as="article">
                <Link href={`/work/${item.slug}`} className="group block">
                  <Frame
                    src={art?.src}
                    alt={item.title}
                    width={art?.width}
                    height={art?.height}
                    ratio="16 / 10"
                    label={item.title}
                    priority={i === 0}
                    sizes="(min-width: 640px) 45vw, 92vw"
                    className="group-hover:border-ink-3"
                  />
                  <div className="mt-3.5 flex items-baseline justify-between gap-4">
                    <h2 className="text-[1rem] font-medium tracking-tight">{item.title}</h2>
                    <Label>{item.year}</Label>
                  </div>
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-2">
                    {item.oneLiner}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
                      {item.disciplines.join(" · ")}
                    </span>
                    <ValueStrip palette={item.palette} />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Work — the dated record. Everything that is not an argument. */}
      <section className="mt-16 sm:mt-20">
        <SectionHead
          label="Work"
          right={
            <Link
              href="/work"
              className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-2 transition-colors hover:text-ink"
            >
              Archive →
            </Link>
          }
        />
        <ul>
          {rest.map((item, i) => {
            const art = cover(item.slug);
            const row = (
              <>
                <span className="relative size-11 shrink-0 overflow-hidden rounded-[calc(var(--radius-tile)*0.6)] border border-line bg-surface-2">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art.src}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[0.875rem] font-medium text-ink-3">
                      {item.mark ?? item.title.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="truncate text-[0.9375rem] font-medium tracking-tight">
                      {item.title}
                    </span>
                    <Label>{item.year}</Label>
                  </span>
                  <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-2">
                    {item.oneLiner}
                  </span>
                </span>
              </>
            );

            return (
              <Reveal key={item.slug} index={i} as="li">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 border-b border-line py-3.5 transition-colors hover:border-ink-3"
                  >
                    {row}
                  </a>
                ) : (
                  <div className="flex items-center gap-4 border-b border-line py-3.5">{row}</div>
                )}
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* The record about the site itself. */}
      <footer className="mt-16 border-t border-line pt-6 sm:mt-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[20rem]">
            <Label>Contact</Label>
            <div className="mt-2.5">
              <CopyEmail email={site.email} />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <a
                href={site.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
              >
                X
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
              >
                GitHub
              </a>
              <Link
                href="/about"
                className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
              >
                Colophon
              </Link>
            </div>
          </div>

          {/* On a phone the disc sits in the record rather than floating over it. */}
          <HalftoneDisc />
        </div>

        <p className="mt-8 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          v{current.version} · {current.date}
        </p>
      </footer>
    </main>
  );
}
