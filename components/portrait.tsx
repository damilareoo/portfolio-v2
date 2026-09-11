"use client";

import { useEffect, useRef, useState } from "react";
import { BAND, CEIL, paintPanel, type Panel } from "@/lib/glyph/panel";
import { autoLevel, centreMidtone } from "@/lib/glyph/tone";

const FILE = { src: "/about/portrait.png", width: 621, height: 1104 };

/**
 * How much of the file the field is sampled from, as a fraction of its width.
 *
 * A `cover` crop of a 9:16 file into a column near square takes the whole width
 * and a band of the height — which is his whole torso, the table, the chairs
 * behind him and most of a restaurant. At the cell count a column this size
 * gives, a figure that small is a texture rather than a person. This takes a
 * little over half the width, centred on him, so the emitters spend themselves
 * on the head and shoulders.
 */
const ZOOM = 0.68;

/**
 * How far apart the emitters stand here, in CSS pixels.
 *
 * `lib/glyph/panel.ts` puts them 7px apart, which is right for the field it was
 * written for: a page of shots, each read at a glance, where the lattice is a
 * texture and the photograph underneath resolves a moment later. This picture
 * has no photograph underneath to resolve into — the dots are the whole of it,
 * and at 7px a face across this column is under a hundred cells wide, which is
 * a texture rather than a likeness. Four and a half puts it near three hundred,
 * where an eye is an eye. The constant is local for the same reason the ceiling
 * is: nothing about the shots field changes.
 */
const PITCH = 4.5;

/** Where that window sits in the file, as fractions of its width and height. */
const FOCUS = { x: 0.575, y: 0.43 };

/**
 * What the panel's own ceiling costs a picture that stays.
 *
 * `emitter` never returns more than `CEIL` — 0.62 — because the panel it was
 * written for is a *transition*: a field laid over a photograph that fades out
 * as the photograph fades in, and one that reached full ink would black the
 * picture out at the moment of handover. This field is not laid over anything.
 * It is the picture, so it is entitled to the whole ramp, and the values are
 * divided by the ceiling on the way in so `emitter`'s own multiplication puts
 * them back. Nothing in `lib/glyph/panel.ts` changes: the shots field and the
 * case reels keep the ceiling that is right for what they do.
 */
const UNCAP = 1 / CEIL;

/**
 * How hard the values are pushed away from their middle.
 *
 * Sampled and levelled, this photograph still lands most of its emitters in the
 * middle third of the ramp, and a field with no darks and no lights reads as
 * grey weather rather than as a face. The correction is a straight gain about
 * the midpoint — it costs the extremes, which this file has few of, and buys
 * the separation between his cap, his face and the ground behind him.
 */
const GAIN = 1.45;

/**
 * Luminance to ink, and **not** inverted.
 *
 * `panelFrom` inverts — a dark pixel lights an emitter — because the shots it
 * was written for are daylight photographs on a pale ground, where the subject
 * is the dark thing and the sky is the empty thing. This file is the opposite
 * of that. It was taken at night: the ground behind him, his cap and his shirt
 * are all dark, and the only bright things in the frame are his face, his
 * forearms and the phone in his hand.
 *
 * Inverted, that fills the entire field — background and figure alike land near
 * the top of the ramp and the picture reads as one dark mass with a hole in it.
 * Read straight, the light falling on him is what lights the emitters and
 * everything the light did not reach stays empty, so the figure is drawn rather
 * than silhouetted. It is the same picture; it is the exposure that decides
 * which way round the ink belongs.
 *
 * It holds on both skins for the same reason every other panel does: the ink is
 * the page's own, so a lit emitter is dark on the light skin and light on the
 * dark one, and the figure is what is lit either way.
 */
function readStraight(pixels: Uint8ClampedArray, count: number): Float32Array {
  const raw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    raw[i] = 1 - (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255;
  }
  return autoLevel(raw);
}

function contrast(values: Float32Array): Float32Array {
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const pushed = (values[i] - 0.5) * GAIN + 0.5;
    out[i] = (pushed < 0 ? 0 : pushed > 1 ? 1 : pushed) * UNCAP;
  }
  return out;
}

/**
 * Far enough past the field that every emitter is fully lit.
 *
 * `paintPanel` takes a wavefront position and lights each emitter by how far
 * behind the front it stands. That is what the arrival uses; here there is no
 * arrival, so the front is put beyond the last cell and the whole field paints
 * at its own values. One number is the difference between a picture dissolving
 * and a picture standing still.
 */
const LIT = 1e6;

