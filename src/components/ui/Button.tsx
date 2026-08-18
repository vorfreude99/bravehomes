import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'onDark';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-forest text-cream hover:bg-forest-deep shadow-[0_10px_30px_-12px_rgba(47,58,35,0.6)]',
  secondary:
    'bg-parchment text-forest border border-sage/40 hover:border-forest hover:bg-cream-deep',
  ghost: 'text-olive hover:bg-sage-mist/60 hover:text-forest',
  gold: 'bg-gold text-forest-deep hover:bg-gold-soft shadow-[0_10px_34px_-12px_rgba(201,154,63,0.8)]',
  /** For use over photography or the forest panels. */
  onDark:
    'border border-cream/35 bg-cream/10 text-cream backdrop-blur hover:bg-cream/20',
};

const SIZES: Record<Size, string> = {
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

/**
 * Every target is at least --bh-tap tall, which Simple Mode grows.
 * That single rule is what makes the product usable at 88.
 */
const BASE =
  'inline-flex min-h-[var(--bh-tap)] items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55';

function classes(variant: Variant, size: Size, className: string) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Eyebrow({
  children,
  tone = 'sage',
}: {
  children: ReactNode;
  tone?: 'sage' | 'gold';
}) {
  return (
    <p
      className={`text-xs font-bold tracking-[0.25em] ${
        tone === 'gold' ? 'text-gold-ink' : 'text-sage-ink'
      }`}
    >
      {children}
    </p>
  );
}
