import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /feed shipped in v1.0.0 and is linked from outside, so it moves rather than
     disappears — a live URL is a promise, and renaming a surface is not a reason
     to break one. The case pages are the same promise: they retired into the
     home, so their URLs land on the product that holds them.

     Written out rather than patterned. Flat products make slug and anchor
     identical, so `/work/:slug -> /#:slug` would now resolve correctly — and is
     still refused, because it would also send every slug that never existed to
     the top of the home page. A URL that was never real should 404, and three
     explicit lines say which three were. */
  async redirects() {
    return [
      { source: "/feed", destination: "/shots", permanent: true },
      { source: "/work/chessever", destination: "/#chessever", permanent: true },
      { source: "/work/sylvan", destination: "/#sylvan", permanent: true },
      { source: "/work/hitmans-library", destination: "/#hitmans-library", permanent: true },
    ];
  },
};

export default nextConfig;
