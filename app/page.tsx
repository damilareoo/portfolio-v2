import Link from "next/link";
import { Chip, SectionLabel } from "@/components/ui";
import { CopyEmail } from "@/components/copy-email";
import { LiveClock } from "@/components/live-clock";
import { Playground } from "@/components/playground";
import { ThemeToggle } from "@/components/theme-toggle";
import { tiles } from "@/data/playground";
import { site } from "@/data/site";
import { isPortfolio, workshopUrl } from "@/lib/site-mode";

function WindowBar({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</span>
      {right}
    </div>
  );
}

export default function Home() {
  return (
    <main
      className={`mx-auto w-full max-w-7xl gap-4 p-4 lg:grid lg:grid-cols-[370px_1fr] ${
        isPortfolio ? "lg:h-dvh" : "lg:h-[calc(100dvh-54px)]"
      }`}
    >
      {/* Profile window */}
      <section className="mb-4 flex flex-col rounded-2xl border border-line bg-surface lg:mb-0 lg:h-full lg:overflow-y-auto">
        <WindowBar label="Profile" right={<LiveClock />} />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-2xl bg-strong text-[24px] font-medium tracking-tight text-on-strong"
            >
              d.
            </span>
            <div>
              <h1 className="text-[17px] font-medium tracking-tight">Damilare Osofisan</h1>
              <p className="mt-0.5 text-[13px] text-ink-2">Product Designer</p>
            </div>
          </div>

          <p className="mt-6 text-[14px] leading-relaxed text-ink-2">
            Designer and builder creating 0–1 experiences. I design products,
            build what makes them work, and ship them — brands, systems, and
            products that feel intuitive and delightful.
          </p>

          <div className="mt-7">
            <SectionLabel>Currently</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <a
                href="https://chessever.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                ChessEver ↗
              </a>
              <a
                href="https://hex.inc"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                Hex ↗
              </a>
            </div>
          </div>

          <div className="mt-7">
            <SectionLabel>Elsewhere</SectionLabel>
            <div className="mt-3 flex gap-4">
              <a
                href={site.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                X
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="mt-8 flex-1" />

          <div className="border-t border-line pt-5">
            <CopyEmail email={site.email} />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] text-ink-3">Lagos, WAT</span>
              <div className="flex items-center gap-2">
                {!isPortfolio && (
                  <>
                    <Link
                      href="/system"
                      className="text-[12px] text-ink-2 transition-colors hover:text-ink"
                    >
                      System
                    </Link>
                    <Link
                      href="/changelog"
                      className="text-[12px] text-ink-2 transition-colors hover:text-ink"
                    >
                      Changelog
                    </Link>
                  </>
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playground window */}
      <section className="flex flex-col rounded-2xl border border-line bg-surface lg:h-full lg:min-h-0">
        <WindowBar
          label="Playground"
          right={<Chip variant="quiet">{String(tiles.length).padStart(3, "0")}</Chip>}
        />
        <div className="min-h-0 flex-1 p-5 lg:overflow-y-auto">
          <Playground tiles={tiles} />
        </div>
      </section>
    </main>
  );
}
