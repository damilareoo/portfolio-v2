# Portfolio v2

Personal portfolio of Damilare Osofisan. Successor to [damilareoo.xyz](https://www.damilareoo.xyz), rebuilt from the ground up.

## Direction

Two-skin system on a grey ramp, with exactly one exception. Every step is a true grey with equal channels, so hierarchy comes from tonal value, weight, and size, never hue. The ground is bright — `#fcfcfc`, taken from `sophia-liu.work`; the warm cast that briefly came with it did not survive looking at it. The single hue the design system spends is `--miss`, a red carrying one meaning: a day the step goal was missed. It is the only place a colour is asked to mean something, and it is deliberate rather than decorative. Company marks are reproduced in their own colours, because they belong to someone else. Borders separate surfaces instead of shadows, and they come in two kinds: a border that separates is drawn as a row of square pixels on the icon grid, while a border that contains stays a hairline. A rule is a mark; a box edge is an edge. Set entirely in Suisse Int'l, with Suisse Int'l Mono for labels and meta.

The design language is **Handled**: every surface admits to being an object with weight, an edge you can take hold of, and a memory of where you left it. Four laws govern it, the last one load-bearing:

1. If it looks like an edge, it drags.
2. If it looks like a card, it lifts.
3. If it changes, it remembers.
4. Nothing moves unless touched, arriving, or reporting.

Law 4 is what lets the restraint and the playfulness coexist: the site is quiet in a screenshot and alive in use, and every motion on the page was caused by the visitor.

The "arriving" clause is narrow and deliberate. An element may animate the first time it enters the viewport — once. It does not re-trigger when scrolled back to, because a reveal that fires twice is a performance rather than an arrival.

The "reporting" clause is narrower still. An instrument displaying live external state may move to show that state changing — only an instrument, only while the state is actually live, and only within its own bounds. The playhead pulse is a track that is playing right now; the pedometer is a day that is still being walked. The motion is the reading, not decoration around it, and it stops when the reading does: nothing on the page may move to announce a value that is merely sitting there.

Still forbidden: parallax, scroll-linked transforms, autoplay, ambient loops, and anything that keeps moving while the visitor is still. A page at rest holds no running animation, and a page at rest with nothing playing holds none either.

Specs, newest first: `docs/specs/2026-09-02-the-instrument-bank.md` (binding — the bank, three products, the hero statement), `docs/specs/2026-09-02-instrument-and-mosaic-design.md` (the instrument, the product, the mosaic), `docs/specs/2026-09-01-home-as-feed-design.md` (the home is the work), `docs/specs/2026-08-17-v1-surfaces.md` (surfaces, motion law, case model), `docs/specs/2026-08-13-design-language.md` (language, feel) and `docs/specs/2026-08-10-portfolio-v2-design.md` (tokens, typography, stack).

## Surfaces

Four, and the nav names all four.

| Route | Holds |
|---|---|
| `/` | The work itself — a hero statement, then three numbered products, each unfolding in place, and the instrument wall at the foot |
| `/shots` | The gallery. `/feed` redirects here permanently |
| `/about` | Him, one photograph dissolved through the glyph engine, and the roles behind the work |
| `/colophon` | How the site is made, the instruments, and a field anyone can draw on |

`/work/[slug]` is gone. The home carries the case studies now, and the three URLs that existed redirect to the product that holds them — `/#<slug>`, the anchor on the product's own section. Written out one per line rather than patterned: slug and anchor are now identical, so `/work/:slug -> /#:slug` would resolve correctly and would also send every slug that never existed to the top of the home page. A URL that was never real should 404, and three explicit lines say which three were. `/system` and `/changelog` stay live and stay out of the nav; the colophon links to both.

**A standing rule for any future dynamic route.** A route whose set of params is closed must set `dynamicParams = false` so an unknown one gets a real 404 from the router. It cannot be settled with `notFound()` alone: a page sitting behind the root `loading.tsx` is served as a prerendered shell, so Next commits the status before the body streams and a `notFound()` reached during the render arrives after the headers have gone. That is how a page returns 200 while showing the not-found screen, which is a lie told to crawlers rather than to readers. This cost v1.11.0 a fix; the route it fixed has since been deleted, but the trap has not moved.

There is no archive surface and no index. `/work` held a filtered restatement of a page the visitor had already read; the dated list beside the selected pieces made the same argument twice, once as an argument and once as an inventory. Both are gone, and so is the era layer that grouped the pieces by employer — it spent two of its five sections announcing it had nothing to show.

What is left is the work itself: three products, numbered by position, each showing a title, a one-liner and the first two blocks of its reel, with the rest behind one control. Roles moved to `/about`, where they belong: they are a fact about the person, not a piece of work.

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

The layout is a **band mosaic**, and it is formless on purpose. `lib/mosaic.ts` deals the shots into
bands that each span the full twelve-column measure, taking widths from a fixed vocabulary — `7 5`,
`4 8`, `3 5 4`, `5 7`, `8 4`, `4 3 5`. Two-item bands are the feed's big moments; three-item bands
are its rests. No band opens on the width the one above it closed on, which is what keeps the page
reading as organic rather than as a repeating pattern. A shot's height is never authored: it is the
shot's own aspect ratio, at whatever width its band gave it.

Nothing about it is random. A shuffled mosaic would hydrate into a different page than the server
rendered, so the composition is a function of position alone and the tests hold that composing twice
gives the same answer. A lone shot at the end takes the whole measure rather than a fraction of one.

The reference this came from builds its mosaic by hand — every shot given a column and row span in
the markup. That reads well and asks for a decision every time a shot is added. This asks for none:
drop a file into `public/feed`, run `pnpm manifest`, and it is placed.

Below the large breakpoint the grid is two columns and every shot takes one of them. Narrow gets its
own arrangement rather than a squeezed twelve, and the feed stays read newest-first.

Thirty shots means thirty panels, and one front crosses all the visible ones at once. A panel
drives sixteen brightness levels and no more, so `paintPanel` collects every emitter at a level
into one path and lays it down in a single fill: a field of thirteen hundred emitters costs sixteen
fills rather than thirteen hundred. Frames are measured once when a tile arrives, in page
coordinates — scroll-invariant, so the sweep never asks the document where anything is — and the
ink is read once per front rather than once per tile per frame.

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

## The instrument wall

Every reading the site takes, flush across the whole measure, hairline-divided, at the foot of `/` and of the two workshop surfaces that do not write their own footer (`/system`, `/changelog`). What it replaced: a large disc, a medium steps card, a small clock and a medium weather face, split across two zones by a rule, at four sizes and on no shared baseline — four widgets somebody collected rather than a wall of instruments.

| Reading | Reads | Source |
|---|---|---|
| Lagos | The time, on an analogue face | The visitor's clock, ticked every second so the readout turns over *on* the minute |
| Weather | Lagos conditions and temperature | Open-Meteo direct from the client, one shared reading per document, on a 15-minute cadence — `lib/use-weather.ts`. There is no `/api/weather`. |
| Music | The track playing, as the dithered disc | `/api/now-playing`, every 30s |
| Steps | Today against the goal | `/api/steps`, every 30s |

One shape, no measure: `InstrumentReading` in `components/instrument-card.tsx` draws its face at `aspect-square w-full`, so a reading takes whatever the cell gives it rather than being pinned at one number — roughly 93px on the narrowest phone up to about 215px at four-up on a wide screen. Any tuning done against a fixed face size is tuning against a number that no longer exists. The shell owns radius and where the value sits; the face inside owns only what it reads. There is no visible label — a clock looks like a clock, and the word above it repeated the picture — so the name is carried by `srLabel` and rendered `sr-only`, and the value beneath the face is the sole visible identifier.

Two columns is the floor — a single column of four readings is a list, and a list of readings is the thing this is not. Four columns arrive at `sm` rather than `lg`: measured, the two-up at 768px gave 352px cells around a 96px face, wider than the 286px the four-up gets at 1440.

Whether a reading is a control is derived from whether it was given a press handler, never from a boolean that could disagree with one. Only the steps reading has a second face, so only the steps reading is a button; the disc is a picture, carries no pointer cursor, and its accessible name says what is playing rather than instructing a click it cannot honour. The wall plays one staggered arrival the first time it enters the viewport, under Law 4's "arriving" clause, and never again.

Beneath it, one quiet line of links — `components/footer-line.tsx`, written once and rendered by both footers, so a network added to `elsewhere` in `data/site.ts` lands on every surface. The version chip is the line's only variable, and it varies by face rather than by surface: `lib/site-mode.ts` says the workshop carries Changelog and the public face does not.

### An instrument that cannot read says so

The hard rule of the wall, and it has two halves that have to agree.

- **An em dash means the instrument could not read.** No credentials, an upstream that refused or threw, a store that is not configured, a body that will not parse, a value that has not arrived yet.
- **A word means it read fine and the answer was nothing.** "Silent" on the music reading is a reading: Spotify answered, and what it said was that nothing is playing.

Collapsing the two is the worst failure available here, and both API routes are written to make it impossible. `/api/steps` answers `{ configured: false }` when it has nothing to report; `/api/now-playing` says the same words for the same reason, and keeps `{ isPlaying: false }` for silence it actually heard. A failure never leaves either route wearing the shape of a reading.

The clients do not take the routes on trust. Each checks that the response succeeded and that the body carries the one field that makes it a reading — `days` for the pedometer, a boolean `isPlaying` for the disc — and falls to the dash on anything else, because a missing field is falsy and an unchecked body is how an outage gets printed as silence.

## The glyph matrix

One engine draws every dot field on the site: a matrix of cells with a spring apiece, a dot font, and a frame loop that stops itself. What a field says is the caller's business — it hands over a frame, and the field migrates to it.

| Field | Reports |
|---|---|
| The disc | The track playing, as dithered album artwork, with a ring struck on the playhead's period |
| The pedometer | Three faces of one field — the walk, the record, and the month |
| The forge | Nothing. It is the one field the visitor drives, on `/colophon` |

### The three faces

The pedometer is one field wearing three faces, turned by click or arrow key. The swipe went when the gesture moved off the canvas and onto the reading: the reading is a real button, so a press anywhere on it turns the page, and the arrows step both ways for anyone without a pointer.

| Face | Shows |
|---|---|
| The walk | A figure on a dotted path. It sets off from the start and walks to today's share of the goal, every time you turn to it — Law 4's "unless touched", since turning the page is what caused it |
| The record | Today's total and the seven-day average, set in the 3×5 dot alphabet, each under a mono label and its percentage |
| The month | A calendar of the month you are standing in — seven columns, six rows, day letters ruled along the bottom |

The calendar has four states, and each has to be told apart at a glance:

- **Ink** — `met`. The goal was made
- **`--miss` red** — `missed`. The day ran out of hours without meeting it
- **A mid-grey dot** — `quiet`. The day happened; nobody reported it
- **A small faint dot** — `ahead`. Not reached yet, and nothing to say about it

The last two both mean "unknown" and are still drawn differently, because a day that went by unrecorded and a day that has not happened are not the same admission, and drawing them alike would flatten the month.

The month face is a display, not a control. A day used to open a page of its own through an invisible target; inside the 96px face of the card this replaced, that target measured about 11px, and no keyboard could ever land on it. A 7×6 grid of 44px targets needs 308px square, which is more than the face is ever given, so the interaction was removed rather than shrunk. Every day of the month reaches a screen reader in words instead, which is more than the press ever gave one.

Today wears a pill. Today is never red: a day still being walked has not been missed, which is the same rule as an unreported day not being a day of no walking, applied to the one day still happening.

The pulse is arithmetic on playback position, not beat detection: Spotify answers 403 for the `audio-features` and `audio-analysis` endpoints for this application, so there is no tempo to be had. The colophon's Provenance section states this, along with what the dot language owes Nothing's interface and what it uses of theirs — none of their code, assets, or trademarks.

Steps come from a phone automation posting to a guarded route. Setup is documented at `docs/steps-setup.md`; until it is configured the reading degrades to placeholder dots, because a day nobody reported is not a day of no walking.

A glyph drawn in the forge is kept on the visitor's own device and never sent here. Only the fact that one was drawn is counted, once per browser.

## Token system

Semantic tokens only. Components never reference raw hex values; light and dark are variable swaps.

| Token | Light | Dark |
|---|---|---|
| `--bg` | #F2F2F2 | #0A0A0A |
| `--surface` | #FFFFFF | #161616 |
| `--surface-2` | #FBFBFB | #1F1F1F |
| `--border` | #DEDEDE | #2E2E2E |
| `--text-1` | #0F0F0F | #F5F5F5 |
| `--text-2` | #5C5C5C | #9A9A9A |
| `--text-3` | #7D7D7D | #6B6B6B |
| `--fill-strong` | #0F0F0F | #F5F5F5 |

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

`PAD_CLIENT_SALT` in `.env.local` is what makes the colophon's field writable locally; without it the pad renders and refuses every write. `docs/pad-setup.md` explains why it has no default.

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

Until art lands, a frame prints what is missing and the shape of the slot rather than collapsing. A piece with assets but no authored blocks falls back to one full frame per asset, in filename order.

## The dials, and why there are none

There was a dial rail on the colophon — theme, type scale, density — that rewrote the design tokens live and persisted the choice. Type and density are gone. The type dial multiplied the root font size, which overrode whatever text size the visitor had already set in their browser and offered them three steps of its own instead; the density dial shipped three spacings where the site only ever wanted one. `--pg-gap`, `--pad`, `--radius-window` and `--radius-tile` keep the values the middle step used and are fixed in `app/globals.css`; `--type-scale` is gone, and with it the rule that every size on the site had to be `rem`.

The light/dark control survives and moved to the nav, where it is reachable from every page rather than from one.

## The type scale

Six steps, every one of them used, and the same six as before. Three are fluid now, which they could not be while the dial existed.

| Step | 320px | 1280px and wider |
|---|---|---|
| `--text-2xs` | 9px | 9px |
| `--text-xs` | 11px | 11px |
| `--text-sm` | 13px | 13px |
| `--text-base` | 15px | 16px |
| `--text-lg` | 20px | 24px |
| `--text-xl` | 30px | 40px |

The small three are fixed on purpose: they carry captions, labels, years and counts, which are already at the floor of what is readable and get worse rather than better when they grow with the window. Every ramp stops at 1280px because the page's measure is `max-w-[1240px]` — type that keeps growing after the column has stopped is not more readable, only bigger.

Both ends of every `clamp()` are `rem`, and so is the leading term of the preferred value, so browser text size and zoom still reach them. Nothing is smaller at any width than it was on the fixed scale. `lib/type-scale.test.ts` holds the shape, and still forbids an ad-hoc size in any surface it governs — that was always a separate defect from the dial.

## Work model

One model in `data/work.ts`, and it is the whole hierarchy. Order on the page is the order of the
array; the number a product wears is its position, padded — so reordering the work is reordering one
list, and a piece is defined in exactly one place.

There used to be a `tier`, and before that a `project` and an `index` tier holding pieces with data,
live links and screenshots that rendered nowhere, waiting on an archive this site had already argued
itself out of building — along with a tile face, a palette strip, two filters nothing imported, and
six fields no surface read. Data kept for a surface that does not exist is not a plan; it is
furniture. The tier that survived that purge had only ever held one name, and two ways to say where
a piece belongs is one too many, so it went too. The era layer went last, and took `data/eras.ts`
with it: a grouping that spent two of its five sections saying it had nothing to show was the same
furniture one level up.

Work without written blocks renders its record and says so plainly instead of padding — the site does not pretend to depth it lacks.

The record rows inside an entry are the same `RecordRow` that `/about` and `/colophon` use, kept in
`components/ui.tsx` with the other primitives. Three surfaces once drew their own, and the case
page's was the one that disagreed — mono uppercase labels, values ranged right — which is why it
read as foreign rather than as under-designed. It was not the layout.

A product shows its title, one-liner and first two blocks, and holds the rest behind one full-width
bar that names what it opens:
`intro`, the record rows, `approach`, then the tail of the reel, all in one centred `34rem` column.
There is no rail and no second column — the home is a single column of products, and prose set
beside a reel needs somewhere to sit. The fold collapses with grid rows rather than `hidden`, so every word
stays crawlable and findable by cmd-F; that is the one thing retiring the case pages had to keep.

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

The page carries a 12×12 field anyone can draw on, a wall of the last forty drawings, and a flat list of the last thirty comments. It is the only place on the site a stranger may write to, and it is guarded accordingly: writes are rate-limited per visitor, text is capped server-side, and a secret-checked route can take any drawing or comment down. Nothing about a visitor is stored beyond what they typed and a salted hash of their address — see `docs/pad-setup.md` for the two environment variables it needs and how moderation works. It stores its lists in the Redis already attached to the project; no new store and no new dependency.

Nothing else on `/colophon` is a screenshot of the system. Token rows read their own live computed value — so the page cannot drift out of date with the stylesheet — and copy the hex on click. Type specimens are set, not shown: pick a weight, drag the size. The live readouts sit here too.

## The value field

The colophon carries one instrument beyond the specimens. Its scatter plots eight named landmarks on **weight × contrast**; the cursor blends the nearest of them by inverse-distance weighting and writes the result into `--body-weight`, `--text-2`, `--text-3`, and `--border`. Click commits. The blend holds across client-side navigation and resets on refresh.

The blending is left to CSS — each token becomes a `color-mix()` against `var(--bg)` and `var(--text-1)` — so switching skin under a held blend re-derives the ladder for free.

## Readouts

The site reports on itself with real data, so it is never identical twice.

| Readout | Source | Behaviour |
|---|---|---|
| Now playing | Spotify, refreshed every 30s | The dithered disc, third reading on the instrument wall |
| Build | `VERCEL_GIT_COMMIT_SHA` at build time | Version and short commit |

A third row counted dial turns, shared across every visitor through Upstash. It went with the dial and the count was not kept. The store adapter in `lib/counters.ts` stays: the steps card asks it whether a store is configured at all.

Now-playing is the dithered disc, a reading on the instrument wall at the foot of the home page. Not a halftone — dot size is constant and brightness carries the tone, the same way a shot arrives on the panel above. Album artwork is converted to grayscale and rendered as an ordered-dither dot field, which is what lets real artwork onto a site with no accent hue — dithering discards the colour rather than suppressing it, and what survives is the one thing the palette trades in.

| State | Disc |
|---|---|
| Silent | The dots hold the Spotify mark, rasterised into the same value grid the artwork uses |
| Playing | The dots migrate into the dithered album artwork, and back when it stops |
| Pointer inside | Dots displace with distance falloff and settle on a spring |
| Click | A ripple travels outward as a ring, striking dots as the front passes them |

The mark is drawn rather than shipped as an image, so it inherits the dot field exactly — it is not placed on the disc, it is what the disc is made of.

The frame loop runs while the pointer is inside, while dots are settling, while a value migration is in flight, or while a ripple is alive, and stops itself the moment all four are false.

Artwork is proxied through `/api/now-playing/art` so the canvas stays same-origin and `getImageData` keeps working. That route allowlists the Spotify CDN hosts — without it, it would be an open proxy.

The store degrades rather than fails. With nothing configured, `lib/counters.ts` returns null everywhere and the steps card falls back to the last reading it has rather than showing a zero.

Environment: `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`), plus `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`. Both Vercel projects share one Redis store so the two faces show one number.

## Status

Four surfaces. The home is the work: a hero statement, then three numbered products, each unfolding in place behind a full-width bar, and the instrument wall in the footer. Both skins are tuned against a measured contrast floor that `lib/contrast.test.ts` holds, type comes from one six-step scale, and Shots is a band mosaic. The version record is `data/changelog.ts`, rendered at `/changelog`.

Outstanding, and worth being exact about:

- **Two roles.** Endgame AI, ChessEver and HEX carry exact dates. SmallChess and an early-career role sit commented out in `data/experience.ts` — dates unknown, and the site does not invent them.
- **Frames.** Hitman's Library has nine real captures. Sylvan has two: its site is a single near-empty viewport. ChessEver has one, its existing hero — `chessever.com` answers automated requests with a bot check rather than the product, so its reel is labelled empty frames until real art lands.
- Shots are still captures of the live products and of portfolio-v1, standing in until real artwork is dropped into `public/feed`. The directory keeps its old name; only the surface was renamed.
- The handling layer from the 2026-08-13 spec — divider drag, tile reorder, reset — is still unbuilt.
