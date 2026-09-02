import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

const NO_CACHE = { "Cache-Control": "no-store" };

/**
 * The two answers that are not a track, and the whole difference between them.
 *
 * `CANNOT_READ` is a payload with no reading in it. The word is the one the
 * steps route already says for the same thing — `{ configured: false }` — and
 * it is borrowed rather than reworded so the two instruments admit ignorance
 * in one vocabulary rather than two. It covers every way this route can fail
 * to hear Spotify: credentials that are not set, a refresh token Spotify has
 * stopped honouring, a 429, a 5xx, a body that will not parse.
 *
 * `SILENT` is a reading, and the only one of the pair that is: Spotify
 * answered, and what it said was that nothing is playing.
 *
 * Collapsing the two is the defect this pair exists to make impossible. Every
 * failure used to leave here as `{ isPlaying: false }`, so an expired refresh
 * token printed a confident "Silent" in every visitor's footer — an instrument
 * that could not read at all, reported as one that read and found nothing.
 */
const CANNOT_READ = { configured: false } as const;
const SILENT = { isPlaying: false } as const;

/** Null for both ways this can go wrong — no credentials to send, and
    credentials Spotify refused. Neither is a reading, and the caller does the
    same thing with either. */
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
 * Carried over from portfolio-v1, and since taught the difference between
 * hearing silence and not hearing. Nothing playing is a normal answer and
 * leaves here as one; everything else leaves as `CANNOT_READ`.
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json(CANNOT_READ, { headers: NO_CACHE });

    const res = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    // 204 is how Spotify says the player is idle. That is a reading.
    if (res.status === 204) return NextResponse.json(SILENT, { headers: NO_CACHE });
    if (!res.ok) return NextResponse.json(CANNOT_READ, { headers: NO_CACHE });

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

    /* A 200 carrying no `item` is two different situations wearing one shape: a
       paused player, which is silence and reads perfectly well, and an advert
       or a local file Spotify will not name, which is something playing that
       cannot be reported. `is_playing` is the only thing that separates them,
       so it is passed through rather than flattened to false — the disc
       already prints the dash for a track it is told about but not given. */
    if (!data.item) {
      return NextResponse.json({ isPlaying: Boolean(data.is_playing) }, { headers: NO_CACHE });
    }

    /* The disc's grid is 48 cells across and each cell is a box average of the
       pixels under it, so the artwork wants roughly 4 source pixels per cell in
       each direction to average over — under that, a cell is one or two pixels
       and the cover arrives as noise rather than as a picture. Spotify's rungs
       are 640, 300 and 64: the smallest that clears the bar is 300, and taking
       the smallest that clears it rather than the largest keeps the proxy
       cheap. */
    const images = [...(data.item.album?.images ?? [])].sort((a, b) => a.width - b.width);
    const art = images.find((image) => image.width >= 4 * 48) ?? images.at(-1);

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
    return NextResponse.json(CANNOT_READ, { headers: NO_CACHE });
  }
}
