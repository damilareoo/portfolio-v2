# Portfolio v2

Personal portfolio of Damilare Osofisan. Successor to [damilareoo.xyz](https://www.damilareoo.xyz), rebuilt from the ground up.

## Direction

Monochrome two-skin system, with exactly one exception. Hierarchy comes from tonal value, weight, and size, never hue — the single hue on the site is `--miss`, a red carrying one meaning: a day the step goal was missed. It is the only place a colour is asked to mean something, and it is deliberate rather than decorative. Borders separate surfaces instead of shadows, and they come in two kinds: a border that separates is drawn as a row of square pixels on the icon grid, while a border that contains stays a hairline. A rule is a mark; a box edge is an edge. Set entirely in Suisse Int'l, with Suisse Int'l Mono for labels and meta.

The design language is **Handled**: every surface admits to being an object with weight, an edge you can take hold of, and a memory of where you left it. Four laws govern it, the last one load-bearing:

1. If it looks like an edge, it drags.
2. If it looks like a card, it lifts.
3. If it changes, it remembers.
4. Nothing moves unless touched, arriving, or reporting.

Law 4 is what lets monochrome restraint and playfulness coexist: the site is quiet in a screenshot and alive in use, and every motion on the page was caused by the visitor.

The "arriving" clause is narrow and deliberate. An element may animate the first time it enters the viewport — once. It does not re-trigger when scrolled back to, because a reveal that fires twice is a performance rather than an arrival.

The "reporting" clause is narrower still. An instrument displaying live external state may move to show that state changing — only an instrument, only while the state is actually live, and only within its own bounds. The playhead pulse is a track that is playing right now; the pedometer is a day that is still being walked. The motion is the reading, not decoration around it, and it stops when the reading does: nothing on the page may move to announce a value that is merely sitting there.

Still forbidden: parallax, scroll-linked transforms, autoplay, ambient loops, and anything that keeps moving while the visitor is still. A page at rest holds no running animation, and a page at rest with nothing playing holds none either.

Specs: `docs/specs/2026-08-17-v1-surfaces.md` (surfaces, motion law, case model), `docs/specs/2026-08-13-design-language.md` (language, feel) and `docs/specs/2026-08-10-portfolio-v2-design.md` (tokens, typography, stack).

## Surfaces

Four, and the nav names all four.

| Route | Holds |
|---|---|
| `/` | Everything about the work — lockup and the selected pieces |
| `/shots` | The gallery. `/feed` redirects here permanently |
| `/about` | The record about the person, and the roles behind it |
| `/colophon` | How the site is made, and the instruments |

`/work/[slug]` survives as a case page, reached from a selected card. `/system` and `/changelog` stay live and stay out of the nav; the colophon links to both.

The case route sets `dynamicParams = false`, so the set of slugs is closed at build time and an unknown one gets a real 404 from the router. It has to be settled there: the page sits behind the root `loading.tsx`, which means Next serves a prerendered shell and commits the status before the body streams, and a `notFound()` reached during the render arrives after the headers have gone. That is how a page returns 200 while showing the not-found screen, which is a lie told to crawlers rather than to readers.

There is no archive surface. With selected work and the dated list both on the home page, `/work` held a filtered restatement of a page the visitor had already read — a nav entry has to earn itself, and that one was paying for a duplicate.

The dated list has since gone too. The selected pieces with room read as an argument; the same pieces as a list read as an inventory, and the page was making both cases at once. Roles moved to `/about`, where they belong: they are a fact about the person, not a piece of work.

## The icon language

The matrix is not only the instrument panel. Every icon on the site is a 7×7 field of the same
pixels, drawn from the same constants in `lib/glyph/pixel.ts` that the canvas draws with — two
renderers, one hand. Seven cells because it is odd and so has a true centre, because it is the
dot alphabet's five rows with one above and one below so an icon aligns with a word on its own,
and because at five cells a diagonal arrow and a chevron are the same shape.

| Renderer | Draws | Why |
|---|---|---|
| `components/glyph-cell.tsx` | The instruments | Canvas, springs, ripples, an arrival sweep — a live field that moves |
| `components/glyph-icon.tsx` | The icons | SVG, no state, no effects, no client boundary — a 14px mark that does not |

Two rules keep it honest. An icon replaces a **mark**, never a **word**: the arrows became glyphs,
and the four nav chips kept their labels, because trading a word for a mark makes a control worse
for anyone who needs the word. And an unlit cell is simply not drawn —
the field keeps its unlit lattice because the lattice is the instrument's face, but an icon quotes
the panel rather than imitating one.

Nothing here animates. An icon neither reports nor arrives, so Law 4 leaves it still.

## Shots

The gallery renamed from `/feed`, and the one surface where a photograph is put through the matrix.

The layout drifts: four columns, each pushed down by a whole number of cells and filled
shortest-first, so the tops stagger while the bottom stays roughly level. Whole cells because a
drift measured in pixels somebody liked the look of is arbitrary, and arbitrary is the opposite of
placed — quantised to the pitch, every shot on the page sits on one invisible matrix.

Filling shortest-first only works if a column's running height and its drift are counted in the
same unit, and for two versions they were not: the drift went in as pixels while each shot added a
bare aspect ratio, so no single shot could outweigh a six-cell head start and one column took
seventeen of twenty-one. `lib/shots-layout.ts` counts both in cells — a shot is `COLUMN_CELLS`
times its aspect ratio, the column's width at the full measure — and the split comes out 5·5·7·4.
The heuristic is exact at the full measure only, because the drift is a fixed offset while the
shots scale; that is the width worth being right at.

The columns are filled in JavaScript and drawn by CSS, so both read one breakpoint, `WIDE_QUERY`.
Below it the feed is bucketed into two columns rather than dealt into four and left to wrap — four
buckets in two tracks would put the fifth shot beside the first, and a feed sorted newest-first
that is not read newest-first is just an unsorted feed. Narrow gets its own arrangement, not a
halved one.

A shot arrives on an **LED panel**, not through a halftone, and the difference is the whole of it:

| Halftone | Panel |
|---|---|
| Dot size carries tone | Dot size is constant; **brightness** carries tone |
| Continuous ink | Sixteen discrete steps, as a driver has |
| Unlit is absent | Unlit keeps a floor — the lattice is the panel's face |

`inkRadius` in `lib/glyph/tone.ts` is correct for a halftone and wrong here; `lib/glyph/panel.ts`
holds the panel instead. `autoLevel` is shared by both — a shot living in the bottom fifth of the
scale would otherwise drive an almost-empty field.

One wavefront crosses the whole page rather than one per shot, running down and slightly right so
it reads as a front crossing rather than a curtain falling. Shots entering within eighty
milliseconds join the same front. The photograph takes over while the front is still travelling, so
the panel is never the finished picture — only the moment before it. Reduced motion is given the
value and never the journey to it.

No labels. A shot's name lives in its `alt` text, where it serves a reader who needs it without
being drawn over the work.

## The glyph matrix

One engine draws every dot field on the site: a matrix of cells with a spring apiece, a dot font, and a frame loop that stops itself. What a field says is the caller's business — it hands over a frame, and the field migrates to it.

| Field | Reports |
|---|---|
| The disc | The track playing, as dithered album artwork, with a ring struck on the playhead's period |
| The pedometer | Three faces of one field — the walk, the record, and the week |
| The forge | Nothing. It is the one field the visitor drives, on `/colophon` |

### The three faces

The pedometer is one field wearing three faces, turned by swipe, click, or arrow key.

| Face | Shows |
|---|---|
| The walk | A figure on a dotted path. It sets off from the start and walks to today's share of the goal, every time you turn to it — Law 4's "unless touched", since turning the page is what caused it |
| The record | Today's total and the seven-day average, set in the 3×5 dot alphabet, each under a mono label and its percentage |
| The month | A calendar of the month you are standing in — seven columns, six rows, day letters ruled along the bottom |

The calendar has three states and no more, so it reads at a glance:

- **Ink** — the goal was met
- **`--miss` red** — the day ran out of hours without meeting it
- **A quiet half-size dot** — nothing is known: a day not yet reached, or one nobody reported

Opening a reported day draws **the day's line**: a figure whose length is that day's walking, seeded from the date so the same day always draws the same shape. It is deliberately *not* a route — there is no GPS here — and the colophon says so on the page rather than only in the code.

Today wears a pill. Today is never red: a day still being walked has not been missed, which is the same rule as an unreported day not being a day of no walking, applied to the one day still happening.

The pulse is arithmetic on playback position, not beat detection: Spotify answers 403 for the `audio-features` and `audio-analysis` endpoints for this application, so there is no tempo to be had. The colophon's Provenance section states this, along with what the dot language owes Nothing's interface and what it uses of theirs — none of their code, assets, or trademarks.

Steps come from a phone automation posting to a guarded route. Setup is documented at `docs/steps-setup.md`; until it is configured the card degrades to placeholder dots, because a day nobody reported is not a day of no walking.

A glyph drawn in the forge is kept on the visitor's own device and never sent here. Only the fact that one was drawn is counted, once per browser.

## Token system

Semantic tokens only. Components never reference raw hex values; light and dark are variable swaps.

| Token | Light | Dark |
|---|---|---|
| `--bg` | #F4F4F4 | #0A0A0A |
| `--surface` | #FFFFFF | #141414 |
| `--surface-2` | #F7F7F7 | #1C1C1C |
| `--border` | #E9E9E9 | #262626 |
| `--text-1` | #111111 | #F5F5F5 |
| `--text-2` | #6F6F6F | #8A8A8A |
| `--text-3` | #B0B0B0 | #4D4D4D |
| `--fill-strong` | #111111 | #F5F5F5 |

Dark mode inverts the strong fill: primary buttons become light pills with dark labels.

## Stack

| Tool | Purpose |
|---|---|
| Next.js (App Router) | Framework and routing |
| Tailwind CSS v4 | Styling via CSS variable tokens |
| TypeScript | Type safety |
| next-themes | Light and dark mode switching |
| Vercel | Hosting and deployment |

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Two links, one codebase

| Deployment | Vercel project | Purpose |
|---|---|---|
| Portfolio | `damilareoo` | The public face: the four surfaces. `NEXT_PUBLIC_SITE_MODE=portfolio` hides workshop chrome. |
| Workshop | `portfolio-v2` | The build log: the same site plus `/system` and `/changelog`. |

Deploy both with `scripts/deploy.sh`.

## Versioning

Every change ships with an entry in `data/changelog.ts`, rendered at `/changelog`. Each entry records the immutable Vercel deployment URL of that version, so every version of the site stays viewable forever. Versions are also tagged in git (`v0.1.0`, `v0.2.0`, ...).

## Artwork

Art is authored by hand and dropped in; nothing is generated.

```bash
# public/feed/2026-04-sylvan-marks.png   -> dated, titled "Sylvan marks"
# public/work/chessever/01-board.png     -> ordered by the numeric prefix
pnpm manifest
```

`scripts/manifest.mjs` reads intrinsic dimensions straight out of the PNG, JPEG, and WebP headers — no image dependency — and writes a typed `data/assets.generated.ts`. Dimensions ship with the manifest, so no frame ever causes layout shift.

Until art lands, a frame prints what is missing and the shape of the slot rather than collapsing. A case page with assets but no authored blocks falls back to one full frame per asset, in filename order.

## DialKit

The colophon's dial rail is not a preferences panel. Each control rewrites the design tokens the page is drawn from, live, and the choice persists across visits.

| Dial | Writes | Values |
|---|---|---|
| Theme | `.dark` class | Light, Dark, Auto |
| Type | `--type-scale` → root font size | 0.9, 1, 1.12 |
| Density | `--pg-gap`, `--pad`, `--radius-window`, `--radius-tile` | S, M, L |

Two rules keep it working: type sizes are always `rem` so the type dial reaches them, and spacing and radii read from dial tokens rather than fixed values. A pre-paint script in the document head applies saved values before first render, so nothing flashes at its default.

## Work model

One model in `data/work.ts`, tiered by how much room a piece earns.

| Tier | Gets | Lives |
|---|---|---|
| `selected` | A `/work/[slug]` case page and one of the cards on the home | Home |
| `project` | Vocabulary only. Nothing sits here | — |
| `index` | Vocabulary only. Nothing sits here | — |

Only `selected` is occupied, and the model carries only the fields a surface actually renders. The
project tier once held three pieces with data, live links and screenshots that rendered nowhere,
waiting on an archive this site had already argued itself out of building — along with a tile face,
a palette strip, two filters nothing imported, and six fields no surface read. Data kept for a
surface that does not exist is not a plan; it is furniture. The words for the other two tiers stay
because an archive may still earn itself, and then they are the right words.

Selected work without written blocks says so plainly on its case page instead of padding — the site does not pretend to depth it lacks.

The record rows on a case page are the same `RecordRow` that `/about` and `/colophon` use, kept in
`components/ui.tsx` with the other primitives. Three surfaces once drew their own, and the case
page's was the one that disagreed — mono uppercase labels, values ranged right — which is why it
read as foreign rather than as under-designed. It was not the layout.

A case page keeps every word in the left rail — one-liner, `intro`, the record rows, then `approach` — and gives the whole right column to the work. The rail pins on a tall viewport and scrolls within itself rather than dragging the reel down with it.

| Block | Renders |
|---|---|
| `full` | One frame at the column's full width |
| `pair` | Two frames side by side |
| `inset` | One or two frames held inside a tinted plate, `surface` or `strong` |
| `text` | A narrow prose break at a decision point |
| `quote` | A pulled line with optional attribution |

`inset` is what gives a reel rhythm: without a plate every frame is the same width and the page reads as a contact sheet. `text` and `quote` survive for anything that genuinely needs prose mid-reel, but the rail is where words go now.

Blocks without a `src` consume the project's assets in filename order, so dropping files into `public/work/<slug>` fills a reel without editing data. A declared `ratio` only shapes a slot while it is empty — real art always carries its own dimensions — so placeholder ratios stay shallow rather than opening a portrait-sized void.

## The colophon

Nothing on `/colophon` is a screenshot of the system. Token rows read their own live computed value — so the page cannot drift out of date with the stylesheet — and copy the hex on click. Type specimens are set, not shown: pick a weight, drag the size. The dials and the shared counters live here too.

## The value field

The colophon carries one instrument beyond the dials. Its scatter plots eight named landmarks on **weight × contrast**; the cursor blends the nearest of them by inverse-distance weighting and writes the result into `--body-weight`, `--text-2`, `--text-3`, and `--border`. Click commits. The blend holds across client-side navigation and resets on refresh.

The blending is left to CSS — each token becomes a `color-mix()` against `var(--bg)` and `var(--text-1)` — so switching skin under a held blend re-derives the ladder for free.

## Counters

The site reports on itself with real data, so it is never identical twice.

| Counter | Source | Behaviour |
|---|---|---|
| Dials turned | Upstash Redis, shared by every visitor | Read once on mount; moves only when you turn a dial |
| Now playing | Spotify, refreshed every 30s | The halftone disc, bottom right |
| Build | `VERCEL_GIT_COMMIT_SHA` at build time | Version and short commit |

Law 4 governs all three: the dial count never polls and never climbs on its own, and the roll animation fires only for a turn the visitor caused.

Now-playing is the halftone disc, sitting in the home layout beside the work list. Album artwork is converted to grayscale and rendered as an ordered-dither dot field, which is what lets real artwork onto a site with no accent hue — dithering discards the colour rather than suppressing it, and what survives is the one thing the palette trades in.

| State | Disc |
|---|---|
| Silent | The dots hold the Spotify mark, rasterised into the same value grid the artwork uses |
| Playing | The dots migrate into the dithered album artwork, and back when it stops |
| Pointer inside | Dots displace with distance falloff and settle on a spring |
| Click | A ripple travels outward as a ring, striking dots as the front passes them |

The mark is drawn rather than shipped as an image, so it inherits the dot field exactly — it is not placed on the disc, it is what the disc is made of.

The frame loop runs while the pointer is inside, while dots are settling, while a value migration is in flight, or while a ripple is alive, and stops itself the moment all four are false.

Artwork is proxied through `/api/now-playing/art` so the canvas stays same-origin and `getImageData` keeps working. That route allowlists the Spotify CDN hosts — without it, it would be an open proxy.

Counters degrade rather than fail. With no store configured, `lib/counters.ts` returns null everywhere and the rail shows a local count labelled "by you". A counter that has never been read renders placeholder digits at `--text-3`, not a zero.

Environment: `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`), plus `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`. Both Vercel projects share one Redis store so the two faces show one number.

## Status

v1.12.0: four surfaces, three selected pieces with case pages, Shots on the LED panel across four balanced columns, and a work model that carries nothing it does not render.

Outstanding, and worth being exact about:

- **The fourth card.** Only three pieces are `selected`, so the home grid reads `03 PIECES` with an empty cell. A fourth is intended.
- **Two roles.** Endgame AI, ChessEver and HEX carry exact dates. SmallChess and an early-career role sit commented out in `data/experience.ts` — dates unknown, and the site does not invent them.
- **Frames.** Hitman's Library has nine real captures. Sylvan has two: its site is a single near-empty viewport. ChessEver has one, its existing hero — `chessever.com` answers automated requests with a bot check rather than the product, so its reel is labelled empty frames until real art lands.
- Shots are still captures of the live products and of portfolio-v1, standing in until real artwork is dropped into `public/feed`. The directory keeps its old name; only the surface was renamed.
- The handling layer from the 2026-08-13 spec — divider drag, tile reorder, reset — is still unbuilt.
