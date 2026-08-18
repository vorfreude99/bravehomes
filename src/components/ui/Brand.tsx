import Link from 'next/link';
import Image from 'next/image';

/** Intrinsic ratio of public/logo-icon.png — the mark is slightly wide. */
const LOGO_RATIO = 1600 / 1391;

/**
 * The Brave Homes mark: the house holding two figures and a gold heart.
 *
 * Served from the transparent PNG rather than the supplied JPEG — the
 * original sits on an opaque near-white plate, which shows as a pale box
 * against the cream page. `scripts/build-logo.mjs` regenerates it.
 *
 * `size` is the rendered height; width follows the artwork's ratio.
 */
export function BrandMark({
  size = 44,
  priority = false,
  light = false,
}: {
  size?: number;
  priority?: boolean;
  /** Knock the mark out to solid white for dark backgrounds. */
  light?: boolean;
}) {
  const width = Math.round(size * LOGO_RATIO);

  return (
    <Image
      src="/logo-icon.png"
      // The wordmark beside it carries the name, and BrandLock labels the
      // link — announcing "Brave Homes" a third time helps nobody.
      alt=""
      width={width}
      height={size}
      priority={priority}
      // brightness(0) flattens the artwork to black, invert() lifts it to
      // white — the forest-green mark is invisible on a dark photograph.
      className={`shrink-0 transition-[filter] duration-300 ${
        light ? '[filter:brightness(0)_invert(1)]' : ''
      }`}
      style={{ height: size, width }}
    />
  );
}

export function Wordmark({
  className = '',
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span className={`font-serif font-medium tracking-tight ${className}`}>
      <span className={light ? 'text-cream' : 'text-forest'}>Brave</span>
      <span className={light ? 'text-sage-soft' : 'text-sage-ink'}>Homes</span>
    </span>
  );
}

export function BrandLock({
  href = '/',
  size = 44,
  showTagline = true,
  priority = false,
  light = false,
}: {
  href?: string;
  size?: number;
  showTagline?: boolean;
  /** Set on the header lock so the mark isn't lazy-loaded above the fold. */
  priority?: boolean;
  /** Light treatment for use over dark photography. */
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[var(--bh-tap)] items-center gap-3"
      aria-label="Brave Homes — home"
    >
      <BrandMark size={size} priority={priority} light={light} />
      <span className="flex flex-col leading-none">
        <Wordmark className="text-xl sm:text-2xl" light={light} />
        {showTagline && (
          <span
            className={`mt-1 hidden text-[0.62rem] font-semibold tracking-[0.22em] sm:block ${
              light ? 'text-cream/70' : 'text-olive/70'
            }`}
          >
            CONNECTING GENERATIONS
          </span>
        )}
      </span>
    </Link>
  );
}
