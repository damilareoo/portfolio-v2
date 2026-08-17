import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyEmail } from "@/components/copy-email";
import { SiteNav } from "@/components/site-nav";
import { elsewhere, site } from "@/data/site";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: "Product designer and builder in Lagos.",
};

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-[0.75rem] text-ink-2">{children}</h2>;
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

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/about" />

      <header className="mt-12 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[38rem]">
          <h1 className="text-[1.25rem] font-medium leading-tight tracking-tight">
            &rsquo;{site.name}
          </h1>
          <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-ink">
            Product designer and builder creating 0&ndash;1 experiences.
          </p>
          <p className="text-[0.8125rem] leading-snug text-ink-2">
            Specialising in interfaces, systems, and shipping them.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <a
            href={`mailto:${site.email}`}
            className="text-[0.8125rem] text-ink transition-colors hover:text-ink-2"
          >
            {site.email}
          </a>
          <p className="mt-0.5 text-[0.75rem] text-ink-3">{site.coordinates}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <section>
          <Heading>Practice</Heading>
          <div className="mt-3 max-w-[34rem] space-y-3 text-[0.8125rem] leading-[1.6] text-ink-2">
            <p>
              I work on 0&ndash;1 products &mdash; the part where the shape of the
              thing is still an open question &mdash; and I build enough of them
              myself that the answer has to survive contact with a real
              implementation.
            </p>
            <p>
              That means the design work does not stop at a file. Interface,
              system, and the code that makes it move are one job, and the ones
              that ship are the ones where nobody had to translate between them.
            </p>
            <p>
              Most of what I make is quiet on purpose. Restraint is not the
              absence of an idea; it is what makes the one idea legible.
            </p>
          </div>
        </section>

        <section>
          <Heading>Record</Heading>
          <div className="mt-3">
            <Row label="Based">Lagos, Nigeria</Row>
            <Row label="Currently">
              <Out href="https://chessever.com">ChessEver</Out>
              <span className="text-ink-3">, </span>
              <Out href="https://hex.inc">Hex</Out>
            </Row>
            <Row label="Focus">0&ndash;1 products</Row>
            <Row label="Site">
              <Link
                href="/colophon"
                className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
              >
                Colophon
              </Link>
            </Row>
          </div>

          <div className="mt-8">
            <Heading>Elsewhere</Heading>
            <div className="mt-3">
              {elsewhere.map((place) => (
                <a
                  key={place.label}
                  href={place.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)]"
                >
                  <span className="text-[0.6875rem] text-ink-3">{place.label}</span>
                  <span className="text-[0.75rem] text-ink-2 transition-colors group-hover:text-ink">
                    {place.handle}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6 max-w-[20rem]">
            <CopyEmail email={site.email} />
          </div>
        </section>
      </div>
    </main>
  );
}
