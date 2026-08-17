import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Counters } from "@/components/counters";
import { CopyEmail } from "@/components/copy-email";
import { DialKit } from "@/components/dial-kit";
import { SiteNav } from "@/components/site-nav";
import { ValueField } from "@/components/value-field";
import { site } from "@/data/site";
import { changelog } from "@/data/changelog";
import { isPortfolio } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: "The record, and the colophon: how this site is made.",
};

const ladder = [
  { token: "bg", cls: "bg-bg", light: "#F4F4F4", dark: "#0A0A0A" },
  { token: "surface", cls: "bg-surface", light: "#FFFFFF", dark: "#141414" },
  { token: "surface-2", cls: "bg-surface-2", light: "#F7F7F7", dark: "#1C1C1C" },
  { token: "border", cls: "bg-line", light: "#E9E9E9", dark: "#262626" },
  { token: "text-3", cls: "bg-ink-3", light: "#B0B0B0", dark: "#4D4D4D" },
  { token: "text-2", cls: "bg-ink-2", light: "#6F6F6F", dark: "#8A8A8A" },
  { token: "text-1", cls: "bg-ink", light: "#111111", dark: "#F5F5F5" },
  { token: "fill-strong", cls: "bg-strong", light: "#111111", dark: "#F5F5F5" },
];

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <div className="mb-5 border-b border-line pb-2">
        <Label>{label}</Label>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <Label>{label}</Label>
      <span className="min-w-0 text-right text-[0.8125rem]">{children}</span>
    </div>
  );
}

