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

export function Sheet({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface ${className}`}>
      {children}
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
