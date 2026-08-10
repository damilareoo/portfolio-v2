export const site = {
  name: "Damilare Osofisan",
  handle: "damilareoo",
  url: "https://www.damilareoo.xyz",
  email: "dosofisan7@gmail.com",
  x: "https://x.com/damilareoo",
  github: "https://github.com/damilareoo",
};

export type FeaturedProject = {
  slug: string;
  title: string;
  oneLiner: string;
  mark: string;
  href: string;
};

// Deep-dive candidates — each will get a /work/[slug] case page.
export const featured: FeaturedProject[] = [
  {
    slug: "chessever",
    title: "ChessEver",
    oneLiner: "Follow professional chess in real time. 0-1 product experience.",
    mark: "C",
    href: "https://chessever.com",
  },
  {
    slug: "sylvan",
    title: "Sylvan",
    oneLiner: "Identity for a revenue intelligence platform. Noise into signal.",
    mark: "S",
    href: "https://sylvanlabs.com",
  },
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    oneLiner: "A collection of cool experiences across the web.",
    mark: "H",
    href: "https://hitmanslibrary.xyz",
  },
];

export type IndexProject = {
  title: string;
  description: string;
  href: string;
};

export const index: IndexProject[] = [
  {
    title: "Damilare's Skills",
    description: "Skills for Claude Code",
    href: "https://damilares-skills.vercel.app/",
  },
  {
    title: "WorkBench",
    description: "Design tool and workspace",
    href: "https://nacre-quake-50137672.figma.site",
  },
  {
    title: "Pixel Soccer",
    description: "Interactive pixel art game",
    href: "https://pixel-soccer.vercel.app",
  },
];
