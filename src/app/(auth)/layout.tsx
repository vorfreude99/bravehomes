import Image from 'next/image';
import Link from 'next/link';
import { BrandMark, Wordmark } from '@/components/ui/Brand';
import { PhotoLife } from '@/components/auth/PhotoLife';
import { brand } from '@/lib/content';

/**
 * A single card floating on a muted ground: form on the left over a
 * grey-to-brass wash, photograph inset on the right with a few pieces of
 * the product laid over it.
 *
 * The panel is inset from the card edge rather than bleeding to it —
 * that inset is what makes the whole thing read as one object sitting on
 * the page instead of two halves of a screen.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col lg:h-svh lg:overflow-hidden">
      {/* `h-full` against a `min-h` parent has no definite height to
          resolve against, so the form column only grew to its content
          and left a white strip under it on phones. Flex stretches.

          `lg:min-h-0` on this wrapper AND the grid below: a flex/grid
          item's default automatic minimum size is its *content's*
          min-content size, not 0 — so even inside the `h-svh` root,
          every container in this chain was quietly growing to fit the
          form's full height instead of being held to the viewport,
          which meant the `overflow-y-auto` two levels down never had
          anything shorter than its content to actually scroll (its own
          `scrollHeight` and `clientHeight` were identical — nothing was
          overflowing *it*, the whole chain was just tall). `min-h-0`
          overrides that default so the outer `h-svh` height genuinely
          propagates down and gives that column something to scroll. */}
      <div className="flex w-full flex-1 flex-col lg:min-h-0">
        <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[0.92fr_1.08fr]">
          {/* ------------------------------ Form side ------------------------------ */}
          {/* `lg:overflow-y-auto`: the outer page is pinned to one screen
              height with no scroll at `lg` (see the ken-burns photo panel
              opposite, which wants to fill exactly one viewport) — fine
              on a tall monitor, but on an ordinary 1366×768 laptop this
              column's own content (name/age/email/password/submit) is
              taller than that, and the submit button was simply clipped
              off the bottom with no way to reach it. Scrolling within
              this column specifically, rather than the whole page, keeps
              the photo side pinned while nothing on the form side is
              ever unreachable. */}
          <div
            className="bg-breathe panel-in-left relative flex flex-col p-6 sm:p-10 lg:min-h-0 lg:overflow-y-auto lg:p-14 xl:p-16"
            style={{
              background:
                'linear-gradient(155deg, #eef0ec 0%, #eceee9 38%, #f0e9d6 72%, #f2dfae 100%)',
            }}
          >
            {/* The brand as a masthead, centred over the form, rather than
                a small pill hiding in the corner. `BrandMark` + `Wordmark`
                rather than `BrandLock`, which is itself a link — a link
                inside a link is invalid markup. */}
            <header className="rise-in mx-auto w-full max-w-md text-center">
              <Link
                href="/"
                aria-label="Brave Homes — home"
                className="inline-flex min-h-[var(--bh-tap)] items-center gap-3.5 text-forest transition-opacity hover:opacity-80"
              >
                <span className="brand-beat">
                  <BrandMark size={46} priority />
                </span>
                <Wordmark className="text-[1.7rem]" />
              </Link>
              <p
                className="rise-in mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-sage-ink [@media(max-height:820px)]:hidden"
                style={{ animationDelay: '250ms' }}
              >
                {brand.tagline}
              </p>
            </header>

            <main
              id="main"
              className="flex flex-1 items-center py-8 lg:py-6 [@media(max-height:820px)]:py-2"
            >
              <div className="mx-auto w-full max-w-md">{children}</div>
            </main>

            {/* Reachable from the site's own header/footer everywhere
                else — dropped here first as space runs out, rather than
                the form itself. */}
            <footer className="mx-auto flex w-full max-w-md justify-center text-sm text-ink-muted [@media(max-height:820px)]:hidden">
              <Link
                href="/contact"
                className="inline-flex min-h-[var(--bh-tap)] items-center underline underline-offset-4 hover:text-forest"
              >
                Contact
              </Link>
            </footer>
          </div>

          {/* ------------------------------ Photo side ----------------------------- */}
          {/* Desktop-only. A mobile version of this was tried — a capped-
              height banner above the form — but no crop of a photo shot
              for a tall side panel read well squeezed into a short wide
              strip, so it's gone rather than kept half-working. */}
          <div className="relative hidden lg:block">
            <div className="photo-unveil relative h-full overflow-hidden">
              <Image
                src="/auth-together.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 0px, 620px"
                className="kenburns-in object-cover"
                priority
              />

              <PhotoLife />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
