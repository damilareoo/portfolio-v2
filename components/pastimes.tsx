import { Frame } from "@/components/frame";
import { pastimes as collection, type Pastime } from "@/data/site";

/**
 * The things he does away from the work, when there are any to show.
 *
 * The field is built and the content is not, which is deliberate: no such
 * images exist in the repo, so what ships today is the shape they will land in
 * rather than a set of frames apologising for being empty. An empty collection
 * renders **nothing** — not a heading, not a placeholder, not a caption saying
 * art is coming. `Frame` will happily print "Awaiting art" at whatever ratio it
 * is given, which is the right answer for a case study that is written but
 * unillustrated and the wrong one here: a visitor cannot tell a slot waiting on
 * a file from a slot the owner never intended to fill, and /about is finished
 * either way.
 *
 * The heading goes with the content rather than standing over an empty region,
 * which is why the early return is above it and not inside the grid.
 *
 * Going through `Frame` is what gives these the same 78svh cap and the same
 * hairline as every other picture on the site — a photograph of a chessboard
 * that could grow taller than the screen would be the one image on the site
 * that can, and the cap is not a per-surface decision.
 */
export function Pastimes({ items = collection }: { items?: readonly Pastime[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xs text-ink-2">Pastimes</h2>
      {/* One up on a phone, two across from `sm`. Deliberately not three: the
          frame cap is a share of the screen's *height*, so a third column buys
          width the picture is not allowed to spend and only prints it smaller.

          Columns rather than a grid, and the reason is the pictures. A grid row
          is as tall as the tallest thing in it, so one portrait beside one
          landscape leaves a third of a column empty — measured at 1440, a 340px
          hole under the shorter of the two. These are snapshots of a life, not
          a set of plates shot to one ratio, and the layout has to take whatever
          shape they are. Columns pack them by height instead. The cost is that
          reading order runs down a column rather than across, which is the
          right trade for a gallery and the wrong one for prose; the list is
          still in document order for anything that reads it aloud. */}
      <ul role="list" className="mt-4 list-none gap-6 sm:columns-2">
        {items.map((item) => (
          <li key={item.src} className="mb-8 break-inside-avoid last:mb-0">
            <Frame
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              ratio={item.ratio}
              sizes="(min-width: 640px) 44vw, 92vw"
            />
            {/* Under the picture, at the size every other caption on the site
                is set at. It says what the picture is of; it is not a title. */}
            <p className="mt-2.5 text-xs leading-[1.45] text-ink-3">{item.caption}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
