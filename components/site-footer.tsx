import { FooterLine } from "@/components/footer-line";
import { InstrumentWall } from "@/components/instrument-wall";

/**
 * The footer for the routes that do not write their own — and it is the same
 * footer the home page carries, because both are now the same two components:
 * the instrument wall edge to edge, then `FooterLine` beneath it. The pair used
 * to be assembled by hand at both ends and the two hands had already disagreed;
 * everything that could disagree lives in `components/footer-line.tsx` now.
 * Only the measure differs, and it differs because it must: the home footer
 * sits inside `main`'s own column and this one has to set its own.
 *
 * What went: the two-part row this used to end on — name and "Lagos, WAT" on
 * one side, links and a bordered version pill on the other. It was three
 * competing groups under four competing cards, which is the chaos the wall was
 * built to end. "Lagos, WAT" is now the wall's first reading, told by a clock;
 * saying it again in words is the echo this codebase keeps deleting.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <InstrumentWall />
      <FooterLine />
    </footer>
  );
}
