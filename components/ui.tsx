import type { ReactNode } from "react";

export function Chip({
  variant = "outline",
  children,
}: {
  variant?: "solid" | "outline" | "quiet";
  children: ReactNode;
}) {
  const styles = {
    solid: "bg-strong text-on-strong",
    outline: "border border-line text-ink-2",
    quiet: "bg-surface-2 text-ink-2",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs uppercase tracking-wider ${styles}`}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-wider text-ink-3">{children}</p>
  );
}

/**
 * A labelled band, which is how this site divides a page.
 *
 * It replaces `Sheet` — a rounded, bordered, raised panel that two surfaces
 * used and nothing else did. About's own note says why it had to go: "Three
 * boxes would be three cards, and the site has no cards; a rule is a mark,
 * which is what every other surface already draws." Measured, the sheet was
 * not even raised: `--surface` stands at 1.026 against `--bg`, so what a
 * visitor saw was a rounded border and nothing inside it. A border that
 * contains rather than separates is an edge, and the page needed neither.
 *
 * Lifted out of `app/colophon/page.tsx`, which had been the only surface
 * drawing it, at the point the changelog and the system page came onto the
 * same structure. The three pages that carry a record now carry one.
 */
export function Section({
  label,
  note,
  className = "",
  children,
}: {
  label: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="text-xs text-ink-2">{label}</h2>
      {note && <p className="mt-2 max-w-[34rem] text-xs leading-[1.6] text-ink-3">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-base font-medium">{value}</p>
    </div>
  );
}

/**
 * A fact, recorded. The site keeps facts in label/value rows on `/about` and
 * on `/colophon`, and each surface used to draw its own — which is how two
 * pages saying the same kind of thing ended up looking unrelated. One shape,
 * the one the majority already used. It outlived the case pages that were its
 * third caller, because the argument for it never depended on them.
 */
export function RecordRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 rule-b py-2.5 last:bg-none sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="text-sm text-ink">{children}</span>
    </div>
  );
}

/** Discipline tags — the metadata is the aesthetic, so it is never decoration. */
export function Tags({ items }: { items: readonly string[] }) {
  return (
    <span className="font-mono text-2xs uppercase tracking-wider text-ink-3">
      {items.join(" · ")}
    </span>
  );
}
