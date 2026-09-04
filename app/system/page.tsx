import type { Metadata } from "next";
import { Chip, SectionLabel, Sheet } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";
import { VALUE_LADDER } from "@/lib/value-ladder";

export const metadata: Metadata = {
  title: "System — Damilare Osofisan",
  description: "The living design system behind this site.",
};

/* Uppercased in CSS, not in the data: the ladder holds the hex exactly as
   app/globals.css declares it, so the test comparing the two compares strings
   nobody has reformatted on the way past. */
function Hex({ light, dark }: { light: string; dark: string }) {
  return (
    <span className="font-mono text-[0.6875rem] uppercase text-ink-3">
      <span className="dark:hidden">{light}</span>
      <span className="hidden dark:inline">{dark}</span>
    </span>
  );
}

export default function SystemPage() {
  return (
    <>
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center gap-1.5">
        <Chip variant="solid">System</Chip>
        <Chip>Tokens 001</Chip>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet className="p-6 sm:p-7">
          <h1 className="text-[1.0625rem] font-medium tracking-tight">Values</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-2">
            The full ladder. Every step is a true grey; hierarchy comes from
            tonal value, never hue. The one hue the system spends is --miss, and
            it is not on this ladder. Company marks are reproduced in their own
            colours, because they belong to someone else.
          </p>

          <div className="mt-6">
            <SectionLabel>Value ladder</SectionLabel>
          </div>
          <ul className="mt-3 space-y-2">
            {VALUE_LADDER.map((s) => (
              <li key={s.token} className="flex items-center gap-3">
                <span className={`size-5 rounded-md border border-line ${s.cls}`} />
                <span className="flex-1 font-mono text-[0.6875rem] text-ink-2">--{s.token}</span>
                <Hex light={s.light} dark={s.dark} />
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <SectionLabel>Type</SectionLabel>
            <div className="mt-3 space-y-1.5">
              <p className="text-[0.9375rem] font-medium">Primary — Suisse Medium</p>
              <p className="text-[0.875rem] text-ink-2">Secondary — Suisse Regular</p>
              <p className="text-[0.8125rem] text-ink-3">Tertiary — placeholders, meta</p>
              <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-3">
                Mono — labels, hex, indices
              </p>
            </div>
          </div>
        </Sheet>

        <Sheet className="p-6 sm:p-7">
          <h2 className="text-[1.0625rem] font-medium tracking-tight">Primitives</h2>
          <p className="mt-1 text-[0.8125rem] text-ink-2">
            Every surface on the site is built from these.
          </p>

          <div className="mt-6">
            <SectionLabel>Chips</SectionLabel>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Chip variant="solid">Solid</Chip>
              <Chip>Outline</Chip>
              <Chip variant="quiet">Quiet</Chip>
            </div>
          </div>

          <div className="mt-7">
            <SectionLabel>Buttons</SectionLabel>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Ghost
              </button>
              <button
                type="button"
                className="rounded-full bg-strong px-4 py-2 text-[0.8125rem] font-medium text-on-strong transition-opacity hover:opacity-90"
              >
                Primary
              </button>
            </div>
          </div>

          <div className="mt-7">
            <SectionLabel>Input</SectionLabel>
            <input
              placeholder="Type something"
              aria-label="Specimen input"
              className="mt-3 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[0.875rem] placeholder:text-ink-3 focus:outline-none focus-visible:border-ink"
            />
          </div>

          <div className="mt-7">
            <SectionLabel>Skeleton</SectionLabel>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-4/5 rounded-full bg-line" />
              <div className="h-2 w-3/5 rounded-full bg-line" />
            </div>
          </div>

          <div className="mt-7">
            <SectionLabel>Spacing and radii</SectionLabel>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-2">
              Four fixed tokens. They were a density dial with three steps and
              are now the one step it shipped in the middle of; every surface
              still reads them rather than a literal.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { token: "--pg-gap", v: "16px" },
                { token: "--pad", v: "20px" },
                { token: "--radius-window", v: "16px" },
                { token: "--radius-tile", v: "12px" },
              ].map((t) => (
                <li key={t.token} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.6875rem] text-ink-2">{t.token}</span>
                  <span className="font-mono text-[0.6875rem] text-ink-3">{t.v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7">
            <SectionLabel>Rules</SectionLabel>
            <ul className="mt-3 space-y-1.5 text-[0.8125rem] leading-relaxed text-ink-2">
              <li>Semantic tokens only — components never touch raw hex.</li>
              <li>Hairlines separate surfaces. No shadows.</li>
              <li>Dark mode inverts the strong fill.</li>
              <li>Six type steps, and nothing sized outside them.</li>
              <li>Spacing and radii read from tokens, not literals.</li>
            </ul>
          </div>
        </Sheet>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
