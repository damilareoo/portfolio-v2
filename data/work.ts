// One model for every piece of work, tiered by how much room it earns.
//
//   selected — the argument. Gets a /work/[slug] case page and room on the home rail.
//   project  — live things that link out. Tile plus one line, archive only.
//   index    — text only: title, year, tags. No images, no room.
//
// See docs/specs/2026-08-13-design-language.md.

export const disciplines = [
  "Product Design",
  "Interaction",
  "Identity",
  "Build",
] as const;

export type Discipline = (typeof disciplines)[number];
export type Tier = "selected" | "project" | "index";

export type CaseSection = {
  heading: string;
  body: string[];
};

export type WorkItem = {
  slug: string;
  title: string;
  oneLiner: string;
  year: string;
  tier: Tier;
  disciplines: Discipline[];
  /** The live product. Absent for work that no longer exists publicly. */
  href?: string;
  /** Tile face — selected and project tiers. A letterform until real artwork lands. */
  mark?: string;
  image?: string;
  tone?: "strong" | "surface";
  /**
   * Case study body. Selected work without sections renders its record and says
   * so plainly rather than padding — the site does not pretend to depth it lacks.
   */
  sections?: CaseSection[];
};

export const work: WorkItem[] = [
  {
    slug: "chessever",
    title: "ChessEver",
    oneLiner: "Follow professional chess in real time.",
    year: "2025",
    tier: "selected",
    disciplines: ["Product Design", "Interaction"],
    href: "https://chessever.com",
    mark: "C",
    tone: "strong",
  },
  {
    slug: "sylvan",
    title: "Sylvan",
    oneLiner: "Identity for a revenue intelligence platform. Noise into signal.",
    year: "2025",
    tier: "selected",
    disciplines: ["Identity"],
    href: "https://sylvanlabs.com",
    mark: "S",
    tone: "surface",
  },
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    oneLiner: "A collection of cool experiences across the web.",
    year: "2025",
    tier: "project",
    disciplines: ["Build", "Interaction"],
    href: "https://hitmanslibrary.xyz",
    mark: "H",
    tone: "surface",
  },
  {
    slug: "workbench",
    title: "WorkBench",
    oneLiner: "Design tool and workspace.",
    year: "2025",
    tier: "project",
    disciplines: ["Product Design"],
    href: "https://nacre-quake-50137672.figma.site",
    mark: "W",
    tone: "strong",
  },
  {
    slug: "damilares-skills",
    title: "Damilare's Skills",
    oneLiner: "Skills for Claude Code.",
    year: "2025",
    tier: "project",
    disciplines: ["Build"],
    href: "https://damilares-skills.vercel.app/",
    mark: "S.",
    tone: "strong",
  },
  {
    slug: "pixel-soccer",
    title: "Pixel Soccer",
    oneLiner: "Interactive pixel art game.",
    year: "2025",
    tier: "project",
    disciplines: ["Build", "Interaction"],
    href: "https://pixel-soccer.vercel.app",
    mark: "P",
    tone: "surface",
  },
];

export const selected = work.filter((w) => w.tier === "selected");
export const projects = work.filter((w) => w.tier === "project");
export const index = work.filter((w) => w.tier === "index");

export function findWork(slug: string) {
  return work.find((w) => w.slug === slug);
}

/** Disciplines that actually appear in the work — the archive never offers an empty filter. */
export const activeDisciplines = disciplines.filter((d) =>
  work.some((w) => w.disciplines.includes(d)),
);
