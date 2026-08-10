import { Chip, Meta, SectionLabel, Sheet } from "@/components/ui";
import { featured, index, site } from "@/data/site";

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 10.5 10.5 3.5M5 3.5h5.5V9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero — the personal data sheet */}
      <div className="mb-4 flex items-center gap-1.5">
        <Chip variant="solid">Portfolio</Chip>
        <Chip>2026</Chip>
      </div>

      <Sheet className="flex flex-col p-6 sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <h1 className="text-[clamp(56px,9vw,120px)] font-medium leading-[0.95] tracking-[-0.03em]">
            Damilare
          </h1>
          <span
            aria-hidden
            className="mt-2 flex size-16 shrink-0 items-center justify-center rounded-2xl bg-strong text-[28px] font-medium tracking-tight text-on-strong sm:size-20 sm:text-[36px]"
          >
            d.
          </span>
        </div>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-2">
          Designer and builder creating 0–1 experiences. I design products, build
          what makes them work, and ship them.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8 sm:mt-12 sm:grid-cols-4">
          <Meta label="Based in" value="Lagos, Nigeria" />
          <Meta
            label="Currently"
            value={
              <>
                <a
                  href="https://chessever.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-ink-3 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  ChessEver
                </a>
                {" · "}
                <a
                  href="https://hex.inc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-ink-3 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Hex
                </a>
              </>
            }
          />
          <Meta label="Focus" value="0–1 products" />
          <Meta
            label="Contact"
            value={
              <a
                href={`mailto:${site.email}`}
                className="underline decoration-ink-3 underline-offset-4 transition-colors hover:decoration-ink"
              >
                Email
              </a>
            }
          />
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-line pt-5 sm:mt-14">
          <span className="text-[13px] font-medium tracking-tight">damilareoo</span>
          <span className="text-[13px] text-ink-3">www.damilareoo.xyz</span>
        </div>
      </Sheet>

      {/* Featured — the cascading strip */}
      <section id="work" className="mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <SectionLabel>Featured</SectionLabel>
            <h2 className="mt-3 text-[28px] font-medium leading-tight tracking-tight sm:text-[32px]">
              Selected work
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
              Projects I keep coming back to. Each one is getting a full
              deep-dive page.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {featured.map((p, i) => (
              <a
                key={p.slug}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex w-full items-center gap-5 rounded-2xl border border-line bg-surface p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:w-[85%] ${
                  i % 2 === 1 ? "sm:self-end" : "sm:self-start"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-16 shrink-0 items-center justify-center rounded-xl text-[22px] font-medium tracking-tight sm:size-20 ${
                    i % 2 === 1
                      ? "border border-line bg-surface-2 text-ink"
                      : "bg-strong text-on-strong"
                  }`}
                >
                  {p.mark}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[16px] font-medium tracking-tight">
                    {p.title}
                    <span className="text-ink-3 transition-colors group-hover:text-ink">
                      <ArrowUpRight />
                    </span>
                  </span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-ink-2">
                    {p.oneLiner}
                  </span>
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink-3 sm:block">
                  00{i + 1}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Index — everything else */}
      <section className="mt-16 sm:mt-24">
        <SectionLabel>Index</SectionLabel>
        <ul className="mt-4">
          {index.map((p, i) => (
            <li key={p.title}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline gap-4 border-t border-line py-4 transition-colors last:border-b hover:bg-surface sm:gap-6 sm:px-3"
              >
                <span className="font-mono text-[11px] text-ink-3">
                  0{i + 1}
                </span>
                <span className="flex-1 text-[15px] font-medium tracking-tight">
                  {p.title}
                </span>
                <span className="hidden text-[14px] text-ink-2 sm:block">
                  {p.description}
                </span>
                <span className="text-ink-3 transition-colors group-hover:text-ink">
                  <ArrowUpRight />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Background */}
      <section className="mt-16 pb-8 sm:mt-24">
        <SectionLabel>Background</SectionLabel>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:gap-10">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Most recently I&apos;ve been focused on designing brands, systems,
            and products that feel intuitive and delightful. I believe in work
            that not only looks exceptional but solves real problems — every
            detail matters, from the initial spark to the final polish.
          </p>
          <p className="text-[15px] leading-relaxed text-ink-2">
            When I&apos;m not designing or coding, you&apos;ll find me playing
            basketball, exploring new music, and experimenting with playful
            side projects.
          </p>
        </div>
      </section>
    </main>
  );
}
