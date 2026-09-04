"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { InstrumentReading } from "@/components/instrument-card";
import { artFrame, spotifyMark } from "@/lib/glyph/glyphs";
import { fieldReach, TUNING } from "@/lib/glyph/matrix";
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

/* Exported so a test can ask the field how far its ink reaches rather than
   restating the answer — which is the shape of the defect this file was
   carrying, two expressions of one fact free to disagree. */
export const SIZE = 300; // canvas units; CSS scales it
export const GRID = 48; // dots across

/* Where the ring goes, in one expression, and everything else derived from it.

   This was two constants: an `ARC_SCALE` said to hold the ring "just clear of
   the dots, at any size", and a `DISC` width computed separately by different
   arithmetic from the same intent. Two independent statements of one fact can
   disagree, and these did — the ring cleared the resting lattice by about two
   percent of the disc's radius, which is under a pixel at the size a phone
   draws it, and was drawn straight through the artwork the moment a pulse
   crossed the field. The comment above `ARC_SCALE` described that exact
   failure as already fixed, which is the worst state a comment can be in.

   `fieldReach` is the field answering for itself: it is where the outermost
   ink can land, as a share of the disc's radius, derived from the lattice's
   own cull and the pixel's own width rather than guessed at here. Change the
   pixel fill or the grid and the ring moves with it.

   `CLEARANCE` is the only free choice left, and it is a gap rather than a
   hairline on purpose. It has to cover a field in motion, not only a field at
   rest: the playhead pulse displaces the outer cells outward by something over
   four percent of the radius at full strength, and a ring that cleared only
   the still lattice would be crossed twice a second by the thing standing
   beside it. A finger laid on the disc pushes harder still and will reach the
   ring — that is the visitor moving the field with their own hand, and the
   ring giving way to it is honest; a ring crossed by a picture holding still
   is not. */
const CLEARANCE = 0.07; // of the disc's radius
const RING = fieldReach(GRID, SIZE) + CLEARANCE;

/* The arc is drawn in its own 100-unit box, and `ARC_RADIUS` is where the ring
   sits inside that box — short of the edge by enough to hold the stroke and
   its cap. The box is then scaled until the ring lands at `RING`, and the disc
   is drawn at whatever is left, so the two together are exactly the face. One
   number moves both, and neither can be changed without the other. */
const ARC_RADIUS = 47;
const ARC_SCALE = (RING * 50) / ARC_RADIUS;
const DISC = `${100 / ARC_SCALE}%`;

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

/* What a full track is worth in dash — the ring's whole circumference, in the
   arc box's own units. */
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS;

/* How thick the ring is drawn, and — because the cap is round — the shortest
   arc that is worth drawing at all.

   Measured in a headless Chrome: at a dash of exactly zero the browser draws
   nothing, but a dash of three hundredths of a unit comes back as a full round
   dot the width of the stroke, sitting at twelve o'clock. So the first half
   second of a four-minute track, and any track Spotify reports at a position
   of zero while playing, put a mark on the instrument that is entirely cap and
   says nothing but "there is a dot here". Below one stroke's worth of arc
   there is no arc, only its ends. */
const ARC_STROKE = 0.6;

/**
 * The shortest arc worth drawing, in the arc box's own units.
 *
 * One stroke's worth was the last guess and it was still a mark with no reading
 * behind it. A round cap is half a stroke long at each end, so a dash of
 * exactly one stroke is *entirely* cap: two half-circles back to back, which
 * Chrome draws as a stadium sitting at twelve o'clock. It stays a stadium for a
 * while after that — the arc only starts to look like an arc once its straight
 * middle is longer than its ends — and on a four-minute track that "while" ran
 * to about two and a half seconds of every play.
 *
 * Four strokes is where the ends are a quarter of the mark and the rest is
 * line. Below it the instrument says nothing, which is the correct thing for it
 * to say about a track that has barely started: two seconds into four minutes
 * is not a reading, it is a rounding error with a cap on each end. */
const ARC_MINIMUM = ARC_STROKE * 4;

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
 * It renders its own `InstrumentReading`, because the shell is what makes four
 * readings a wall rather than four widgets — a disc that sized itself was half
 * the defect this replaces. It sizes itself off nothing now: `SIZE` is the
 * canvas's own coordinate space and CSS decides how large that space is drawn.
 */