/** The intempus spec table: a specimen, then the record that describes it. */
function Specimen({
  sample,
  sampleClass,
  rows,
}: {
  sample: string;
  sampleClass: string;
  rows: [string, string][];
}) {
  return (
    <div className="mt-8 first:mt-0">
      <p className={sampleClass}>{sample}</p>
      <dl className="mt-3 border-t border-line pt-3">
        {rows.map(([term, value]) => (
          <div key={term} className="flex gap-6 py-1">
            <dt className="w-24 shrink-0 font-mono text-[0.6875rem] text-ink-3">{term}</dt>
            <dd className="font-mono text-[0.6875rem] text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
    >
      {children}
    </a>
  );
}

export default function AboutPage() {
  const current = changelog[0];

  return (
    <main className="mx-auto w-full max-w-[760px] px-[var(--pg-gap)] py-8 sm:py-10">
      <SiteNav current="/about" />

      <header className="mt-14 sm:mt-20">
        <h1 className="text-[1.75rem] font-medium leading-[1.15] tracking-tight">
          Damilare Osofisan
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">
          Product designer and builder in Lagos. I work on 0–1 products — the
          part where the shape of the thing is still an open question — and I
          build enough of them myself that the answer has to survive contact
          with a real implementation.
        </p>
      </header>

      <Section label="Record">
        <Row label="Based">Lagos, Nigeria</Row>
        <Row label="Currently">
          <Out href="https://chessever.com">ChessEver</Out>
          <span className="text-ink-3">, </span>
          <Out href="https://hex.inc">Hex</Out>
        </Row>
        <Row label="Focus">0–1 products</Row>
        <Row label="Elsewhere">
          <Out href={site.x}>X</Out>
          <span className="text-ink-3">, </span>
          <Out href={site.github}>GitHub</Out>
        </Row>
        <div className="mt-6 max-w-[22rem]">
          <CopyEmail email={site.email} />
        </div>
      </Section>

      {/* ── Colophon ─────────────────────────────────────────────────────── */}

      <div className="mt-20 border-t border-line pt-10">
        <h2 className="text-[1.5rem] font-medium leading-tight tracking-tight">Colophon</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
          The typography, palette, and craft behind this site.
        </p>
      </div>

      <Section label="Palette">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          One value ladder, two skins, no hue. Hierarchy comes from tonal value,
          which is the whole argument — a site that cannot reach for colour has
          to earn its emphasis from spacing, weight, and edge.
        </p>
        <ul className="mt-6 space-y-2">
          {ladder.map((step) => (
            <li key={step.token} className="flex items-center gap-3">
              <span className={`size-5 rounded-md border border-line ${step.cls}`} />
              <span className="flex-1 font-mono text-[0.6875rem] text-ink-2">
                --{step.token}
              </span>
              <span className="font-mono text-[0.6875rem] text-ink-3">
                <span className="dark:hidden">{step.light}</span>
                <span className="hidden dark:inline">{step.dark}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="The field">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          The ladder above is fixed. Its middle is not — move your cursor across
          the field to blend weight and contrast from the nearest points, and
          click to commit. The blend holds while you move around the site and
          resets when you reload it.
        </p>
        <div className="mt-6">
          <ValueField />
        </div>
      </Section>

      <Section label="Typography">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          Two faces, one family. Suisse Int&apos;l carries everything a person
          reads; Suisse Int&apos;l Mono carries everything the site says about
          itself — labels, hex, indices, counts. If it is metadata, it is mono.
        </p>
        <div className="mt-8">
          <Specimen
            sample="Damilare Osofisan"
            sampleClass="text-[1.75rem] font-medium tracking-tight"
            rows={[
              ["Face", "Suisse Int'l"],
              ["Role", "Display, headings"],
              ["Weight", "500 medium"],
            ]}
          />
          <Specimen
            sample="Designer and builder creating 0–1 experiences."
            sampleClass="text-[1.0625rem] leading-relaxed text-ink-2"
            rows={[
              ["Face", "Suisse Int'l"],
              ["Role", "Body, one-liners"],
              ["Weight", "300 light, 400 regular, 450 book"],
            ]}
          />
          <Specimen
            sample="SELECTED · 02 PIECES"
            sampleClass="font-mono text-[0.875rem] uppercase tracking-wider"
            rows={[
              ["Face", "Suisse Int'l Mono"],
              ["Role", "Labels, metadata, counts"],
              ["Weight", "400 regular"],
            ]}
          />
        </div>
      </Section>

      <Section label="Dials">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          These aren&apos;t preferences stored for later — each one rewrites the
          design tokens this page is drawn from, live. The count is shared: every
          visitor who turns a dial leaves a trace the next visitor sees.
        </p>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div className="rounded-[var(--radius-tile)] border border-line p-[var(--pad)]">
            <DialKit />
          </div>
          <Counters version={current.version} commit={process.env.VERCEL_GIT_COMMIT_SHA} />
        </div>
      </Section>

      <Section label="Stack">
        <Row label="Framework">Next.js, React, TypeScript</Row>
        <Row label="Styling">Tailwind CSS on CSS custom properties</Row>
        <Row label="Counters">Upstash Redis</Row>
        <Row label="Hosting">Vercel</Row>
        <Row label="Version">
          <Link
            href="/changelog"
            className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            v{current.version} — {current.title}
          </Link>
        </Row>
        {!isPortfolio && (
          <Row label="Workshop">
            <Link
              href="/system"
              className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              System
            </Link>
          </Row>
        )}
      </Section>

      <Section label="Thanks">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          <Out href="https://intempus.org">Intempus</Out>, whose colophon
          established the labelled-record structure this one descends from, and
          whose tint field is the direct ancestor of the value field above.
        </p>
        <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed">
          <Out href="https://guglieri.com/work">Guglieri</Out>,{" "}
          <Out href="https://kprkr.co/work">kprkr</Out>, and{" "}
          <Out href="https://rghv.ca">rghv</Out>, for the argument that metadata
          is the aesthetic and hierarchy is expressed as room.
        </p>
      </Section>

      <footer className="mt-16 border-t border-line pt-6">
        <Label>
          © {new Date().getFullYear()} Damilare Osofisan · v{current.version}
        </Label>
      </footer>
    </main>
  );
}
