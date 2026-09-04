import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { GlyphToys } from "@/components/glyph-toys";
import { Readouts } from "@/components/readouts";
import { SiteNav } from "@/components/site-nav";
import { TokenRow, TypeSpecimen } from "@/components/colophon-instruments";
import { RecordRow } from "@/components/ui";
import { changelog } from "@/data/changelog";
import { isPortfolio } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "Colophon — Damilare Osofisan",
  description: "How this site is built: the type, the palette, and what the instruments read from.",
};

const TOKENS = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "text-3",
  "text-2",
  "text-1",
  "fill-strong",
  "miss",
];

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs text-ink-2">{children}</h2>;
}

function Section({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <Heading>{label}</Heading>
      {note && <p className="mt-2 max-w-[34rem] text-xs leading-[1.6] text-ink-3">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
    >
      {children}
    </a>
  );
}

function Inward({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
    >
      {children}
    </Link>
  );
}

export default function ColophonPage() {
  const current = changelog[0];

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-16 sm:px-6">
      <SiteNav current="/colophon" />

      <header className="mt-12 max-w-[38rem]">
        <h1 className="text-lg font-medium leading-tight tracking-tight">Colophon</h1>
        <p className="mt-1.5 text-sm leading-snug text-ink-2">
          What the site runs on, and what it reads from. Every control here is
          the real one, wired to the tokens the page is drawn from.
        </p>
      </header>

      <div className="grid gap-x-16 lg:grid-cols-2">
        <div>
          <Section
            label="Palette"
            note="One value ladder, two skins. Every step is a true grey with equal channels, so the ramp moves on value alone. Each row reads its own live computed value; click to copy the hex. --miss is the only hue the system spends, and it means one thing: a day the step goal was missed. Company marks are reproduced in their own colours, because they belong to someone else."
          >
            <div className="max-w-[26rem]">
              {TOKENS.map((token) => (
                <TokenRow key={token} token={token} />
              ))}
            </div>
          </Section>

          <Section
            label="Readouts"
            note="What the site can say about itself right now."
          >
            <div className="max-w-[26rem]">
              <Readouts version={current.version} commit={process.env.VERCEL_GIT_COMMIT_SHA} />
            </div>
          </Section>

          <Section
            label="The toys"
            note="Phone (3) works five toys with one button: press to change toy, press and hold to start. One button is the design, so it is copied exactly. Arrow keys steer the snake."
          >
            <div className="max-w-[26rem]">
              <GlyphToys />
            </div>
          </Section>
        </div>

        <div>
          <Section
            label="Typography"
            note="Suisse Int'l carries everything a person reads; the mono carries everything the site says about itself. Six sizes, three of them fluid. Set the weight and drag the size — these are specimens, not pictures of specimens."
          >
            <div>
              <TypeSpecimen
                sample="&rsquo;Damilare Osofisan"
                face="Suisse Int'l"
                role="Display, headings"
                weights={[300, 400, 450, 500, 700]}
              />
              <TypeSpecimen
                sample="Product designer and builder creating 0–1 experiences."
                face="Suisse Int'l"
                role="Body, one-liners"
                weights={[300, 400, 450, 500]}
              />
              <TypeSpecimen
                sample="SELECTED WORK / 02"
                face="Suisse Int'l Mono"
                role="Labels, metadata, counts"
                mono
                weights={[400]}
              />
            </div>
          </Section>

          <Section label="Stack" note="What it runs on, and what the instruments read from.">
            <div className="max-w-[26rem]">
              <RecordRow label="Framework">Next.js, React, TypeScript</RecordRow>
              <RecordRow label="Styling">Tailwind CSS on CSS custom properties</RecordRow>
              <RecordRow label="Store">Upstash Redis</RecordRow>
              <RecordRow label="Music">Spotify, dithered to a dot field</RecordRow>
              <RecordRow label="Steps">Health Connect, pushed from the phone</RecordRow>
              <RecordRow label="Weather">Open-Meteo, for Lagos</RecordRow>
              <RecordRow label="Hosting">Vercel</RecordRow>
              <RecordRow label="Version">
                <Inward href="/changelog">
                  v{current.version} — {current.title}
                </Inward>
              </RecordRow>
              {!isPortfolio && (
                <RecordRow label="Workshop">
                  <Inward href="/system">System</Inward>
                </RecordRow>
              )}
            </div>
          </Section>

          <Section label="Provenance">
            <div className="max-w-[34rem] space-y-3 text-sm leading-[1.6] text-ink-2">
              <p>
                The dot-matrix language here is an original web implementation
                and a homage to Nothing&rsquo;s interface &mdash; the Glyph
                Matrix on Phone (3) and the Glyph Toys beside it. No Nothing
                code, assets, or trademarks are used: the glyphs, the alphabet,
                and the engine that draws them were written for this site.
              </p>
              <p>
                The steps card reports how far a day went and nothing else.
                There is no GPS on this site and none is planned.
              </p>
              <p>
                Spotify returns 403 for its{" "}
                <span className="font-mono text-xs">audio-features</span> and{" "}
                <span className="font-mono text-xs">audio-analysis</span>{" "}
                endpoints, so there is no beat grid to be had. The pulse runs on
                playback position against the clock. It is not beat detection.
              </p>
            </div>
          </Section>

          <Section label="Thanks">
            <div className="max-w-[34rem] space-y-3 text-sm leading-[1.6] text-ink-2">
              <p>
                <Out href="https://intempus.org">Intempus</Out>, whose colophon
                established the labelled-record structure this one descends from.
              </p>
              <p>
                <Out href="https://guglieri.com/work">Guglieri</Out>,{" "}
                <Out href="https://kprkr.co/work">kprkr</Out>, and{" "}
                <Out href="https://rghv.ca">rghv</Out>, for the argument that
                metadata is the aesthetic and hierarchy is expressed as room.
              </p>
            </div>
          </Section>
        </div>
      </div>

    </main>
  );
}