export function NowPlayingDisc({ className = "" }: { className?: string }) {
  const markRef = useRef<Float32Array | null>(null);
  const [frame, setFrame] = useState<Float32Array | null>(null);
  /* How the field's values are to be read, which is a property of what is in
     it and not of this component — so it travels with the frame rather than
     being fixed once at the call site. Artwork is a photograph: its values say
     how bright the sleeve is, so they have to flip with the ground. The
     Spotify mark is a figure: its values say where the mark is, and a mark is
     a mark on either skin. Read as a luminance it inverted on the light skin
     and the disc became a solid field of ink with the logo punched out of it.

     It opens on "ink" because the mark is the first thing the disc ever
     holds. */
  const [polarity, setPolarity] = useState<"luminance" | "ink">("ink");
  const [track, setTrack] = useState<NowPlaying | null>(null);

  const trackRef = useRef<NowPlaying | null>(null);
  /* When the reading in `trackRef` was taken, so the playhead can be carried
     forward from it between polls. */
  const readAtRef = useRef(0);
  const positionRef = useRef<number | null>(null);
  const printRef = useRef(fingerprint(new Float32Array(GRID * GRID)));
  const arcRef = useRef<SVGCircleElement | null>(null);

  /* Poll on the same cadence as the counters. Nothing playing is a normal
     answer, not an error — the cells simply return to the mark.

     The reading is checked twice before it is believed, the way the pedometer
     checks its own: the response has to have succeeded, and the body has to
     carry the one field that makes it a reading. `isPlaying` is that field.
     The route says `{ configured: false }` when it could not hear Spotify at
     all, and a route that failed some other way says whatever a failure says —
     neither has an `isPlaying`, and a missing `isPlaying` is falsy, so an
     unchecked body would have printed "Silent" for both. That is the same lie
     told from the client end. */
  useEffect(() => {
    let cancelled = false;

    const read = () =>
      fetch("/api/now-playing")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: unknown) => {
          if (cancelled) return;
          const ok =
            Boolean(data) &&
            typeof data === "object" &&
            typeof (data as NowPlaying).isPlaying === "boolean";
          setTrack(ok ? (data as NowPlaying) : null);
        })
        .catch(() => {
          /* Null, not `{ isPlaying: false }`. A refused or throttled request
             means we do not know what is playing — which is a different thing
             from knowing that nothing is, and the card prints a different
             answer for each. */
          if (!cancelled) setTrack(null);
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
    /* Drawn only once there is more arc than its own ends — see `ARC_MINIMUM`.
       Nothing to report, and nothing that is only a pair of round caps, is not
       drawn. */
    arc.style.opacity = done * ARC_LENGTH >= ARC_MINIMUM ? "1" : "0";
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
       gathers — the one thing that differs between one cover and the next.

       These two setters land in one batched commit, and GlyphCell flushes its
       frame effect before its polarity effect — so the frame is drawn once
       against the *previous* polarity before the second effect redraws it
       correctly. Harmless today, and only because both of those draws are
       synchronous inside the same commit: the browser never gets a paint
       between them. It stops being harmless the moment either one is deferred,
       and the failure would be a single inverted frame of the disc — a black
       circle with the sleeve punched out of it, which is the exact defect the
       polarity distinction exists to prevent. If a frame ever has to be
       scheduled rather than drawn, the polarity has to travel with it rather
       than arrive in its own effect. */
    const show = (values: Float32Array, reading: "luminance" | "ink") => {
      printRef.current = fingerprint(values);
      setFrame(values);
      setPolarity(reading);
    };

    const toMark = () => {
      markRef.current ??= spotifyMark(GRID);
      show(markRef.current, "ink");
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
        show(artFrame(octx.getImageData(0, 0, GRID, GRID).data, GRID), "luminance");
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

  /**
   * What the reading prints beneath the disc, and the three things it can mean.
   *
   * The em dash means "this instrument cannot read", per the reading's own
   * docblock — so it belongs to the case where Spotify has not answered, or
   * answered with a failure, and to the odd case where it says something is
   * playing but will not name it. It does *not* belong to silence: nothing
   * playing is a perfectly good reading, and printing ignorance where the
   * instrument in fact read fine is the same lie the Lagos reading was telling
   * with a ticking clock beside a dash.
   */
  const value = track === null
    ? undefined
    : playing
      ? track.title
      : track.isPlaying
        ? undefined
        : "Silent";

  /* What the disc is, said in words — and nothing about pressing it. The
     sentence used to end "Click the disc to ripple it", which was an
     instruction this element cannot honour: the disc has one face, so it is
     given no `onPress`, so `InstrumentReading` draws it as a `div` rather than
     a button. Telling a keyboard or a screen reader to click a thing that is
     not a control is the lie `instrument-card.tsx` is written to make
     impossible. The pointer ripple is still there — every `GlyphCell` answers
     a finger crossing it — but that is ambient response to a pointer, not a
     control, and it is not a thing to promise to a reader who has no pointer. */
  const label = playing
    ? `Now playing: ${track!.title} by ${track!.artist}`
    : "Nothing playing";

  return (
    /* The disc wears the same shell as every other reading, and wears it as a
       picture: no `onPress`, because there is no second face to turn to and a
       press with nothing behind it is the dead button this shell refuses to
       let anyone build. The steps reading is a button because a press there
       turns a page; here it would only re-do what the pointer already does.

       What went with the old column: the hover-revealed record line under it,
       and the link to the track on Spotify. The value beneath the disc carries
       the title instead. */
    <InstrumentReading srLabel="Music" value={value}>
      <div className="relative" style={{ width: DISC }}>
        <GlyphCell
          grid={GRID}
          size={SIZE}
          shape="circle"
          frame={frame}
          polarity={polarity}
          onTick={onTick}
          label={label}
          /* No `cursor-pointer`: a pointer cursor over something that is not
             a control is the same lie the label used to tell, told in ink. */
          className={`w-full text-ink ${className}`}
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
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH}
            /* Hidden until something says otherwise, for the same reason
               `paintArc` hides it: the first paint happens before any reading
               has arrived, and an empty arc still leaves its cap behind. */
            opacity={0}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
    </InstrumentReading>
  );
}
