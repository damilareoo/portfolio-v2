"use client";

import { Frame } from "@/components/frame";
import { GlyphText } from "@/components/glyph-text";
import { PanelField } from "@/components/panel-field";
import { centreMidtone } from "@/lib/glyph/tone";

/** The file, as it is on disk. Every number below is derived from these three. */
const FILE = { src: "/about/portrait.png", width: 621, height: 1104 };

/**
 * The slot the picture is cropped into, and where the crop is taken from.
 *
 * 3:4 rather than the file's own 9:16, and this is the one number here chosen
 * by the layout rather than by the file.
 *
 * It was 4:5, picked so the picture and the label-value rows ended together
 * when the sheet carried eight fields, a header band above them and four
 * sections below. Those are gone: the record is the fields and the roles now,
 * and the instruction that removed the rest also said to make the picture
 * bigger. A taller crop is how a fixed column gets bigger without taking width
 * from the page — it keeps more of the file rather than more of the screen, so
 * the head sits larger in the frame at the same column width. 3:4 is as far as
 * that goes before the crop starts eating into the empty ground under him that
 * the file's lower third is mostly made of.
 *
 * `POSITION` is a CSS `object-position` fraction: 0 takes the band off the top
 * of the file, 1 off the bottom. 0.3 puts his head at roughly a quarter to
 * three-fifths of the frame — cap to chest, the part of a portrait a reader
 * came for — where the middle would have taken the top of the cap off.
 */
const RATIO: [number, number] = [3, 4];
const POSITION = 0.3;

/** The band the crop actually shows, in the file's own pixel rows. */
const BAND = (FILE.width * RATIO[1]) / RATIO[0];
const TOP = (FILE.height - BAND) * POSITION;
const BOTTOM = TOP + BAND;

/**
 * The board he is standing in front of, and what its lines mean.
 *
 * The reference's portrait is a height board: horizontal graduations run across
 * the photograph edge to edge, the subject stands in front of them, and the
 * numerals sit outside the picture on both sides, level with each line,
 * decreasing as they go down. That is the device, and it is a measurement, so
 * the numbers have to mean something. A scale of centimetres would not: nobody
 * measured him, and inventing a height on the one page claiming to be a record
 * is the single thing that would turn this from design into costume.
 *
 * So the board measures the photograph. Each line is a row of the file, and
 * each numeral is **how many rows above the foot of the file that line sits** —
 * which is what makes the sequence decrease downward, exactly as a height chart
 * does, without any of it being made up. `file public/about/portrait.png` says
 * 621 x 1104; every numeral below is that height minus a row, and the caption
 * prints the two figures a reader would need to check it.
 *
 * A graduation every 60 rows lands thirteen lines inside the crop — 240 at the
 * foot to 960 at the head — which is the reference's count, evenly spaced, and
 * every one of them a round multiple. It is derived rather than chosen: change
 * the crop and the board re-graduates itself.
 */
const STEP = 60;

/** Rows above the foot of the file, tallest first, for every line in the crop. */
const MARKS: number[] = [];
for (
  let above = Math.floor((FILE.height - TOP) / STEP) * STEP;
  above >= FILE.height - BOTTOM;
  above -= STEP
) {
  MARKS.push(above);
}

/** Where a mark lands inside the frame, as a percentage of its height. */
const at = (above: number) => ((FILE.height - above - TOP) / BAND) * 100;

/**
 * The numerals for one edge of the board.
 *
 * Outside the picture on both sides in the reference, level with the line they
 * name and carrying no tick of their own — the line crossing the photograph is
 * the tick. Set in `GlyphText`, the 3x5 matrix alphabet the pedometer and the
 * case numbers use, so the scale is drawn in the site's own hand rather than in
 * the mono standing in for it.
 *
 * Below `sm` the right-hand column keeps its width but loses its numerals: two
 * columns of figures saying the same thing were taking a quarter of a 320px
 * measure. The lines still run the full width of the picture, so the board is
 * still a board; only the second reading goes.
 */
function Scale({ side }: { side: "left" | "right" }) {
  const left = side === "left";
  return (
    <div className="relative" aria-hidden>
      {MARKS.map((above) => (
        <span
          key={above}
          className={`absolute block ${left ? "right-1.5" : "left-1.5 hidden sm:block"}`}
          style={{ top: `${at(above)}%`, transform: "translateY(-50%)" }}
        >
          <GlyphText text={String(above)} size="0.5625rem" className="text-ink-3" />
        </span>
      ))}
    </div>
  );
}

