import Image from 'next/image';
import Link from 'next/link';
import { BrandMark, Wordmark } from '@/components/ui/Brand';
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
          and left a white strip under it on phones. Flex stretches. */}
      <div className="flex w-full flex-1 flex-col">
        <div className="grid flex-1 lg:grid-cols-[0.92fr_1.08fr]">
          {/* ------------------------------ Form side ------------------------------ */}
          <div
            className="relative flex flex-col p-6 sm:p-10 lg:p-14 xl:p-16"
            style={{
              background:
                'linear-gradient(155deg, #eef0ec 0%, #eceee9 38%, #f0e9d6 72%, #f2dfae 100%)',
            }}
          >
            {/* The brand as a masthead, centred over the form, rather than
                a small pill hiding in the corner. `BrandMark` + `Wordmark`
                rather than `BrandLock`, which is itself a link — a link
                inside a link is invalid markup. */}
            <header className="mx-auto w-full max-w-md text-center">
              <Link
                href="/"
                aria-label="Brave Homes — home"
                className="inline-flex min-h-[var(--bh-tap)] items-center gap-3.5 text-forest transition-opacity hover:opacity-80"
              >
                <BrandMark size={46} priority />
                <Wordmark className="text-[1.7rem]" />
              </Link>
              <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-sage-ink">
                {brand.tagline}
              </p>
            </header>

            <main id="main" className="flex flex-1 items-center py-8 lg:py-6">
              <div className="mx-auto w-full max-w-md">{children}</div>
            </main>

            <footer className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-x-6 text-sm text-ink-muted">
              <Link
                href="/privacy"
                className="inline-flex min-h-[var(--bh-tap)] items-center underline underline-offset-4 hover:text-forest"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-[var(--bh-tap)] items-center underline underline-offset-4 hover:text-forest"
              >
                Contact
              </Link>
            </footer>
          </div>

          {/* ------------------------------ Photo side ----------------------------- */}
          <div className="relative hidden lg:block">
            <div className="relative h-full overflow-hidden">
              <Image
                src="/auth-together.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 0px, 620px"
                className="object-cover"
                priority
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
