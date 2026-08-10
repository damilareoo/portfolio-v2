export type Tile = {
  slug: string;
  title: string;
  meta: string;
  href: string;
  // mark tiles render a letterform until real artwork lands; image tiles render /public artwork
  kind: "mark" | "image";
  mark?: string;
  image?: string;
  tone: "strong" | "surface";
  // column-flow aspect rhythm
  aspect: "square" | "tall" | "wide";
};

export const tiles: Tile[] = [
  {
    slug: "chessever",
    title: "ChessEver",
    meta: "0–1 product",
    href: "https://chessever.com",
    kind: "mark",
    mark: "C",
    tone: "strong",
    aspect: "tall",
  },
  {
    slug: "hitmans-library",
    title: "Hitman's Library",
    meta: "Experiences",
    href: "https://hitmanslibrary.xyz",
    kind: "mark",
    mark: "H",
    tone: "surface",
    aspect: "square",
  },
  {
    slug: "sylvan",
    title: "Sylvan",
    meta: "Identity",
    href: "https://sylvanlabs.com",
    kind: "mark",
    mark: "S",
    tone: "surface",
    aspect: "wide",
  },
  {
    slug: "workbench",
    title: "WorkBench",
    meta: "Design tool",
    href: "https://nacre-quake-50137672.figma.site",
    kind: "mark",
    mark: "W",
    tone: "strong",
    aspect: "square",
  },
  {
    slug: "pixel-soccer",
    title: "Pixel Soccer",
    meta: "Play",
    href: "https://pixel-soccer.vercel.app",
    kind: "mark",
    mark: "P",
    tone: "surface",
    aspect: "tall",
  },
  {
    slug: "damilares-skills",
    title: "Damilare's Skills",
    meta: "Claude Code",
    href: "https://damilares-skills.vercel.app/",
    kind: "mark",
    mark: "S.",
    tone: "strong",
    aspect: "wide",
  },
];
