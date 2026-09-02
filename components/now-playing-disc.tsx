"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { CARD_FACE, InstrumentCard } from "@/components/instrument-card";
import { artFrame, spotifyMark } from "@/lib/glyph/glyphs";
import { TUNING } from "@/lib/glyph/matrix";
import { fingerprint, pulsesBetween } from "@/lib/glyph/pulse";

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
const GRID = 48; // dots across
/* The arc is sized as a share of the disc rather than in pixels. Pinned at a
   fixed width it stayed put while the disc grew, and a ring that was clearing
   the dots by a hairline ended up drawn straight through them — a stray line
   across the artwork with no meaning attached to it. */
const ARC_SCALE = 1.09; // just clear of the dots, at any size the disc is set to

/* How wide the disc is drawn inside the card's face. The arc is a share of the
   disc and hangs outside it, and the card's face clips at its own edge — a disc
   drawn at the full measure would have its progress arc sliced off at four
   points. So the disc gives back what the arc needs, and the pair of them
   together is what fills the face. */
const DISC = Math.floor(CARD_FACE / ARC_SCALE) - 4;

/* How much harder a playhead pulse strikes than a fingertip.
   The engine's damping is close to critical, so a ring at force 1 displaces the
   field by about a fifth of a canvas unit — under a tenth of a pixel at the size
   the disc is drawn, which is to say nothing at all. The multiplier lives here
   rather than in `TUNING` because it is this caller's editorial decision about
   its own ring, not a change to the physics every field shares. */
/* Three rings to the pulse. The ripple's life is longer than this, which is
   the whole trick: the field always has more than one crossing it. */
const RINGS_PER_PULSE = 3;
const RING_PERIOD_MS = TUNING.PULSE_PERIOD_MS / RINGS_PER_PULSE;

const PULSE_FORCE = 24;

/* The arc is drawn in a 100-unit box scaled to ARC_PX, so its radius is in
   hundredths and its length is what a full track is worth in dash. */
const ARC_RADIUS = 47;
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS;

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
 *
 * Two things move while a track plays, and both are readouts rather than
 * decoration: an arc that says how far through it is, and a ring every two
 * seconds of playback. The ring is a playhead pulse — it counts periods of the
 * position Spotify reports and nothing else. It is not on the beat, and cannot
 * be: `audio-features` and `audio-analysis` answer 403 for this application,
 * so there is no tempo here to be on. When the music stops, so does all of it.
 *
 * It renders its own `InstrumentCard`, because the shell is what makes four
 * readings a bank rather than four widgets — a disc that sized itself was half
 * the defect this replaces.
 */
