import Link from "next/link";
import { ThemeControl } from "@/components/theme-control";

const SURFACES = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/about", label: "About" },
  { href: "/colophon", label: "Colophon" },
] as const;

/**
 * Filled chips rather than outlined ones: the inactive surfaces read as raised
 * keys and the current one as the key held down. An outline would make the nav
 * a diagram of itself, which is the thing the reference does not do.
 */
export function SiteNav({ current }: { current?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex items-center gap-1">
        {SURFACES.map((surface) => {
          const active = current === surface.href;
          return (
            <Link
              key={surface.href}
              href={surface.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-[4px] px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] transition-colors ${
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

      <ThemeControl />
    </div>
  );
}
