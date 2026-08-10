import type { Metadata } from "next";
import { Chip, SectionLabel, Sheet } from "@/components/ui";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Changelog — Damilare Osofisan",
  description: "Every version of this site, viewable at every point in time.",
};

export default function ChangelogPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center gap-1.5">
        <Chip variant="solid">Changelog</Chip>
        <Chip>{changelog.length} versions</Chip>
      </div>

      <h1 className="text-[28px] font-medium leading-tight tracking-tight sm:text-[32px]">
        Every version, kept
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
        This site is built in the open. Each entry links to the exact
        deployment of that version, so nothing is ever lost to a redesign.
      </p>

      <div className="mt-10 space-y-5">
        {changelog.map((entry, i) => (
          <Sheet key={entry.version} className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Chip variant="quiet">v{entry.version}</Chip>
                <span className="font-mono text-[11px] text-ink-3">{entry.date}</span>
                {i === 0 && <Chip variant="solid">Current</Chip>}
              </div>
              {entry.deployment && (
                <a
                  href={entry.deployment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  View this version
                </a>
              )}
            </div>

            <h2 className="mt-4 text-[17px] font-medium tracking-tight">{entry.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {entry.notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2">
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
        <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ink-2">
          Every deploy on Vercel gets an immutable URL that never changes and
          never goes away. When a version ships, its deployment URL is recorded
          here — the full history stays browsable even as the live site moves on.
        </p>
      </div>
    </main>
  );
}
