// One model for every piece of work.
//
// This file is the whole hierarchy. There is no tier and no era: two ways to
// say where a piece belongs is one too many, and the era layer that grouped
// these by employer spent two of its five sections saying it had nothing to
// show.
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
  /**
   * How the artwork is presented. A screen capture reads as the thing it was
   * captured from — a hairline and a radius in the site's own tokens, never an
   * imitation of chrome and never a shadow.
   */
  frame?: "phone" | "browser";
  /**
   * One frame per case may break the column and run the full measure. Which one
   * is authored: a computed "widest image wins" would put the emphasis wherever
   * the export happened to be largest.
   */
  bleed?: true;
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
   * below. There is no rail: the home is a single column of products, and
   * prose set beside a reel needs a second column to sit in.
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

/**
 * The work, in the order the home shows it.
 *
 * Authored rather than derived: all three are 2025, so a date cannot order
 * them and a `sort` field invented to justify a hand-picked sequence would be
 * a field that exists to be overridden. The array is the order.
 */
export const work: WorkItem[] = [
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    oneLiner:
      "Just under two hundred websites worth studying, each taken apart into its palette, typefaces, and assets.",
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
    /* Presentation is authored here, frame by frame. The rule, applied across
       all three cases: a capture of a whole window or a whole screen held up
       on a plate gets the device treatment; a capture used as an
       edge-to-edge field does not, because the field is already the gesture;
       and a crop never does, since a device frame around a crop claims you
       are seeing the whole page. */
    blocks: [
      {
        kind: "full",
        ratio: "16 / 10",
        alt: "Hitman's Library — the collection",
        bleed: true,
        caption: "A rail, a grid, and a preview panel",
      },
      { kind: "pair", items: [{}, {}] },
      { kind: "inset", items: [{ frame: "browser", caption: "The grid, further down" }] },
      { kind: "full" },
      /* No frame: this one is a crop, not a window. It also used to be
         captioned "A single entry, taken apart", which describes the preview
         panel — a different screen than the one that lands here. */
      { kind: "inset", items: [{ caption: "One card: title, domain, palette, category" }] },
      {
        kind: "inset",
        items: [
          { frame: "phone", caption: "The rail becomes a row of chips" },
          { frame: "phone", caption: "The filter row holds while the grid scrolls" },
        ],
      },
      {
        kind: "inset",
        tone: "strong",
        items: [{ frame: "phone", caption: "Still one column, all the way down" }],
      },
    ],
  },
  {
    slug: "sylvan",
    title: "Sylvan",
    oneLiner:
      "Identity for a revenue analytics company: one signal mark, and a system built to read as the opposite of a cluttered dashboard.",
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
      {
        kind: "full",
        ratio: "16 / 10",
        alt: "Sylvan — the signal mark in motion",
        bleed: true,
        caption: "The signal mark, moving",
      },
      {
        kind: "inset",
        items: [{ ratio: "16 / 10", frame: "browser", caption: "sylvanlabs.com" }],
      },
      /* The art that lands here is a 430-wide capture and carries its own
         portrait dimensions, so the declared ratio only shapes the slot while
         the folder is empty. */
      {
        kind: "inset",
        items: [{ ratio: "16 / 10", frame: "phone", caption: "The same page at phone width" }],
      },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "full", ratio: "16 / 10" },
      { kind: "inset", tone: "strong", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
    ],
  },
  {
    slug: "chessever",
    title: "ChessEver",
    oneLiner:
      "Live professional chess on iOS and Android — boards, clocks, and standings, in the gap FollowChess left when it shut down.",
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
      /* No `frame` on this one, and it is the one frame on the site that most
         looks like it wants one: the export is key art with a handset already
         drawn into it. A phone treatment here would be a second device around
         the first. */
      {
        kind: "full",
        ratio: "16 / 10",
        alt: "ChessEver — real-time chess tournament tracking",
        bleed: true,
        caption: "Round 4, live: clocks running, favourites pinned",
      },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "inset", items: [{ ratio: "16 / 10" }] },
      { kind: "pair", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
      { kind: "full", ratio: "16 / 10" },
      { kind: "inset", tone: "strong", items: [{ ratio: "4 / 3" }, { ratio: "4 / 3" }] },
    ],
  },
];

export function findWork(slug: string) {
  return work.find((w) => w.slug === slug);
}
