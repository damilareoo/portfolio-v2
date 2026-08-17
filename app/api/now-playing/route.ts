import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

const NO_CACHE = { "Cache-Control": "no-store" };
const SILENT = { isPlaying: false } as const;

async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/**
 * Carried over from portfolio-v1. Nothing playing is a normal answer, not an
 * error — the rail simply says so.
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json(SILENT, { headers: NO_CACHE });

    const res = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 204 || res.status >= 400) {
      return NextResponse.json(SILENT, { headers: NO_CACHE });
    }

    const data = (await res.json()) as {
      is_playing?: boolean;
      progress_ms?: number;
      item?: {
        name: string;
        duration_ms?: number;
        artists: { name: string }[];
        album?: { images?: { url: string; width: number }[] };
        external_urls: { spotify: string };
      };
    };
    if (!data.item) return NextResponse.json(SILENT, { headers: NO_CACHE });

    // The disc dithers the artwork down to a dot grid, so the smallest image
    // Spotify offers is already more resolution than it can use.
    const art = [...(data.item.album?.images ?? [])].sort((a, b) => a.width - b.width)[0];

    return NextResponse.json(
      {
        isPlaying: Boolean(data.is_playing),
        title: data.item.name,
        artist: data.item.artists.map((a) => a.name).join(", "),
        songUrl: data.item.external_urls.spotify,
        progressMs: data.progress_ms ?? 0,
        durationMs: data.item.duration_ms ?? 0,
        // Proxied rather than linked: the canvas reads pixels back, and a
        // cross-origin image would taint it and make getImageData throw.
        artUrl: art ? `/api/now-playing/art?u=${encodeURIComponent(art.url)}` : undefined,
      },
      { headers: NO_CACHE },
    );
  } catch {
    return NextResponse.json(SILENT, { headers: NO_CACHE });
  }
}
