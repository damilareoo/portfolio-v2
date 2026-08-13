"use client";

import { useState } from "react";
import Link from "next/link";
import {
  activeDisciplines,
  index,
  projects,
  selected,
  type Discipline,
  type WorkItem,
} from "@/data/work";
import { TileFace, Tags, tileSurface } from "@/components/work-tile";
import { isPortfolio } from "@/lib/site-mode";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">{children}</p>
  );
}

/** Every row on this page is a labelled record: name on the left, year on the right. */
function Leader() {
  return (
    <span className="mx-2 min-w-4 flex-1 border-b border-dashed border-line sm:mx-3 sm:min-w-6" />
  );
}

function SelectedRow({ item }: { item: WorkItem }) {
  return (
    <Link
      href={`/work/${item.slug}`}
      className="group grid gap-4 border-b border-line py-5 last:border-b-0 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]"
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-[var(--radius-tile)] border border-line transition-colors group-hover:border-ink-3 ${tileSurface(item)}`}
      >
        <TileFace item={item} markSize="text-[2.5rem]" sizes="(min-width: 640px) 240px, 92vw" />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline">
          <h3 className="text-[1rem] font-medium tracking-tight">{item.title}</h3>
          <Leader />
          <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            {item.year}
          </span>
        </div>
        <p className="mt-1.5 max-w-prose text-[0.875rem] leading-relaxed text-ink-2">
          {item.oneLiner}
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <Tags items={item.disciplines} />
          <span className="text-[0.75rem] text-ink-3 transition-colors group-hover:text-ink-2">
            Case study →
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProjectTile({ item }: { item: WorkItem }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-[var(--radius-tile)] border border-line transition-colors group-hover:border-ink-3 ${tileSurface(item)}`}
      >
        <TileFace item={item} markSize="text-[3rem]" sizes="(min-width: 1024px) 30vw, 92vw" />
      </div>
      <div className="mt-2.5 flex items-baseline">
        <h3 className="text-[0.875rem] font-medium tracking-tight">{item.title}</h3>
        <Leader />
        <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          {item.year}
        </span>
      </div>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">{item.oneLiner}</p>
      <div className="mt-1.5">
        <Tags items={item.disciplines} />
      </div>
    </a>
  );
}

function IndexRow({ item }: { item: WorkItem }) {
  const Row = (
    <>
      <span className="text-[0.875rem]">{item.title}</span>
      <Leader />
      <Tags items={item.disciplines} />
      <span className="ml-3 shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {item.year}
      </span>
    </>
  );
  return item.href ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-baseline border-b border-line py-2.5 text-ink-2 transition-colors last:border-b-0 hover:text-ink"
    >
      {Row}
    </a>
  ) : (
    <div className="flex items-baseline border-b border-line py-2.5 text-ink-2 last:border-b-0">
      {Row}
    </div>
  );
}

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2">
        <Label>{label}</Label>
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          {String(count).padStart(2, "0")}
        </span>
      </div>
      {children}
    </section>
  );
}

export function WorkArchive({ lastUpdated }: { lastUpdated: string }) {
  const [active, setActive] = useState<Discipline | null>(null);

  const match = (item: WorkItem) => !active || item.disciplines.includes(active);
  const s = selected.filter(match);
  const p = projects.filter(match);
  const i = index.filter(match);
  const total = s.length + p.length + i.length;

  const nav = [
    { href: "/", label: "Home" },
    { href: "/work", label: "Work" },
    ...(isPortfolio
      ? []
      : [
          { href: "/system", label: "System" },
          { href: "/changelog", label: "Changelog" },
        ]),
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-10 px-[var(--pg-gap)] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
      {/* Left column — the record about the page itself */}
      <div className="lg:sticky lg:top-10 lg:self-start">
        <Link href="/" className="text-[0.9375rem] font-medium tracking-tight">
          Damilare Osofisan
        </Link>

        {/* On a phone this column is a compact band, not a stacked sidebar —
            work has to start near the fold, not below a full screen of chrome. */}
        <div className="mt-6 lg:mt-8">
          <Label>Navigation</Label>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 lg:block lg:space-y-1.5">
            {nav.map((item, n) => (
              <li key={item.href} className="flex gap-2 text-[0.875rem]">
                <span className="font-mono text-[0.75rem] text-ink-3">
                  {String(n + 1).padStart(2, "0")}.
                </span>
                {item.href === "/work" ? (
                  <span className="underline decoration-line underline-offset-4">
                    {item.label} <span className="text-ink-3">←</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 lg:mt-8">
          <Label>Last updated</Label>
          <p className="mt-2 text-[0.875rem] text-ink-2">{lastUpdated}</p>
        </div>

        <div className="mt-6 lg:mt-8">
          <Label>Filter</Label>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 lg:block lg:space-y-1.5">
            <li>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-pressed={active === null}
                className={`text-left text-[0.875rem] transition-colors ${
                  active === null
                    ? "underline decoration-line underline-offset-4"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                All
              </button>
            </li>
            {activeDisciplines.map((d) => (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => setActive(active === d ? null : d)}
                  aria-pressed={active === d}
                  className={`text-left text-[0.875rem] transition-colors ${
                    active === d
                      ? "underline decoration-line underline-offset-4"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {d}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right column — the work, tiered */}
      <div className="min-w-0">
        {s.length > 0 && (
          <Section label="Selected" count={s.length}>
            <div>
              {s.map((item) => (
                <SelectedRow key={item.slug} item={item} />
              ))}
            </div>
          </Section>
        )}

        {p.length > 0 && (
          <Section label="Projects" count={p.length}>
            <div className="grid gap-[var(--pg-gap)] sm:grid-cols-2 xl:grid-cols-3">
              {p.map((item) => (
                <ProjectTile key={item.slug} item={item} />
              ))}
            </div>
          </Section>
        )}

        {i.length > 0 && (
          <Section label="Index" count={i.length}>
            <div>
              {i.map((item) => (
                <IndexRow key={item.slug} item={item} />
              ))}
            </div>
          </Section>
        )}

        {total === 0 && (
          <p className="text-[0.875rem] text-ink-2">
            Nothing filed under {active}. <button
              type="button"
              onClick={() => setActive(null)}
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              Show all
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