export function NowPlayingDisc({ className = "" }: { className?: string }) {
  const markRef = useRef<Float32Array | null>(null);
  const [frame, setFrame] = useState<Float32Array | null>(null);
  const [track, setTrack] = useState<NowPlaying | null>(null);

  const trackRef = useRef<NowPlaying | null>(null);
  /* When the reading in `trackRef` was taken, so the playhead can be carried
     forward from it between polls. */
  const readAtRef = useRef(0);
  const positionRef = useRef<number | null>(null);
  const printRef = useRef(fingerprint(new Float32Array(GRID * GRID)));
  const arcRef = useRef<SVGCircleElement | null>(null);

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

  /** The arc, written straight to the DOM: it is a value, not a transition. */
  const paintArc = useCallback((progressMs: number | null) => {
    const arc = arcRef.current;
    if (!arc) return;
    const duration = trackRef.current?.durationMs ?? 0;
    const done = progressMs === null || duration <= 0 ? 0 : Math.min(1, progressMs / duration);
    arc.style.strokeDashoffset = String(ARC_LENGTH * (1 - done));
  }, []);

  /* A poll is a fresh reading of the playhead, and the pulse counts from it
     rather than from its own estimate — so a correction, in either direction,
     re-baselines instead of firing a burst of rings to catch up. */
  useEffect(() => {
    trackRef.current = track;
    readAtRef.current = performance.now();
    positionRef.current = null;
    paintArc(track?.isPlaying ? (track.progressMs ?? 0) : null);
  }, [track, paintArc]);

  /* Artwork -> luminance per cell. Same-origin via the proxy, so reading the
     pixels back does not throw on a tainted canvas. */
  useEffect(() => {
    const art = track?.isPlaying ? track.artUrl : undefined;

    /* Whatever the field is handed, the pulse needs to know where its light
       gathers — the one thing that differs between one cover and the next. */
    const show = (values: Float32Array) => {
      printRef.current = fingerprint(values);
      setFrame(values);
    };

    const toMark = () => {
      markRef.current ??= spotifyMark(GRID);
      show(markRef.current);
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

      /* The cover arrives several times the grid's size, so every cell is an
         average of the pixels under it rather than whichever one it landed on.
         Point sampling a 300 px sleeve down to 48 cells is how a picture turns
         into noise. */
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(img, 0, 0, GRID, GRID);
      try {
        show(artFrame(octx.getImageData(0, 0, GRID, GRID).data, GRID));
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

  /**
   * The playhead pulse.
   *
   * Read once a frame while a track is playing, and null the moment it is not
   * — which is what lets the loop stop and the page go still. The identity of
   * this callback changes with `playing`, and that is load-bearing: it is the
   * only thing that can wake a loop that stopped because there was nothing
   * left to report.
   */
  const onTick = useCallback(
    (now: number) => {
      if (!playing) return null;
      const current = trackRef.current;
      if (!current) return null;

      const duration = current.durationMs ?? 0;
      const carried = (current.progressMs ?? 0) + (now - readAtRef.current);
      const at = duration > 0 ? Math.min(carried, duration) : carried;

      paintArc(at);

      const previous = positionRef.current;
      positionRef.current = at;
      // A first reading is a baseline, not a pulse.
      if (previous === null) return {};
      if (pulsesBetween(previous, at, RING_PERIOD_MS) === 0) return {};

      /* Rings, not a ring. A ripple outlives the sub-period that struck it, so
         two or three are crossing the field at any moment and the disc reads
         as concentric rings travelling outward — a visualiser's shape, with a
         visualiser's cadence, and none of its claim: this is still arithmetic
         on the playhead, and it would do the same on silence.

         They are struck at the middle rather than at the cover's brightest
         point, because rings from a moving origin are not concentric. */
      const beat = Math.floor(at / RING_PERIOD_MS) % RINGS_PER_PULSE === 0;
      const { density } = printRef.current;
      return {
        ripples: [
          {
            x: SIZE / 2,
            y: SIZE / 2,
            /* The downbeat carries; the ones between it are echoes. A bright
               cover pushes harder than a dark one, and the floor keeps a
               near-black sleeve from pulsing not at all. */
            strength:
              PULSE_FORCE * (beat ? 1 : 0.42) * (0.6 + 0.8 * density),
          },
        ],
      };
    },
    [playing, paintArc],
  );

  const label = playing
    ? `Now playing: ${track!.title} by ${track!.artist}. Click the disc to ripple it.`
    : "Nothing playing. Click the disc to ripple it.";

  return (
    /* The disc wears the same card as every other reading. What went with the
       old column: the hover-revealed record line under it, and the link to the
       track on Spotify. The card's label row carries the title instead — and a
       link would have fought the disc for the same click, which already means
       "ripple it". */
    <InstrumentCard label="Playing" reading={playing ? track!.title : undefined}>
      <div className="relative" style={{ width: DISC }}>
        <GlyphCell
          grid={GRID}
          size={SIZE}
          shape="circle"
          frame={frame}
          onTick={onTick}
          label={label}
          className={`w-full cursor-pointer text-ink ${className}`}
        />

        {/* How far through the track, as a hairline outside the dots. Nothing
            about it is animated: it is redrawn at the value it now has. */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden
          style={{ width: `${ARC_SCALE * 100}%`, height: `${ARC_SCALE * 100}%` }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink-3"
        >
          <circle
            ref={arcRef}
            cx="50"
            cy="50"
            r={ARC_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
    </InstrumentCard>
  );
}
