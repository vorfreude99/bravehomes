'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, IconInput, Notice } from '@/components/ui/Field';

/**
 * Asks Supabase to email a password-recovery link that lands on
 * /reset-password. The success copy is the same whether or not the
 * address has an account — this form must not be a way to test which
 * emails are registered here.
 */
export function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError('Sign-in is not connected yet. Add your Supabase keys to .env.local.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      // Even a failure gets the neutral message — see the doc comment.
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          Check your inbox
        </h1>
        <p className="mt-4 leading-relaxed text-olive">
          If there’s an account for <strong className="text-forest">{email}</strong>,
          a link to choose a new password is on its way. It can take a
          minute — and it’s worth a glance at the junk folder.
        </p>
        <Link
          href="/login"
          className="press mt-8 flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full border-2 border-sage/40 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="stagger space-y-4">
      <div className="mb-7 text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          Forgot your password?
        </h1>
        <p className="mt-2 text-olive">
          No worries — it happens to everyone. Tell us your email and
          we’ll send you a link to choose a new one.
        </p>
      </div>

      <Field label="Email" htmlFor="email">
        <IconInput
          id="email"
          icon="mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      {error && <Notice tone="error">{error}</Notice>}

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="cta-sheen press mt-2 w-full"
        disabled={busy}
      >
        {busy ? 'One moment…' : 'Email me a link'}
      </Button>

      <Link
        href="/login"
        className="press flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full border-2 border-sage/40 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60"
      >
        Back to sign in
      </Link>
    </form>
  );
}
