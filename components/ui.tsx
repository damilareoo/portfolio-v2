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
