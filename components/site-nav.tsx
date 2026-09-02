import Link from "next/link";
import { ThemeControl } from "@/components/theme-control";

const SURFACES = [
  { href: "/", label: "Home" },
  { href: "/shots", label: "Shots" },
  { href: "/about", label: "About" },
  { href: "/colophon", label: "Colophon" },
] as const;

/**
 * Filled chips rather than outlined ones: the inactive surfaces read as raised
 * keys and the current one as the key held down. An outline would make the nav
 * a diagram of itself, which is the thing the reference does not do.
 *
 * The row is the one place on the site that cannot be allowed to set its own
 * width. Four labels plus three theme buttons came to 312px inside a 280px
 * column at 320px wide, and because the chip row could neither wrap nor shrink
 * the theme control was simply pushed 12px past the viewport — every route
 * scrolled sideways on the narrowest phone, from this row alone. So the chips
 * wrap and the theme control does not: the keys reflow onto a second line and
 * the control stays pinned to the right edge where it started. The tighter
 * phone spacing below keeps that second line from being needed until the type
 * dial is turned up, but the wrap is what makes the row safe at any setting.
 */
export function SiteNav({ current }: { current?: string }) {
  return (
    <div className="flex items-center justify-between gap-x-2 sm:gap-x-4">
      <nav className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-1 sm:gap-x-1">
        {SURFACES.map((surface) => {
          const active = current === surface.href;
          return (
            <Link
              key={surface.href}
              href={surface.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-[4px] px-1.5 py-1 font-mono text-2xs uppercase tracking-[0.08em] transition-colors sm:px-2 ${
                active
                  ? "bg-strong text-on-strong"
                  : "bg-surface-2 text-ink-2 hover:text-ink"
              }`}
            >
              {surface.label}
            </Link>
          );
        })}
      </nav>

      {/* Never the thing that gives: it is three fixed 24px squares, so
          shrinking it would deform the buttons rather than save the row. */}
      <div className="shrink-0">
        <ThemeControl />
      </div>
    </div>
  );
}
