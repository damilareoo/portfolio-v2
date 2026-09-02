import type { Metadata } from "next";
import { Chip, SectionLabel, Sheet } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Changelog — Damilare Osofisan",
  description: "Every version of this site, viewable at every point in time.",
};

export default function ChangelogPage() {
  return (
    <>
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center gap-1.5">
        <Chip variant="solid">Changelog</Chip>
        <Chip>{changelog.length} versions</Chip>
      </div>

      <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight sm:text-[2rem]">
        Every version, kept
      </h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-2">
        This site is built in the open. Each entry links to the exact
        deployment of that version, so nothing is ever lost to a redesign.
      </p>

      <div className="mt-10 space-y-5">
        {changelog.map((entry, i) => (
          <Sheet key={entry.version} className="p-5 sm:p-7">
            {/* Wraps rather than holds one line. Measured at 320: three chips
                and a date came to more than the sheet's inner width, and the
                "View this version" link — which could neither shrink nor drop
                — was pushed 7px past the viewport, giving every visit on the
                narrowest phone a horizontal scrollbar. The meta and the link
                are two things, so they are allowed to be two lines. */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
                <Chip variant="quiet">v{entry.version}</Chip>
                <span className="font-mono text-[0.6875rem] text-ink-3">{entry.date}</span>
                {i === 0 && <Chip variant="solid">Current</Chip>}
              </div>
              {entry.deployment && (
                <a
                  href={entry.deployment}
                  target="_blank"
                  rel="noopener noreferrer"
                  /* The site's own floor for something you press, the same one
                     the case-study bar and the instrument cards use. */
                  className="inline-flex min-h-[2.75rem] items-center rounded-full border border-line px-3.5 text-[0.75rem] font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  View this version
                </a>
              )}
            </div>

            <h2 className="mt-4 text-[1.0625rem] font-medium tracking-tight">{entry.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {entry.notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-[0.875rem] leading-relaxed text-ink-2">
                  <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-ink-3" />
                  {note}
                </li>
              ))}
            </ul>
          </Sheet>
        ))}
      </div>

      <div className="mt-10">
        <SectionLabel>How this works</SectionLabel>
        <p className="mt-3 max-w-lg text-[0.8125rem] leading-relaxed text-ink-2">
          Every deploy on Vercel gets an immutable URL that never changes and
          never goes away. When a version ships, its deployment URL is recorded
          here — the full history stays browsable even as the live site moves on.
        </p>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
