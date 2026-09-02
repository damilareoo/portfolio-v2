// One model for every piece of work.
//
// Where a piece sits is decided by its era, in data/eras.ts, which references
// it by slug. There is no tier: two ways to say where a piece belongs is one
// too many, and the tier that survived v1.11.0 had only ever held one name.
//
// See docs/specs/2026-09-01-home-as-feed-design.md.

export const disciplines = [
  "Product Design",
  "Interaction",
  "Identity",
  "Build",
] as const;

export type Discipline = (typeof disciplines)[number];

export type CaseMedia = {
  /** Path under public/work/<slug>/. Absent renders a labelled empty frame. */
  src?: string;
  alt?: string;
  caption?: string;
  /** Slot shape while there is no art to measure, e.g. "4 / 3". */
  ratio?: string;
};

/**
 * An entry's reel is an ordered list of these. Text blocks are narrow and sit at
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
  disciplines: Discipline[];
  /** The live product. Absent for work that no longer exists publicly. */
  href?: string;
  /** Who it was for, when the piece was client work. */
  client?: string;
  role?: string;
  stack?: string;
  /**
   * The written argument. Both sit inside the entry's fold, in one centred
   * column with the record rows between them — `intro` above, `approach`
   * below. There is no rail: the home is a single column of eras, and prose
   * set beside a reel needs a second column to sit in.
   */
  intro?: string[];
  approach?: string[];
  /**
   * The reel — visual blocks only, since the prose above carries the words.
   * Work without blocks renders its record and says so plainly rather than
   * padding: the site does not pretend to depth it lacks.
   */
  blocks?: CaseBlock[];
};

export const work: WorkItem[] = [
  {
    slug: "chessever",
    title: "ChessEver",
    oneLiner: "Follow professional chess in real time.",
    year: "2025",
    disciplines: ["Product Design", "Interaction"],
    href: "https://chessever.com",
    role: "0–1 Product Experience",
    stack: "iOS, Android",
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
    disciplines: ["Identity"],
    href: "https://sylvanlabs.com",
    role: "Brand Design, Logo Design, Web Design, Visual System",
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
    disciplines: ["Build", "Interaction"],
    href: "https://hitmanslibrary.xyz",
    role: "Design, Build",
    stack: "Next.js",
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
];

export function findWork(slug: string) {
  return work.find((w) => w.slug === slug);
}
