export const site = {
  name: "Damilare Osofisan",
  handle: "damilareoo",
  url: "https://www.damilareoo.xyz",
  email: "dosofisan7@gmail.com",
  x: "https://x.com/damilareoo",
  github: "https://github.com/damilareoo",
  // Printed under the email in the /about header. The home lockup says "Lagos".
  coordinates: "6.5244° N, 3.3792° E",
  /* The same place the coordinates string names, as numbers. The string is a
     label; parsing it back would make a label load-bearing. */
  latitude: 6.5244,
  longitude: 3.3792,
  // The line the steps card fills toward. A round number, not a prescription.
  stepGoal: 10000,
  /* The handle is `damilareoo` on every other network, so this is an inference
     rather than a fact — the owner confirms or corrects it. */
  calendly: "https://calendly.com/damilareoo",
};

/** Carried over from portfolio-v1's "elsewhere" list. */
export const elsewhere = [
  { label: "X", handle: "@damilareoo", href: "https://x.com/damilareoo" },
  { label: "GitHub", handle: "damilareoo", href: "https://github.com/damilareoo" },
  { label: "LinkedIn", handle: "damilareoo", href: "https://linkedin.com/in/damilareoo" },
  { label: "v0", handle: "@damilareoo", href: "https://v0.app/@damilareoo" },
  { label: "Layers", handle: "damilareoo", href: "https://layers.to/damilareoo" },
  { label: "Substack", handle: "@damilareoo", href: "https://substack.com/@damilareoo" },
  { label: "Contra", handle: "damilareoo", href: "https://contra.com/damilareoo" },
];

/**
 * A picture of something he does when he is not working, and a line about it.
 *
 * Chess, basketball, running — the three he named. **There are no files yet**,
 * and that is the state this ships in: `public/` holds `companies/`, `feed/`
 * and `work/` and nothing else. An empty list renders nothing at all on /about
 * — no frames, no captions, no placeholder saying art is coming — because a
 * page that announces what it does not have yet is a page that is not finished,
 * and this one is. The block appears the moment there is something to put in
 * it.
 *
 * To fill it: drop the files under `public/`, add an entry each, and give
 * `width`/`height` in the image's own pixels so the frame reserves the right
 * shape before the picture decodes. `ratio` is the fallback for a file whose
 * intrinsic size is not to hand; without either, the frame stands at 4:3.
 * `caption` is a fact about the picture, not a title for it — the site does not
 * name photographs.
 */
export type Pastime = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  ratio?: string;
};

export const pastimes: Pastime[] = [];

// Work lives in data/work.ts, in the order the home shows it.
