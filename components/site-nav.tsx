import Link from "next/link";
import { site } from "@/data/site";

const SURFACES = [
  { href: "/work", label: "Work" },
  { href: "/feed", label: "Feed" },
  { href: "/about", label: "About" },
] as const;

/**
 * Four surfaces, and the nav names all four. /system and /changelog stay live
 * but stay out of here — the colophon links to them, which is where a visitor
 * would think to look for them.
 */
export function SiteNav({ current }: { current?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav className="flex items-center gap-1.5">
        <Link
          href="/"
          aria-current={current === "/" ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors ${
            current === "/"
              ? "bg-strong text-on-strong"
              : "border border-line text-ink-2 hover:text-ink"
          }`}
        >
          Index
        </Link>
        {SURFACES.map((surface) => {
          const active = current === surface.href;
          return (
            <Link
              key={surface.href}
              href={surface.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors ${
                active
                  ? "bg-strong text-on-strong"
                  : "border border-line text-ink-2 hover:text-ink"
              }`}
            >
              {surface.label}
            </Link>
          );
        })}
      </nav>

      <a
        href={`mailto:${site.email}`}
        className="font-mono text-[0.6875rem] text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
      >
        {site.email}
      </a>
    </div>
  );
}