/**
 * The lines themselves, drawn across the picture.
 *
 * They are part of the picture's field rather than a border beside it, which is
 * the whole difference between a height board and a framed photograph with
 * ticks next to it. So they sit inside the frame's box, over the photograph and
 * over the panel canvas that dissolves into it.
 *
 * White at a third, and not a token. Every colour token on this site is a value
 * on one grey ramp fitted against the page's own ground, and a line laid over a
 * photograph is not on the page's ground — it is on a night shot that is dark
 * on both skins. `--border` would be invisible over it on the light skin and
 * nearly so on the dark. This is the same reasoning that lets album art and
 * company marks keep their own colours: the mark has to hold against what is
 * actually behind it. Equal channels either way, so the monochrome law is
 * untouched.
 */
function Board() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {MARKS.map((above) => (
        <span
          key={above}
          className="absolute inset-x-0 block h-px"
          style={{ top: `${at(above)}%`, background: "rgba(255, 255, 255, 0.34)" }}
        />
      ))}
    </div>
  );
}

/**
 * Him, resolved out of the matrix, and measured.
 *
 * The one photograph on /about, and the only image on it, so it arrives the way
 * every other photograph on this site arrives: as a dot-matrix panel that
 * dissolves into the picture. That is `lib/glyph/sweep.ts` driving
 * `lib/glyph/panel.ts` — the *panel* renderer, whose emitters are all one size
 * and carry tone in brightness. It is not `lib/glyph/pixel.ts`, which draws the
 * dot language behind GlyphCell, GlyphIcon and GlyphText. The two are
 * constantly mistaken for each other, and the only thing here that belongs to
 * the second is the numerals on the board.
 *
 * **A field on the record, not a band across the sheet.** The last version ran
 * the picture the whole width of the page and argued for it at length; the page
 * it argued inside is gone. A record's portrait is one of its fields — sized,
 * placed, and measured against something — and a 1192px band is the opposite
 * gesture, a picture the page has been cleared to make room for. It stands in
 * the right-hand column of the sheet now, level with the label-value rows.
 *
 * **The cap is applied here rather than left to the frame.** `.frame-cap` holds
 * every frame on the site under 78svh by narrowing it and centring it inside
 * whatever box it was given — which is right everywhere else and wrong here,
 * because a frame that narrows away from its own board leaves the numerals
 * pointing at nothing. On a short window the container takes the cap first and
 * the frame simply fills it, so the lines always meet their figures.
 *
 * **On the cell count, which the column decides.** The panel lays an emitter
 * every 7px whatever the box, so a 264px field is 38 emitters across where the
 * full-width band was 170. That is the right trade rather than a loss: the
 * lattice is only on screen for the length of the dissolve, and what is left
 * afterwards is the photograph at whatever resolution the browser fetched. A
 * coarser panel makes the arrival read as a matrix resolving rather than as a
 * photograph with a texture laid over it, which is the whole reason the
 * treatment exists. `centreMidtone` re-derives its exponent from whatever frame
 * it is handed, so the correction follows the new count and the new crop rather
 * than being fitted to the old ones.
 */
export function Portrait({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div
        className="mx-auto grid grid-cols-[var(--sl)_minmax(0,1fr)_var(--sr)] [--sl:2rem] [--sr:2rem]"
        style={{
          maxWidth: `calc(min(30rem, var(--frame-cap) * ${RATIO[0]} / ${RATIO[1]}) + var(--sl) + var(--sr))`,
        }}
      >
        <Scale side="left" />
        <PanelField rootMargin="0px" tone={centreMidtone} className="relative">
          <Frame
            src={FILE.src}
            /* Him, not the effect. A reader who cannot see the picture is owed
               what is in it, and neither the dissolve nor the board is in it —
               they are how the page chose to draw it. */
            alt="Damilare in a cap and a dark polo shirt, leaning on a table at a restaurant at night."
            /* A band, not the file's own shape. The intrinsic width and height
               are deliberately not handed over: passing them would declare the
               slot 9:16, and there would be no crop for the board to measure. */
            ratio={`${RATIO[0]} / ${RATIO[1]}`}
            position={`50% ${POSITION * 100}%`}
            sizes="(min-width: 768px) 24rem, (min-width: 640px) 26rem, 74vw"
            preload
            panel
          />
          <Board />
        </PanelField>
        <Scale side="right" />
      </div>
      {/* What the board is counting. Without this the numerals are a mood; with
          it they are a measurement of a named file, and a reader can check both
          figures against the file itself. */}
      <figcaption className="mt-3 text-center font-mono text-2xs uppercase tracking-wider text-ink-3">
        {FILE.width} &times; {FILE.height} px &middot; rows above the foot
      </figcaption>
    </figure>
  );
}
