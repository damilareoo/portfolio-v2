import type { Metadata } from "next";
import { Chip, SectionLabel, Sheet } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "System — Damilare Osofisan",
  description: "The living design system behind this site.",
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

function Hex({ light, dark }: { light: string; dark: string }) {
  return (
    <span className="font-mono text-[11px] text-ink-3">
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
          <h1 className="text-[17px] font-medium tracking-tight">Values</h1>
          <p className="mt-1 text-[13px] text-ink-2">
            The full ladder. Hierarchy comes from tonal value, never hue.
          </p>

          <div className="mt-6">
            <SectionLabel>Value ladder</SectionLabel>
          </div>
          <ul className="mt-3 space-y-2">
            {ladder.map((s) => (
              <li key={s.token} className="flex items-center gap-3">
                <span className={`size-5 rounded-md border border-line ${s.cls}`} />
                <span className="flex-1 font-mono text-[11px] text-ink-2">--{s.token}</span>
                <Hex light={s.light} dark={s.dark} />
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <SectionLabel>Type</SectionLabel>
            <div className="mt-3 space-y-1.5">
              <p className="text-[15px] font-medium">Primary — Suisse Medium</p>
              <p className="text-[14px] text-ink-2">Secondary — Suisse Regular</p>
              <p className="text-[13px] text-ink-3">Tertiary — placeholders, meta</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
                Mono — labels, hex, indices
              </p>
            </div>
          </div>
        </Sheet>

        <Sheet className="p-6 sm:p-7">
          <h2 className="text-[17px] font-medium tracking-tight">Primitives</h2>
          <p className="mt-1 text-[13px] text-ink-2">
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
                className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Ghost
              </button>
              <button
                type="button"
                className="rounded-full bg-strong px-4 py-2 text-[13px] font-medium text-on-strong transition-opacity hover:opacity-90"
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
              className="mt-3 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] placeholder:text-ink-3 focus:outline-none focus-visible:border-ink"
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
            <SectionLabel>Rules</SectionLabel>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-ink-2">
              <li>Semantic tokens only — components never touch raw hex.</li>
              <li>Hairlines separate surfaces. No shadows.</li>
              <li>Dark mode inverts the strong fill.</li>
              <li>Radii: 16 sheets, 12 tiles, 8 inputs, full pills.</li>
            </ul>
          </div>
        </Sheet>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
