import Link from "next/link";
import type { ReactNode } from "react";
import { CopyEmail } from "@/components/copy-email";
import { DialKit } from "@/components/dial-kit";
import { LiveClock } from "@/components/live-clock";
import { SelectedWork } from "@/components/selected-work";
import { selected } from "@/data/work";
import { site } from "@/data/site";
import { changelog } from "@/data/changelog";
import { isPortfolio } from "@/lib/site-mode";

function Window({
  label,
  right,
  className = "",
  bodyClassName = "",
  children,
}: {
  label: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-[var(--radius-window)] border border-line bg-surface ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-[var(--pad)] py-2.5">
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          {label}
        </span>
        {right}
      </div>
      <div className={`min-h-0 flex-1 p-[var(--pad)] ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/* Label-left, value-right — the rails read as one continuous record. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      <span className="min-w-0 text-right text-[0.8125rem]">{children}</span>
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

export default function Home() {
  const version = changelog[0].version;

  return (
    <main
      className={`mx-auto grid w-full max-w-[1600px] gap-[var(--pg-gap)] p-[var(--pg-gap)] lg:grid-cols-[290px_minmax(0,1fr)_210px] ${
        isPortfolio ? "lg:h-dvh" : "lg:h-[calc(100dvh-54px)]"
      }`}
    >
      {/* Left rail — the record */}
      <Window label="Profile" right={<LiveClock />} className="lg:overflow-y-auto">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-strong text-[1.25rem] font-medium tracking-tight text-on-strong"
            >
              d.
            </span>
            <span>
              <h1 className="text-[0.9375rem] font-medium leading-tight tracking-tight">
                Damilare Osofisan
              </h1>
              <p className="text-[0.8125rem] leading-tight text-ink-2">Product Designer</p>
            </span>
          </div>

          <p className="mt-5 text-[0.8125rem] leading-relaxed text-ink-2">
            Designer and builder creating 0–1 experiences. I design products,
            build what makes them work, and ship them.
          </p>

          <div className="mt-6">
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
            {!isPortfolio && (
              <Row label="Workshop">
                <Link
                  href="/system"
                  className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  System
                </Link>
                <span className="text-ink-3">, </span>
                <Link
                  href="/changelog"
                  className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  Changelog
                </Link>
              </Row>
            )}
          </div>

          <div className="mt-6 lg:mt-auto lg:pt-6">
            <CopyEmail email={site.email} />
          </div>
        </div>
      </Window>

      {/* Center — the argument, not the archive */}
      <Window
        label="Selected"
        right={
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            {String(selected.length).padStart(2, "0")} pieces
          </span>
        }
        className="lg:min-h-0"
        bodyClassName="lg:overflow-y-auto"
      >
        <SelectedWork />
      </Window>

      {/* Right rail — the dials */}
      <Window label="Settings" className="lg:overflow-y-auto">
        <div className="flex h-full flex-col">
          <DialKit />

          <p className="mt-5 text-[0.6875rem] leading-relaxed text-ink-3">
            These aren&apos;t preferences stored for later — each one rewrites
            the design tokens this page is drawn from, live.
          </p>

          <div className="mt-6 lg:mt-auto">
            <div className="border-t border-line pt-3">
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
                Build
              </span>
              <p className="mt-1.5 font-mono text-[0.6875rem] text-ink-2">v{version}</p>
            </div>
          </div>
        </div>
      </Window>
    </main>
  );
}
