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
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/feed" />

      <div className="mt-8">
        <FeedGallery items={items} lastUpdated={lastUpdated} />
      </div>
    </main>
  );
}
