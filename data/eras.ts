import type { Era } from "@/lib/eras";

/**
 * Work grouped by when it was made and who it was for.
 *
 * The three contract eras (endgame, chessever, hex) draw their periods and roles
 * from `data/experience.ts`; nothing here invents a history. Independent and
 * side-projects are categories rather than roles, invented to organize work
 * without a formal employer. `sort` is the era's end, and side projects carry
 * no date because they never ended.
 */
export const eras: Era[] = [
  {
    id: "endgame",
    name: "Endgame AI",
    role: "Product Designer",
    period: "Apr 2026 — Aug 2026",
    sort: "2026-08",
    href: "https://endgame.ai",
    logo: "/companies/endgame.png",
    blurb: "Product design on contract for an online chess platform.",
    entries: [],
  },
  {
    id: "chessever",
    name: "ChessEver",
    role: "Product Designer",
    period: "Apr 2025 — Apr 2026",
    sort: "2026-04",
    href: "https://chessever.com",
    blurb:
      "A year of product design on real-time coverage of professional chess — tournament tracking, live boards, and the app that carries them.",
    entries: ["chessever"],
  },
  {
    id: "hex",
    name: "HEX",
    role: "Design Partner",
    period: "Mar 2025 — Apr 2026",
    sort: "2026-04",
    href: "https://hex.inc",
    logo: "/companies/hex.png",
    blurb: "Design partner on contract.",
    entries: [],
  },
  {
    id: "independent",
    name: "Independent",
    period: "2025",
    sort: "2025-12",
    blurb: "Identity and site work taken on directly.",
    entries: ["sylvan"],
  },
  {
    id: "side-projects",
    name: "Side projects",
    period: "Ongoing",
    sort: "",
    blurb: "Built to find out whether they could be.",
    entries: ["hitmans-library"],
  },
];
