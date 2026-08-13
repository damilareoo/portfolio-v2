import type { Metadata } from "next";
import { WorkArchive } from "@/components/work-archive";
import { changelog } from "@/data/changelog";

export const metadata: Metadata = {
  title: "Work — Damilare Osofisan",
  description: "Selected work, projects, and index.",
};

export default function WorkPage() {
  const current = changelog[0];
  const date = new Date(`${current.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return <WorkArchive lastUpdated={`${date} · v${current.version}`} />;
}
