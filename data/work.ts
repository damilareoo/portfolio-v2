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
  /**
   * One or two frames held inside a tinted plate rather than bled to the
   * column edge. The plate is what lets a reel breathe — without it every
   * frame is the same size and the page reads as a contact sheet.
   */
  | {
      kind: "inset";
      items: [CaseMedia] | [CaseMedia, CaseMedia];
      tone?: "surface" | "strong";
    }
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
  /**
   * True when the artwork is drawn rather than captured. The page says so: this
   * site does not show a frame it did not make and let it read as a screenshot.
   */
  recreated?: boolean;
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
   * Rail prose. The case page keeps every word in the left column and gives the
   * right column entirely to the work, so these read top-down beside the reel
   * rather than interrupting it.
   */
  intro?: string[];
  approach?: string[];
  /**
   * Case study body — visual blocks only now that prose lives in the rail.
   * Selected work without blocks renders its record and says so plainly rather
   * than padding — the site does not pretend to depth it lacks.
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
    intro: [
      "ChessEver is a mobile app that lets you follow professional chess tournaments and players in real time. With FollowChess gone, there was no simple way to track live games, standings, and player stats in one place. We built ChessEver to bring that back.",
      "Chess fans had no intuitive way to follow live tournaments. Existing platforms were clunky, outdated, or shut down entirely. Serious players and fans needed something that felt natural — swipe between games, pin favourites, search any player or event instantly.",
    ],
    approach: [
      "We designed the entire product from zero. Clean interface, real-time game tracking, engine evaluation, complete player stats and head-to-head records. Everything works exactly how you would expect it to. No learning curve.",
      "Every feature had to earn its place. We focused on getting the core experience right — watching games unfold with precision, following your favourite players, curating your own feed.",
      "Launched on iOS and Android, averaging 200+ sign-ups daily since launch, and a Top 10 finalist in the TWIST Gamma Pitch Deck Competition.",
    ],
    blocks: [
      /* Declared ratios only shape a slot while it is empty — real art carries
         its own dimensions — so these stay shallow rather than opening a
         portrait-sized void on a page whose art has not landed yet. */
      { kind: "full", ratio: "16 / 10", alt: "ChessEver — real-time chess tournament tracking" },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "inset", items: [{ ratio: "16 / 10" }] },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "full", ratio: "16 / 10" },
      { kind: "inset", tone: "strong", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
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
    intro: [
      "Sylvan helps teams understand what actually drives revenue by making customer data simple to read. Most analytics tools bury you in reports and slow dashboards. Sylvan cuts through that.",
      "Revenue teams need to spot the small changes in customer behaviour that matter, and most platforms make that harder rather than easier. The identity had to feel like the opposite of a cluttered analytics tool.",
    ],
    approach: [
      "We created the signal mark — a visual system that shows how customer actions create patterns over time. It shifts and adapts, the way real opportunities surface in a customer journey. The mark became the core of the identity.",
      "Keep it simple, but make it mean something. The system had to communicate clarity without feeling cold or technical. Every piece of it reinforces the one idea: Sylvan turns noise into signal.",
    ],
    blocks: [
      { kind: "full", ratio: "16 / 10", alt: "Sylvan — the signal mark in motion" },
      { kind: "inset", items: [{ ratio: "16 / 10", caption: "sylvanlabs.com" }] },
      { kind: "inset", items: [{ ratio: "16 / 10" }] },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "full", ratio: "16 / 10" },
      { kind: "inset", tone: "strong", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
    ],
  },
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    oneLiner: "A collection of cool experiences across the web.",
    year: "2025",
    // Promoted to the home: the four selected pieces carry the argument now.
    period: "2025 — Now",
    tier: "selected",
    disciplines: ["Build", "Interaction"],
    href: "https://hitmanslibrary.xyz",
    domain: "hitmanslibrary.xyz",
    category: "Collection",
    role: "Design, Build",
    stack: "Next.js",
    mark: "H",
    tone: "surface",
    intro: [
      "Hitman's Library is a catalogue of websites worth studying — just under two hundred of them, filed by what they are rather than by how they look. SaaS, finance, commerce, portfolios, and a long tail of everything else.",
      "Most inspiration sites are a wall of screenshots. You scroll, you feel something, you leave with nothing you can use. The problem is not a shortage of pretty pages; it is that the useful part of a reference — what the colours actually are, what the type is doing — is the part a screenshot throws away.",
    ],
    approach: [
      "So each entry is taken apart. Every site carries its own palette, its typefaces, and its assets alongside the capture, and the whole collection is searchable and sortable — newest, oldest, alphabetical, most looked at.",
      "The interface stays out of the way: a category rail, a grid, and a preview panel. It is built to be opened while you are working on something else, which is the only way a reference library ever gets used twice.",
    ],
    blocks: [
      { kind: "full", ratio: "16 / 10", alt: "Hitman's Library — the collection" },
      { kind: "pair", items: [{}, {}] },
      { kind: "inset", items: [{}] },
      { kind: "full" },
      { kind: "inset", items: [{ caption: "A single entry, taken apart" }] },
      { kind: "inset", items: [{}, {}] },
      { kind: "inset", tone: "strong", items: [{ caption: "Mobile" }] },
    ],
  },
  {
    slug: "endgame-mobile",
    title: "Endgame.ai Mobile",
    oneLiner: "Chess on a phone, for people who follow the game.",
    year: "2026",
    period: "2026 — Now",
    tier: "selected",
    disciplines: ["Product Design"],
    domain: "endgame.ai",
    category: "Mobile",
    mark: "E",
    tone: "strong",
    recreated: true,
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
