import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The bar every surface but the portfolio home wears.
 *
 * It wraps, for the same reason the chip row on the home wraps. Measured at
 * 320px with the type dial at L: the brand lockup and the three nav items came
 * to 323px inside a 288px column, and because a fixed-height row can neither
 * wrap nor shrink, the theme toggle was simply pushed 31px past the viewport —
 * every surface carrying this header scrolled sideways at a setting the visitor
 * is free to choose. So the height is a floor rather than a fixed measure and
 * the row is allowed a second line. It never needs one at the default dial;
 * having it is what makes the header safe at every dial and every width.
 *
 * The sizes are scale steps, not literals: `text-sm` and `text-2xs` are the
 * exact values the literals here used to spell out by hand.
 */
export function SiteHeader() {
  return (
    <header className="flex min-h-[54px] flex-wrap items-center justify-between gap-x-4 gap-y-1 rule-b bg-surface px-4 py-2 sm:px-6">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 rounded-full border border-line px-3 py-1 transition-colors hover:border-ink-3"
      >
        <span className="truncate text-sm font-medium tracking-tight">damilareoo</span>
        <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-px font-mono text-2xs uppercase tracking-wider text-ink-2">
          v2
        </span>
      </Link>
      <nav className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-5">
        <Link href="/system" className="text-sm text-ink-2 transition-colors hover:text-ink">
          System
        </Link>
        <Link href="/changelog" className="text-sm text-ink-2 transition-colors hover:text-ink">
          Changelog
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
