"use client";

import { useEffect, useRef, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { artFrame, spotifyMark } from "@/lib/glyph/glyphs";

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  songUrl?: string;
  artUrl?: string;
  progressMs?: number;
  durationMs?: number;
};

const SIZE = 300; // canvas units; CSS scales it
const GRID = 32; // dots across

function clock(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Now-playing as an ordered-dither disc.
 *
 * Silent, the cells hold the Spotify mark. When a track starts they migrate
 * into the dithered album artwork and back again when it stops, so the disc
 * always says what it is even when there is nothing to show.
 *
 * Dithering is what lets real artwork onto a site with no accent hue: the
 * colour is not suppressed, it is discarded, and what is left is the one thing
 * the palette trades in — value.
 */
export function NowPlayingDisc({ className = "" }: { className?: string }) {
  const markRef = useRef<Float32Array | null>(null);
  const [frame, setFrame] = useState<Float32Array | null>(null);
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [open, setOpen] = useState(false);

  /* Poll on the same cadence as the counters. Nothing playing is a normal
     answer, not an error — the cells simply return to the mark. */
  useEffect(() => {
    let cancelled = false;

    const read = () =>
      fetch("/api/now-playing")
        .then((r) => r.json())
        .then((d: NowPlaying) => {
          if (!cancelled) setTrack(d);
        })
        .catch(() => {
          if (!cancelled) setTrack({ isPlaying: false });
        });

    read();
    const id = setInterval(read, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* Artwork -> luminance per cell. Same-origin via the proxy, so reading the
     pixels back does not throw on a tainted canvas. */
  useEffect(() => {
    const art = track?.isPlaying ? track.artUrl : undefined;

    const toMark = () => {
      markRef.current ??= spotifyMark(GRID);
      setFrame(markRef.current);
    };

    if (!art) {
      toMark();
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = GRID;
      off.height = GRID;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      octx.drawImage(img, 0, 0, GRID, GRID);
      try {
        setFrame(artFrame(octx.getImageData(0, 0, GRID, GRID).data, GRID));
      } catch {
        return; // tainted despite the proxy — hold the mark
      }
    };

    img.onerror = toMark;
    img.src = art;
    return () => {
      cancelled = true;
    };
  }, [track?.artUrl, track?.isPlaying]);

  const playing = Boolean(track?.isPlaying && track.title);
  const label = playing
    ? `Now playing: ${track!.title} by ${track!.artist}. Click the disc to ripple it.`
    : "Nothing playing. Click the disc to ripple it.";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* The record answers to the disc alone, so the reveal is wired here and
          not on the column — the block below must not reveal itself. */}
      <div onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
        <GlyphCell
          grid={GRID}
          size={SIZE}
          shape="circle"
          frame={frame}
          label={label}
          className="w-[128px] cursor-pointer text-ink"
        />
      </div>

      {/* The record. Present in the layout at all times so revealing it never
          shifts anything around it. */}
      {/* Wider than the 128px disc on purpose — the track line has to fit
          without crushing, and the block is always present so revealing it
          never shifts the layout. */}
      <div className="h-9 w-[15rem] max-w-full text-center">
        <div
          className={`transition-opacity duration-200 ${open || playing ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">
            {playing ? "Now playing" : "Spotify"}
          </p>
          {playing ? (
            <a
              href={track!.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
            >
              <span className="text-ink">{track!.title}</span>
              <span className="text-ink-3"> — </span>
              {track!.artist}
              {Boolean(track!.durationMs) && (
                <span className="text-ink-3">
                  {" "}
                  {clock(track!.progressMs ?? 0)}/{clock(track!.durationMs ?? 0)}
                </span>
              )}
            </a>
          ) : (
            <p className="mt-0.5 text-[0.6875rem] text-ink-3">
              {track === null ? "—" : "Nothing playing"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
