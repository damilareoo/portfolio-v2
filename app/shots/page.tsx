import type { Metadata } from "next";
import { ShotsField } from "@/components/shots-field";
import { SiteNav } from "@/components/site-nav";
import { feedAssets } from "@/data/assets.generated";

export const metadata: Metadata = {
  title: "Shots — Damilare Osofisan",
  description: "Frames from shipped and unshipped work.",
};

export default function ShotsPage() {
  // Newest first, and undated frames sort last rather than pretending to a date.
  const shots = [...feedAssets].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 py-4 pb-28 sm:px-6">
      <SiteNav current="/shots" />
      {/* No labels on the page: a shot's name lives in its alt text, where it
          serves the reader who needs it without being drawn over the work. */}
      <div className="mt-8">
        <ShotsField shots={shots} />
      </div>
    </main>
  );
}
