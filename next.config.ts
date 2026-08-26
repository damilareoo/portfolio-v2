import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /feed shipped in v1.0.0 and is linked from outside, so it moves rather than
     disappears — a live URL is a promise, and renaming a surface is not a reason
     to break one. */
  async redirects() {
    return [{ source: "/feed", destination: "/shots", permanent: true }];
  },
};

export default nextConfig;
