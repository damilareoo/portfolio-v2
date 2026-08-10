import { ThemeToggle } from "@/components/theme-toggle";

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

function Hex({ light, dark }: { light: string; dark: string }) {
  return (
    <span className="font-mono text-[11px] text-ink-3">
      <span className="dark:hidden">{light}</span>
      <span className="hidden dark:inline">{dark}</span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 sm:px-6">
        <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1">
          <span className="text-[13px] font-medium tracking-tight">damilareoo</span>
          <span className="rounded-full bg-surface-2 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-ink-2">
            v2
          </span>
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="rounded-full bg-strong px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-on-strong">
            Foundation
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-2">
            Tokens 001
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* The sheet — quotes the invoice document */}
          <section className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-10">
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

            <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:mt-16">
              <div>
                <p className="text-[13px] text-ink-2">Based in</p>
                <p className="mt-1 text-[15px] font-medium">Lagos, Nigeria</p>
              </div>
              <div>
                <p className="text-[13px] text-ink-2">Currently</p>
                <p className="mt-1 text-[15px] font-medium">Product Designer, Endgame</p>
              </div>
            </div>

            <div className="mt-8 border-t border-line pt-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                <div>
                  <p className="text-[13px] text-ink-2">Focus</p>
                  <p className="mt-1 text-[15px] font-medium">Interfaces</p>
                </div>
                <div>
                  <p className="text-[13px] text-ink-2">Site no</p>
                  <p className="mt-1 text-[15px] font-medium">#DO-002</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[13px] text-ink-2">Status</p>
                  <div className="mt-2.5 space-y-2">
                    <div className="h-2 w-4/5 rounded-full bg-line" />
                    <div className="h-2 w-3/5 rounded-full bg-line" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-1 items-end sm:mt-24">
              <div className="flex w-full items-center justify-between border-t border-line pt-5">
                <span className="text-[13px] font-medium tracking-tight">damilareoo</span>
                <span className="text-[13px] text-ink-3">www.damilareoo.xyz</span>
              </div>
            </div>
          </section>

          {/* The panel — quotes the create-invoice card */}
          <aside className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <h2 className="text-[17px] font-medium tracking-tight">Specimen</h2>

            <div className="mt-4 flex gap-5 border-b border-line pb-3 text-[13px]">
              <span className="relative font-medium after:absolute after:-bottom-[13px] after:left-0 after:h-px after:w-full after:bg-ink">
                Values
              </span>
              <span className="text-ink-3">Type</span>
              <span className="text-ink-3">Controls</span>
            </div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Value ladder
            </p>
            <ul className="mt-3 space-y-2">
              {ladder.map((s) => (
                <li key={s.token} className="flex items-center gap-3">
                  <span className={`size-5 rounded-md border border-line ${s.cls}`} />
                  <span className="flex-1 font-mono text-[11px] text-ink-2">--{s.token}</span>
                  <Hex light={s.light} dark={s.dark} />
                </li>
              ))}
            </ul>

            <p className="mt-7 font-mono text-[10px] uppercase tracking-wider text-ink-3">Type</p>
            <div className="mt-3 space-y-1.5">
              <p className="text-[15px] font-medium">Primary — Suisse Medium</p>
              <p className="text-[14px] text-ink-2">Secondary — Suisse Regular</p>
              <p className="text-[13px] text-ink-3">Tertiary — placeholders, meta</p>
            </div>

            <p className="mt-7 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Controls
            </p>
            <div className="mt-3">
              <label htmlFor="specimen-input" className="text-[13px] text-ink-2">
                Input
              </label>
              <input
                id="specimen-input"
                placeholder="Type something"
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] placeholder:text-ink-3 focus:outline-none focus-visible:border-ink"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-5">
              <button
                type="button"
                className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-strong px-4 py-2 text-[13px] font-medium text-on-strong transition-opacity hover:opacity-90"
              >
                Save and continue
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