/**
 * Him, in the matrix, and staying there.
 *
 * Every other photograph on this site *arrives* through the dot field and
 * resolves into itself — `lib/glyph/sweep.ts` running a wavefront across a
 * canvas and fading the photograph up behind it. This one does not resolve.
 * The owner asked for the picture to carry the glyph language, and a treatment
 * that is only visible for the second and a half of its entrance is not a
 * language the page speaks; it is a transition it plays. So the field is
 * painted once and held.
 *
 * That also settles what the picture is made of. A resolved photograph is the
 * only full-colour thing this site would hold that is not a quotation of
 * somebody else's artwork — album covers and company marks keep their colours
 * because they belong to other people, and his own photograph belongs to the
 * page. Painted as emitters it is drawn in the page's own ink, on the page's
 * own ramp, and the monochrome law needs no exception for it.
 *
 * Law 4 is satisfied by there being no motion at all: the field is painted on
 * mount and repainted only when the box or the skin changes, so a page at rest
 * holds a still picture. There is no loop here and nothing for reduced motion
 * to withhold.
 *
 * This is the *panel* renderer — `lib/glyph/panel.ts`, whose emitters are one
 * size and carry tone in brightness. It is not `lib/glyph/pixel.ts`, which
 * draws the dot language behind GlyphCell, GlyphIcon and GlyphText. The two are
 * constantly mistaken for each other.
 *
 * `centreMidtone` is not optional here. The file is a night shot whose values
 * pile onto a single step; without the correction a third of the emitters land
 * on one level and the field reads as a slab rather than as a person.
 */
export function Portrait({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<Panel | null>(null);
  const [ready, setReady] = useState(false);

  /* Sample the file once, at whatever cell count the box asks for, and keep
     the values. Sampling reads the decoded image back out of a canvas, which
     taints on a cross-origin source — this file is same-origin, and it has to
     stay that way or `getImageData` throws and the picture never appears. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let live = true;
    const image = new window.Image();
    image.decoding = "async";

    const sample = () => {
      const box = host.getBoundingClientRect();
      if (!live || box.width < 2 || box.height < 2) return;

      const cols = Math.max(2, Math.round(box.width / PITCH));
      const rows = Math.max(2, Math.round(box.height / PITCH));

      /* The crop, done here rather than in CSS: the field is sampled from the
         window of the file the box should show, so the emitters are the crop
         rather than a squashed whole. Clamped to the file on both axes, so a
         very wide or very tall column asks for a window that exists. */
      const bandWidth = Math.min(FILE.width, FILE.width * ZOOM);
      const bandHeight = Math.min(FILE.height, (bandWidth * box.height) / box.width);
      const sx = Math.max(0, Math.min(FILE.width - bandWidth, FILE.width * FOCUS.x - bandWidth / 2));
      const sy = Math.max(
        0,
        Math.min(FILE.height - bandHeight, FILE.height * FOCUS.y - bandHeight / 2),
      );

      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(image, sx, sy, bandWidth, bandHeight, 0, 0, cols, rows);

      const pixels = octx.getImageData(0, 0, cols, rows).data;
      const values = contrast(centreMidtone(readStraight(pixels, cols * rows)));
      panelRef.current = { cols, rows, values };
      setReady(true);
    };

    image.onload = sample;
    image.src = FILE.src;

    const observer = new ResizeObserver(() => {
      if (image.complete && image.naturalWidth > 0) sample();
    });
    observer.observe(host);

    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  /* Paint. Separate from sampling because the two change for different
     reasons: the values change when the box or the file does, and the ink
     changes when the visitor switches skin — and a skin switch must not
     re-read the image. */
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !ready) return;

    const draw = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const box = host.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* The ink is read off the element rather than named, so the field is
         whatever the skin says the page's text is and a skin switch repaints
         it without this file knowing which skins exist. */
      const ink = getComputedStyle(host).color || "#0f0f0f";
      paintPanel(
        ctx,
        panel,
        { width: box.width, height: box.height, originX: 0, originY: 0 },
        LIT,
        BAND,
        ink,
      );
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(host);

    /* A skin switch changes `color` on the document, not on this element's own
       style, so there is nothing to listen to but the class that carries it. */
    const skin = new MutationObserver(draw);
    skin.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      skin.disconnect();
    };
  }, [ready]);

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden text-ink ${className}`}
      /* The picture is the page's, and what a reader who cannot see it is owed
         is what is in it — not how it was drawn. */
      role="img"
      aria-label="Damilare in a cap and a dark polo shirt, leaning on a table at a restaurant at night, drawn as a field of dots."
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
