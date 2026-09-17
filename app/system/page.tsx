import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Chip, Section } from "@/components/ui";
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
    <span className="font-mono text-xs uppercase text-ink-3">
      <span className="dark:hidden">{light}</span>
      <span className="hidden dark:inline">{dark}</span>
    </span>
  );
}

/* The six steps, with what each one is for. Read off app/globals.css, and the
   declarations are not repeated here — a size printed beside its name is a
   second copy of a number that moves, and this page has no business being the
   place it goes stale. `lib/type-scale.test.ts` is where the numbers are held
   to account; this is where a reader is told what they are for. */
const STEPS = [
  { step: "xl", cls: "text-xl", of: "The name, and a page's own title" },
  { step: "lg", cls: "text-lg", of: "Product titles and page headings" },
  { step: "base", cls: "text-base", of: "Prose, and anything read at length" },
  { step: "sm", cls: "text-sm", of: "Secondary prose and record rows" },
  { step: "xs", cls: "text-xs", of: "Labels, hex, captions" },
  { step: "2xs", cls: "text-2xs", of: "Nav keys, ordinals, indices" },
] as const;

/**
 * The system page, on the system.
 *
 * It published five rules and broke two of them. "Six type steps, and nothing
 * sized outside them" was printed on a page setting seven literal sizes, none
 * of them a step; it was one of the two files missing from
 * `lib/type-scale.test.ts`'s GOVERNED list, which is the only reason that was
 * possible. It sat centred in a column of its own while every other surface is
 * left-aligned on the 1240 measure. And it carried no navigation at all — on
 * the portfolio deployment, where the layout renders no header either, a
 * visitor who arrived here had no way back that was not the browser's.
 *
 * All three are fixed by adopting what the rest of the site already does
 * rather than by inventing anything: the colophon's measure, the colophon's
 * bands, the nav row every other surface carries, and the scale.
 *
 * The type section grew while the sizes were being moved onto it. A page whose
 * first law is about six steps should show the six, and this one showed four
 * faces instead — which is a specimen of the typeface, not of the scale.
 */
export default function SystemPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-16 sm:px-6">
        <SiteNav />

        <header className="mt-12 max-w-[38rem]">
          <h1 className="text-lg font-medium leading-tight tracking-tight">System</h1>
          <p className="mt-1.5 text-sm leading-snug text-ink-2">
            The tokens and primitives every surface here is built from.
          </p>
        </header>

        <div className="grid gap-x-16 lg:grid-cols-2">
          <Section
            label="Value ladder"
            note="One ladder, two skins. Every step is a true grey with equal channels, so the ramp moves on value alone and hierarchy is never carried by hue. --miss is the one hue the system spends and it is not on this ladder. Company marks are reproduced in their own colours, because they belong to someone else."
          >
            <ul className="max-w-[26rem] space-y-2">
              {VALUE_LADDER.map((s) => (
                <li key={s.token} className="flex items-center gap-3">
                  <span className={`size-5 rounded-md border border-line ${s.cls}`} />
                  <span className="flex-1 font-mono text-xs text-ink-2">--{s.token}</span>
                  <Hex light={s.light} dark={s.dark} />
                </li>
              ))}
            </ul>
          </Section>

          <Section
            label="Type"
            note="Six steps, and the three that carry prose are fluid between a floor and a ceiling set in rem — so a visitor who has turned their own text size up still reaches them."
          >
            <ul className="max-w-[26rem] space-y-3">
              {STEPS.map((s) => (
                /* A grid rather than a flex row, because the specimen is the
                   one thing in it that changes width — six steps laid out by
                   flow put the step's name at six different x positions, which
                   is a ladder drawn as a stairway. Fixed columns; the specimen
                   grows inside its own. */
                <li
                  key={s.step}
                  className="grid grid-cols-[4.5rem_3rem_minmax(0,1fr)] items-baseline gap-3"
                >
                  <span className={`${s.cls} font-medium leading-none`}>Aa</span>
                  <span className="font-mono text-2xs uppercase tracking-wider text-ink-3">
                    {s.step}
                  </span>
                  <span className="min-w-0 text-xs text-ink-2">{s.of}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Primitives" note="Chips, controls and the resting state of a field.">
            <div className="max-w-[26rem] space-y-7">
              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">Chips</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Chip variant="solid">Solid</Chip>
                  <Chip>Outline</Chip>
                  <Chip variant="quiet">Quiet</Chip>
                </div>
              </div>

              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">Buttons</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
                  >
                    Ghost
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-strong px-4 py-2 text-sm font-medium text-on-strong transition-opacity hover:opacity-90"
                  >
                    Primary
                  </button>
                </div>
              </div>

              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">Input</p>
                <input
                  placeholder="Type something"
                  aria-label="Specimen input"
                  className="mt-3 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-ink-3 focus:outline-none focus-visible:border-ink"
                />
              </div>

              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">Skeleton</p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-4/5 rounded-full bg-line" />
                  <div className="h-2 w-3/5 rounded-full bg-line" />
                </div>
              </div>
            </div>
          </Section>

          <Section
            label="Spacing and radii"
            note="Four fixed tokens. They were a density dial with three steps and are now the one step it shipped in the middle of; every surface still reads them rather than a literal."
          >
            <ul className="max-w-[26rem] space-y-2">
              {[
                { token: "--pg-gap", v: "16px" },
                { token: "--pad", v: "20px" },
                { token: "--radius-window", v: "16px" },
                { token: "--radius-tile", v: "12px" },
              ].map((t) => (
                <li key={t.token} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-ink-2">{t.token}</span>
                  <span className="font-mono text-xs text-ink-3">{t.v}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Rules" className="lg:col-span-2">
            <ul className="max-w-[34rem] space-y-1.5 text-sm leading-relaxed text-ink-2">
              <li>Semantic tokens only — components never touch raw hex.</li>
              <li>Hairlines separate surfaces. No shadows.</li>
              <li>Dark mode inverts the strong fill.</li>
              <li>Six type steps, and nothing sized outside them.</li>
              <li>Spacing and radii read from tokens, not literals.</li>
              <li>Nothing moves unless it is touched, arriving, or reporting live.</li>
            </ul>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
