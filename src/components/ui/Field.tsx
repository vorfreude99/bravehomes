import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const CONTROL =
  'min-h-[var(--bh-tap)] w-full rounded-2xl border-2 border-sage/30 bg-parchment px-4 text-base text-forest outline-none transition placeholder:text-ink-muted/70 focus:border-sage disabled:opacity-60';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-semibold text-forest">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm font-semibold text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = '', ...rest }: ComponentPropsWithoutRef<'input'>) {
  return <input className={`${CONTROL} ${className}`} {...rest} />;
}

/**
 * An input with a leading symbol and optional trailing control.
 *
 * The symbol is decorative — the visible <label> carries the meaning.
 * "Big buttons, simple symbols" is the product's own promise, so the
 * glyph is sized to be recognisable, not tucked away.
 */
export function IconInput({
  icon,
  trailing,
  className = '',
  ...rest
}: ComponentPropsWithoutRef<'input'> & {
  icon: IconName;
  trailing?: ReactNode;
}) {
  return (
    <div className="field-shell group relative flex items-center rounded-2xl border-2 border-sage/30 bg-parchment transition-colors focus-within:border-sage">
      {/* Absolute, not in flow. In flow the symbol occupied the first
          ~37px of the field, and since it is `pointer-events-none` a
          click there passed straight through to the wrapper — which
          focuses nothing. A third of every field was dead to the mouse.
          Out of flow, the input itself covers that space. */}
      <span className="pointer-events-none absolute left-4 flex items-center text-olive/70">
        <Icon name={icon} size={19} />
      </span>
      <input
        className={`min-h-[var(--bh-tap)] w-full flex-1 bg-transparent py-2 pl-12 pr-3 text-base text-forest outline-none placeholder:text-ink-muted/70 disabled:opacity-60 ${className}`}
        {...rest}
      />
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
    </div>
  );
}

export function Textarea({
  className = '',
  ...rest
}: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={`${CONTROL} py-3 ${className}`} rows={4} {...rest} />;
}

/** Banner for form-level results. `tone` decides colour, not an icon alone. */
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  const styles = {
    info: 'border-sage/40 bg-sage-mist/40 text-forest',
    error: 'border-clay/40 bg-clay/10 text-clay',
    success: 'border-gold/50 bg-gold-soft/25 text-forest',
  }[tone];

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}
    >
      {children}
    </p>
  );
}
