import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /feed shipped in v1.0.0 and is linked from outside, so it moves rather than
     disappears — a live URL is a promise, and renaming a surface is not a reason
     to break one. The case pages are the same promise: they retired into the
     home, so their URLs land on the era that holds them.

     Written out rather than patterned. `/work/:slug -> /#:slug` would be wrong:
     only ChessEver has an era of its own name. A missing line here is a 404,
     which is the correct failure — better than a pattern that silently sends
     every unknown slug to the top of the home. */
  async redirects() {
    return [
      { source: "/feed", destination: "/shots", permanent: true },
      { source: "/work/chessever", destination: "/#chessever", permanent: true },
      { source: "/work/sylvan", destination: "/#independent", permanent: true },
      { source: "/work/hitmans-library", destination: "/#side-projects", permanent: true },
    ];
  },
};

export default nextConfig;
