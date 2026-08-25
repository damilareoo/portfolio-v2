"use client";

import { useEffect, useState } from "react";
import { useDialTurns } from "@/lib/dial-turns";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

/**
 * A counter that has never been read is not a counter at zero — it shows
 * placeholder digits at --text-3, the same rule the skeletons follow.
 */
function Digits({ value, roll }: { value: number | null; roll: boolean }) {
  if (value === null) {
    return <span className="font-mono text-[1.25rem] text-ink-3">––––</span>;
  }
  return (
    <span
      key={value}
      className={`font-mono text-[1.25rem] tabular-nums ${roll ? "animate-[digit-roll_180ms_ease-out]" : ""}`}
    >
      {value.toLocaleString("en-US")}
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

export function Counters({ version, commit }: { version: string; commit?: string }) {
  const { total, mine, live, justMoved } = useDialTurns();

  return (
    <div className="space-y-4">
      <div className="rule-t pt-3">
        <Label>Dials turned</Label>
        <div className="mt-1.5 flex items-baseline gap-2">
          <Digits value={live ? total : mine} roll={justMoved} />
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            {live ? "by everyone" : "by you"}
          </span>
        </div>
        {live && (
          <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            {mine.toLocaleString("en-US")} by you
          </p>
        )}
      </div>

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
