import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="flex h-[54px] items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full border border-line px-3 py-1 transition-colors hover:border-ink-3"
      >
        <span className="text-[0.8125rem] font-medium tracking-tight">damilareoo</span>
        <span className="rounded-full bg-surface-2 px-1.5 py-px font-mono text-[0.5625rem] uppercase tracking-wider text-ink-2">
          v2
        </span>
      </Link>
      <nav className="flex items-center gap-4 sm:gap-5">
        <Link
          href="/system"
          className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
        >
          System
        </Link>
        <Link
          href="/changelog"
          className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
        >
          Changelog
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
