import Link from "next/link";
import { site } from "@/data/site";
import { changelog } from "@/data/changelog";

export function SiteFooter() {
  const current = changelog[0];
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <div className="border-t border-line pt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[0.8125rem] font-medium tracking-tight">damilareoo</span>
            <span className="text-[0.8125rem] text-ink-3">Lagos, WAT</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={site.x}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
            >
              X
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
            >
              GitHub
            </a>
            <a
              href={`mailto:${site.email}`}
              className="text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
            >
              Email
            </a>
            <Link
              href="/changelog"
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-2 transition-colors hover:text-ink"
            >
              v{current.version}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
