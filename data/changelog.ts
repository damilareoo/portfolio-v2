export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string[];
  // Immutable Vercel deployment URL — every version stays viewable forever.
  deployment?: string;
};

// Newest first. Every change to the site gets an entry before it ships.
export const changelog: ChangelogEntry[] = [
  {
    version: "0.6.0",
    date: "2026-08-14",
    title: "The site starts reporting on itself",
    notes: [
      "Dials turned is now a shared count on Upstash Redis — the DialKit stops being a solo instrument",
      "Every visitor who plays with the dials leaves a trace the next visitor sees",
      "Re-selecting the value you are already on is not a turn: the counter measures change, not clicks",
      "Spotify now-playing carried over from portfolio-v1",
      "Build chip prints the commit the page was built from",
      "Counters never poll and never climb on their own — the shared number moves when you move it",
      "Rate limited to 60 turns a minute per visitor, so one person cannot define everyone's number",
      "No store configured degrades to a local count labelled 'by you' rather than a zero",
    ],
    deployment: "https://portfolio-v2-q3522fgpt-damilares-projects-fc682e5f.vercel.app",
  },
  {
    version: "0.5.0",
    date: "2026-08-13",
    title: "The home selects, the archive holds everything",
    notes: [
      "Design language locked as Handled — see docs/specs/2026-08-13-design-language.md",
      "Work is now tiered: selected, project, index, in one model at data/work.ts",
      "Home centre rail carries selected work only, with room, instead of seven peers",
      "New /work archive with discipline filters, tiered sections, and honest last-updated",
      "New /work/[slug] case pages — they say the write-up is unfinished rather than padding it",
      "Playground entrance animation removed: nothing on the site moves unless touched",
    ],
    deployment: "https://portfolio-v2-bvi921xxm-damilares-projects-fc682e5f.vercel.app",
  },
  {
    version: "0.4.0",
    date: "2026-08-11",
    title: "Three rails and a working DialKit",
    notes: [
      "Home restructured into three rails: profile record, playground, settings",
      "DialKit ships as typographic text controls — theme, type scale, density",
      "Dials rewrite real design tokens live and persist across visits",
      "Every type size converted from px to rem so the type dial reaches all of it",
      "Fixed a stale-closure bug where setting two dials at once dropped one",
    ],
    deployment: "https://portfolio-v2-1af5f6xdg-damilares-projects-fc682e5f.vercel.app",
  },
  {
    version: "0.3.0",
    date: "2026-08-10",
    title: "Split-layout portfolio, second link",
    notes: [
      "Home rebuilt as a split layout: profile window plus an independently scrolling playground",
      "Playground tile grid with entrance stagger, hover reveals, and slots for real artwork",
      "Live Lagos clock, copy-email pill",
      "Portfolio now ships to its own link; System and Changelog stay on the workshop link",
    ],
    deployment: "https://portfolio-v2-sigiek1dr-damilares-projects-fc682e5f.vercel.app",
  },
  {
    version: "0.2.0",
    date: "2026-08-10",
    title: "Home, design system page, changelog",
    notes: [
      "Real home: hero sheet, featured strip, project index, background, footer",
      "Specimen moved to /system as the living design system reference",
      "Shared primitives: Chip, Sheet, SectionLabel, Meta",
      "This changelog, with a viewable deployment per version",
    ],
    deployment: "https://portfolio-v2-aqm0j412q-damilares-projects-fc682e5f.vercel.app",
  },
  {
    version: "0.1.0",
    date: "2026-08-10",
    title: "Foundation",
    notes: [
      "Monochrome two-skin token system from the Monivoice-derived values",
      "Suisse Int'l and Suisse Int'l Mono via next/font/local",
      "Light/dark switching with inverted strong fill in dark",
      "Specimen page proving the value ladder in both modes",
    ],
    deployment: "https://portfolio-v2-5rg8l9yhi-damilares-projects-fc682e5f.vercel.app",
  },
];
