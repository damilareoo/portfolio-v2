/**
 * Frames: what the matrix is asked to hold.
 *
 * A frame is one value per grid position, row-major, 0 to 1. Where it comes
 * from — a rasterised mark, an album cover, a stamped numeral — is the only
 * thing that changes between the faces the site wears.
 *
 * The rasterising sources need a canvas, so they run in the browser only.
 */

export function emptyFrame(grid: number): Float32Array {
  return new Float32Array(grid * grid);
}

/**
 * The Spotify mark, rasterised into the same value grid the artwork uses.
 *
 * Drawing it rather than shipping an image means it inherits the cell field
 * exactly: the mark is not placed on the disc, it is what the disc is made of.
 */
export function spotifyMark(grid: number, superSample = 4): Float32Array {
  const s = grid * superSample;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(grid * grid).fill(0.5);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, s, s);

  // The body.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
  ctx.fill();

  // The three waves, cut back out of it.
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  const waves: [number, number, number][] = [
    [0.72, 0.4, 0.082],
    [0.82, 0.36, 0.07],
    [0.92, 0.32, 0.058],
  ];
  for (const [cy, r, width] of waves) {
    ctx.lineWidth = s * width;
    ctx.beginPath();
    ctx.arc(s / 2, s * cy, s * r, (215 * Math.PI) / 180, (325 * Math.PI) / 180);
    ctx.stroke();
  }

  const pixels = ctx.getImageData(0, 0, s, s).data;
  const values = new Float32Array(grid * grid);
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      // Box-average the supersampled block so edges land as mid values.
      let sum = 0;
      for (let dy = 0; dy < superSample; dy++) {
        for (let dx = 0; dx < superSample; dx++) {
          const i = ((row * superSample + dy) * s + (col * superSample + dx)) * 4;
          sum += pixels[i];
        }
      }
      values[row * grid + col] = sum / (superSample * superSample * 255);
    }
  }
  return values;
}

/** Rec. 601 luma — the standard weighting for perceived brightness. */
export function artFrame(pixels: Uint8ClampedArray, grid: number): Float32Array {
  const values = new Float32Array(grid * grid);
  for (let i = 0; i < grid * grid; i++) {
    const p = i * 4;
    values[i] = (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255;
  }
  return values;
}
