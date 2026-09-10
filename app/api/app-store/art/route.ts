import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for App Store artwork — icons and screenshots.
 *
 * Written against `app/api/now-playing/art/route.ts`, which does the same job
 * for Spotify's covers, and it is deliberately the same shape rather than a
 * shared abstraction: two allowlists in two files are two things a reader can
 * check, where one parameterised proxy is a single place to get an allowlist
 * wrong for both.
 *
 * The reason for a proxy here is not the canvas — nothing reads these pixels
 * back. It is `next/image`. The site allowlists no external host to the
 * optimiser at all, and the alternative to this route is adding Apple's CDN to
 * `images.remotePatterns`, which would grant every component on the site,
 * forever, permission to load anything from `mzstatic.com`. A route is the
 * narrower door: one caller, one host, one content type.
 *
 * The host allowlist is what stops this being an open proxy. Without one, any
 * caller could point `u` at an internal address — a metadata endpoint, a
 * service on the private network — and read the response back through this
 * origin. That is an SSRF, and this repo already knows it.
 */
const ALLOWED = /^([a-z0-9-]+\.)?mzstatic\.com$/;

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("u");
  if (!target) return new NextResponse(null, { status: 400 });

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (url.protocol !== "https:" || !ALLOWED.test(url.hostname)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: 502 });

    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return new NextResponse(null, { status: 502 });

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": type,
        /* Longer than the cover proxy's five minutes, because these two are not
           the same kind of thing. A cover changes when the track does. An
           mzstatic path carries a content hash and a resize instruction, so the
           bytes behind one URL never change at all — a new icon is a new path.
           A week is long enough to matter and short enough that a delisted app
           does not haunt a CDN forever. */
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
