import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for album artwork.
 *
 * The disc reads the artwork back out of a canvas to build its dot grid, and a
 * cross-origin image taints the canvas so getImageData throws. Serving the
 * bytes from our own origin is the only reliable way around that.
 *
 * The host allowlist is what stops this being an open proxy: without it any
 * caller could point `u` at an internal address and read the response.
 */
const ALLOWED = /^([a-z0-9-]+\.)?(scdn\.co|spotifycdn\.com)$/;

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
        // The artwork is immutable for as long as the track is playing; the
        // now-playing route is what decides when it changes.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
