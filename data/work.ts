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

export type CaseMedia = {
  /** Path under public/work/<slug>/. Absent renders a labelled empty frame. */
  src?: string;
  alt?: string;
  caption?: string;
  /** Slot shape while there is no art to measure, e.g. "4 / 3". */
  ratio?: string;
};

/**
 * A case page is an ordered list of these. Text blocks are narrow and sit at
 * decision points, so the argument stays readable without a wall of prose
 * before the first image.
 */
export type CaseBlock =
  | ({ kind: "full" } & CaseMedia)
  | { kind: "pair"; items: [CaseMedia, CaseMedia] }
  | { kind: "text"; heading?: string; body: string[] }
  | { kind: "quote"; body: string; attribution?: string };

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
  /** Who it was for, when the piece was client work. */
  client?: string;
  role?: string;
  stack?: string;
  /** Printed under the title on a selected card, in place of the raw href. */
  domain?: string;
  /** The tag at the foot of a selected card — what kind of piece this is. */
  category?: string;
  /** When the work started and whether it is ongoing, e.g. "2026 — Now". */
  period?: string;
  /**
   * The project's real brand palette. Rendered desaturated, and only returned to
   * full colour while a pointer is held on it — genuine metadata in the site's
   * own register. Left undefined the strip does not render; the site does not
   * invent a palette it does not have.
   */
  palette?: string[];
  /**
   * Case study body. Selected work without blocks renders its record and says
   * so plainly rather than padding — the site does not pretend to depth it lacks.
   */
  blocks?: CaseBlock[];
  /** @deprecated Superseded by `blocks`. Kept so old entries still render. */
  sections?: CaseSection[];
};

export const work: WorkItem[] = [
  {
    slug: "chessever",
    title: "ChessEver",
    oneLiner: "Follow professional chess in real time.",
    year: "2025",
    period: "2025 — Now",
    tier: "selected",
    disciplines: ["Product Design", "Interaction"],
    href: "https://chessever.com",
    domain: "chessever.com",
    category: "Product",
    role: "0–1 Product Experience",
    stack: "iOS, Android",
    palette: ["#0e9ac6", "#b4b4b4", "#0d1520"],
    mark: "C",
    tone: "strong",
    blocks: [
      { kind: "full", alt: "ChessEver — real-time chess tournament tracking" },
      {
        kind: "text",
        body: [
          "ChessEver is a mobile app that lets you follow professional chess tournaments and players in real time. With FollowChess gone, there was no simple way to track live games, standings, and player stats in one place. We built ChessEver to bring that back.",
        ],
      },
      {
        kind: "text",
        heading: "The problem",
        body: [
          "Chess fans had no intuitive way to follow live tournaments. Existing platforms were clunky, outdated, or shut down entirely. Serious players and fans needed something that felt natural. Swipe between games, pin favourites, search any player or event instantly.",
        ],
      },
      {
        kind: "text",
        heading: "What we built",
        body: [
          "We designed the entire product from zero. Clean interface. Real-time game tracking. Engine evaluation. Complete player stats and head-to-head records. Everything works exactly how you would expect it to. No learning curve.",
        ],
      },
      {
        kind: "text",
        heading: "The approach",
        body: [
          "Every feature had to earn its place. We focused on getting the core experience right — watching games unfold with precision, following your favourite players, curating your own feed. Simple to use, built for people who actually care about chess.",
        ],
      },
      {
        kind: "quote",
        body: "Averaging 200+ sign-ups daily since launch, and a Top 10 finalist in the TWIST Gamma Pitch Deck Competition.",
        attribution: "The impact, as of the v1 write-up",
      },
      {
        kind: "text",
        heading: "The impact",
        body: [
          "Launched on iOS and Android. Growing Discord community. We are still actively building, refining based on user feedback, and shipping new features to make ChessEver the definitive platform for following chess.",
        ],
      },
    ],
  },
  {
    slug: "sylvan",
    title: "Sylvan",
    oneLiner: "Identity for a revenue intelligence platform. Noise into signal.",
    year: "2025",
    period: "2025",
    tier: "selected",
    disciplines: ["Identity"],
    href: "https://sylvanlabs.com",
    domain: "sylvanlabs.com",
    category: "Identity",
    role: "Brand Design, Logo Design, Web Design, Visual System",
    palette: ["#1c3b37", "#48615e", "#728582", "#b9c3c2"],
    mark: "S",
    tone: "surface",
    blocks: [
      { kind: "full", alt: "Sylvan — revenue intelligence platform" },
      {
        kind: "text",
        body: [
          "Sylvan helps teams understand what actually drives revenue by making customer data simple to read. Most analytics tools bury you in reports and slow dashboards. Sylvan cuts through that.",
        ],
      },
      {
        kind: "text",
        heading: "The challenge",
        body: [
          "Revenue teams need to spot the small changes in customer behaviour that matter. The problem is most platforms make this harder, not easier. We needed to build an identity that felt like the opposite of cluttered analytics tools.",
        ],
      },
      {
        kind: "text",
        heading: "What we built",
        body: [
          "We created the signal mark — a visual system that shows how customer actions create patterns over time. It shifts and adapts, kind of like how real opportunities appear in customer journeys. The mark became the core of Sylvan's identity.",
        ],
      },
      {
        kind: "quote",
        body: "Keep it simple but make it mean something.",
        attribution: "The approach",
      },
      {
        kind: "text",
        heading: "The approach",
        body: [
          "The identity had to communicate clarity without feeling cold or technical. Every piece of the system reinforces the idea that Sylvan turns noise into signal.",
        ],
      },
    ],
  },
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    oneLiner: "A collection of cool experiences across the web.",
    year: "2025",
    period: "2025 — Now",
    tier: "project",
    disciplines: ["Build", "Interaction"],
    href: "https://hitmanslibrary.xyz",
    domain: "hitmanslibrary.xyz",
    category: "Collection",
    mark: "H",
    tone: "surface",
  },
  {
    slug: "damilares-skills",
    title: "Damilare's Skills",
    oneLiner: "Skills for Claude Code, etc.",
    year: "2025",
    period: "2025 — Now",
    tier: "project",
    disciplines: ["Build"],
    href: "https://damilares-skills.vercel.app/",
    domain: "damilares-skills.vercel.app",
    category: "Skills",
    mark: "S.",
    tone: "strong",
  },
  {
    slug: "workbench",
    title: "WorkBench",
    oneLiner: "Design tool and workspace.",
    year: "2025",
    period: "2025",
    tier: "project",
    disciplines: ["Product Design"],
    href: "https://nacre-quake-50137672.figma.site/",
    domain: "figma.site",
    category: "Tool",
    mark: "W",
    tone: "strong",
  },
  {
    slug: "pixel-soccer",
    title: "Pixel Soccer",
    oneLiner: "Interactive pixel art game.",
    year: "2025",
    period: "2025",
    tier: "project",
    disciplines: ["Build", "Interaction"],
    href: "https://pixel-soccer.vercel.app",
    domain: "pixel-soccer.vercel.app",
    category: "Game",
    palette: ["#f7e26b", "#d24b4b", "#306850", "#1a1c2c"],
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
