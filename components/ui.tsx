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
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider ${styles}`}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">{children}</p>
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
      <p className="text-[0.8125rem] text-ink-2">{label}</p>
      <p className="mt-1 text-[0.9375rem] font-medium">{value}</p>
    </div>
  );
}

/**
 * A fact, recorded. The site keeps facts in label/value rows on `/about`, on
 * `/colophon`, and on a case page, and until now each surface drew its own —
 * which is why the case page read as foreign rather than as under-designed.
 * This is the shape the majority already used.
 */
export function RecordRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 rule-b py-2.5 last:bg-none sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="text-[0.6875rem] text-ink-3">{label}</span>
      <span className="text-[0.75rem] text-ink">{children}</span>
    </div>
  );
}
