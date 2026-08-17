import type { Metadata } from "next";
import { FeedGallery } from "@/components/feed-gallery";
import { SiteNav } from "@/components/site-nav";
import { feedAssets } from "@/data/assets.generated";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Feed — Damilare Osofisan",
  description: "Frames from shipped and unshipped work.",
};

export default function FeedPage() {
  // Newest first, and undated frames sort last rather than pretending to a date.
  const items = [...feedAssets].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const current = changelog[0];
  const lastUpdated = new Date(`${current.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="mx-auto w-full max-w-[1180px] px-[var(--pg-gap)] py-8 sm:py-10">
      <SiteNav current="/feed" />

      <header className="mt-14 max-w-[42rem] sm:mt-20">
        <h1 className="text-[1.75rem] font-medium leading-[1.15] tracking-tight">Feed</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
          Frames from shipped and unshipped work. No commentary — the archive is
          where things get explained.
        </p>
      </header>

      <div className="mt-12">
        <FeedGallery items={items} lastUpdated={lastUpdated} />
      </div>
    </main>
  );
}
