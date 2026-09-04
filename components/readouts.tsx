"use client";

import { useEffect, useState } from "react";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  songUrl?: string;
};

function NowPlayingRow() {
  const [track, setTrack] = useState<NowPlaying | null>(null);

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
    // Text swaps in place when the track changes. It never animates: this is
    // the one number on the page the visitor did not cause.
    const id = setInterval(read, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rule-t pt-3">
      <Label>Now playing</Label>
      {track?.isPlaying && track.title ? (
        <a
          href={track.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block text-[0.75rem] leading-snug text-ink-2 transition-colors hover:text-ink"
        >
          <span className="block truncate font-medium text-ink">{track.title}</span>
          <span className="block truncate">{track.artist}</span>
        </a>
      ) : (
        <p className="mt-1.5 text-[0.75rem] text-ink-3">
          {track === null ? "—" : "Nothing playing"}
        </p>
      )}
    </div>
  );
}

/**
 * What the site can say about itself right now: what is playing, and what it
 * is built from.
 *
 * It was `Counters` and it counted dial turns, which is the row that went when
 * the type dial did. Neither of the two left is a counter — one is a live
 * reading and the other is a fact about the build — so the name went with the
 * row that earned it.
 */
export function Readouts({ version, commit }: { version: string; commit?: string }) {
  return (
    <div className="space-y-4">
      <NowPlayingRow />

      <div className="rule-t pt-3">
        <Label>Build</Label>
        <p className="mt-1.5 font-mono text-[0.6875rem] text-ink-2">
          v{version}
          {commit && <span className="text-ink-3"> · {commit.slice(0, 7)}</span>}
        </p>
      </div>
    </div>
  );
}
