/**
 * Roles, as recorded on LinkedIn. Newest first.
 *
 * `logo` is the company's own OG image where it publishes one, so the box
 * carries the company's mark rather than something invented here. ChessEver
 * serves no metadata at all, so its own product art stands in.
 */
export type Role = {
  role: string;
  company: string;
  /** The company's site — the row links out to it, not to LinkedIn. */
  url: string;
  period: string;
  location: string;
  /** Contract, full-time, and so on, as LinkedIn records it. */
  engagement?: string;
  logo?: string;
};

export const roles: Role[] = [
  {
    role: "Product Designer",
    company: "Endgame AI",
    url: "https://endgame.ai",
    period: "Apr 2026 — Aug 2026",
    location: "New York City Metropolitan Area · Remote",
    engagement: "Contract",
    logo: "/companies/endgame.png",
  },
  {
    role: "Product Designer",
    company: "ChessEver",
    url: "https://chessever.com",
    period: "Apr 2025 — Apr 2026",
    location: "United States · Remote",
    engagement: "Contract",
    logo: "/work/chessever/01-featured.jpg",
  },
  {
    role: "Design Partner",
    company: "HEX",
    url: "https://hex.inc",
    period: "Mar 2025 — Apr 2026",
    location: "San Francisco, California · Remote",
    engagement: "Contract",
    logo: "/companies/hex.png",
  },
  // TODO — awaiting the dates from LinkedIn before either of these can ship.
  // Nothing here is guessed, so they stay out of the record until confirmed:
  //
  // {
  //   role: "Open Source Design Contributor",
  //   company: "SmallChess",
  //   url: "",
  //   period: "",
  //   location: "",
  //   logo: "/companies/smallchess.png",
  // },
  // {
  //   role: "Early Career Designer",
  //   company: "",
  //   url: "",
  //   period: "",
  //   location: "",
  // },
];
