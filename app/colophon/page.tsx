import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Counters } from "@/components/counters";
import { DialKit } from "@/components/dial-kit";
import { GlyphForge } from "@/components/glyph-forge";
import { SiteNav } from "@/components/site-nav";
import { TokenRow, TypeSpecimen } from "@/components/colophon-instruments";
import { changelog } from "@/data/changelog";
import { isPortfolio } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "Colophon — Damilare Osofisan",
  description: "The typography, palette, and craft behind this site.",
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
];

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-[0.75rem] text-ink-2">{children}</h2>;
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
      {note && <p className="mt-2 max-w-[34rem] text-[0.75rem] leading-[1.6] text-ink-3">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="text-[0.6875rem] text-ink-3">{label}</span>
      <span className="text-[0.75rem] text-ink">{children}</span>
    </div>
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

export default function ColophonPage() {
  const current = changelog[0];

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-16 sm:px-6">
      <SiteNav current="/colophon" />

      <header className="mt-12 max-w-[38rem]">
        <h1 className="text-[1.25rem] font-medium leading-tight tracking-tight">Colophon</h1>
        <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-2">
          The typography, palette, and craft behind this site. Nothing here is a
          screenshot of the system &mdash; every control on this page is the real
          one, wired to the tokens the page is drawn from.
        </p>
      </header>

      <div className="grid gap-x-16 lg:grid-cols-2">
        <div>
          <Section
            label="Palette"
            note="One value ladder, two skins, no hue. Each row reads its own live computed value, so it cannot drift out of date with the stylesheet. Click a row to copy the hex."
          >
            <div className="max-w-[26rem]">
              {TOKENS.map((token) => (
                <TokenRow key={token} token={token} />
              ))}
            </div>
          </Section>

          <Section
            label="The forge"
            note="The same field the home carries, with the pen handed over. Drag across it to draw, or use the arrow keys and space. The drawing is kept on your own device and never sent here — it appears as a hidden page on the home, past the week view. Only the fact that a glyph was drawn is counted, once per browser."
          >
            <div className="max-w-[26rem]">
              <GlyphForge />
            </div>
          </Section>

          <Section
            label="Dials"
            note="Not preferences stored for later — each one rewrites the design tokens this page is drawn from, live. The count is shared: every visitor who turns a dial leaves a trace the next visitor sees."
          >
            <div className="grid max-w-[26rem] gap-6 sm:grid-cols-2">
              <div className="border border-line p-3">
                <DialKit />
              </div>
              <Counters version={current.version} commit={process.env.VERCEL_GIT_COMMIT_SHA} />
            </div>
          </Section>
        </div>

        <div>
          <Section
            label="Typography"
            note="Two faces, one family. Suisse Int'l carries everything a person reads; the mono carries everything the site says about itself. Set the weight and drag the size — these are specimens, not pictures of specimens."
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

          <Section label="Stack">
            <div className="max-w-[26rem]">
              <Row label="Framework">Next.js, React, TypeScript</Row>
              <Row label="Styling">Tailwind CSS on CSS custom properties</Row>
              <Row label="Counters">Upstash Redis</Row>
              <Row label="Music">Spotify, dithered to a dot field</Row>
              <Row label="Hosting">Vercel</Row>
              <Row label="Version">
                <Link
                  href="/changelog"
                  className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
                >
                  v{current.version} — {current.title}
                </Link>
              </Row>
              {!isPortfolio && (
                <Row label="Workshop">
                  <Link
                    href="/system"
                    className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
                  >
                    System
                  </Link>
                </Row>
              )}
            </div>
          </Section>

          <Section label="Provenance">
            <div className="max-w-[34rem] space-y-3 text-[0.8125rem] leading-[1.6] text-ink-2">
              <p>
                The dot-matrix language here is an original web implementation
                and a homage to Nothing&rsquo;s interface. No Nothing code,
                assets, or trademarks are used; the glyphs, the font, and the
                engine that draws them were written for this site.
              </p>
              <p>
                Spotify&rsquo;s <span className="font-mono text-[0.75rem]">audio-features</span>{" "}
                and <span className="font-mono text-[0.75rem]">audio-analysis</span> endpoints
                return 403 for this application, so there is no tempo and no beat
                grid to be had. The pulse is driven by playback position against
                the clock. It is not beat detection, and it does not claim to be.
              </p>
            </div>
          </Section>

          <Section label="Thanks">
            <div className="max-w-[34rem] space-y-3 text-[0.8125rem] leading-[1.6] text-ink-2">
              <p>
                <Out href="https://intempus.org">Intempus</Out>, whose colophon
                established the labelled-record structure this one descends from,
                and whose tint field is the direct ancestor of the forge.
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
