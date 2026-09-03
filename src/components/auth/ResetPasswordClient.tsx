'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, IconInput, Notice } from '@/components/ui/Field';

/**
 * Where the recovery email's link lands. The browser client exchanges
 * the code in the URL for a session on load; this component waits for
 * that session to exist before offering the new-password form, and
 * treats "no session appeared" as the link being used up or expired
 * rather than leaving someone typing into a form that can only fail.
 */
export function ResetPasswordClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setPhase('invalid');
      return;
    }

    let alive = true;
    const supabase = createClient();
    const startedAt = Date.now();

    // The code exchange happens asynchronously as the page loads, so a
    // single immediate getSession() can race it — poll briefly instead.
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!alive) return;

      if (session) {
        setPhase('ready');
        return;
      }
      if (Date.now() - startedAt > 8000) {
        setPhase('invalid');
        return;
      }
      setTimeout(() => void check(), 400);
    };

    void check();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Those passwords don’t match — try typing them again.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPhase('done');
      setTimeout(() => {
        router.push('/portal');
        router.refresh();
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'checking') {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          One second…
        </h1>
        <p className="mt-4 text-olive">Just checking your link.</p>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          That link has expired
        </h1>
        <p className="mt-4 leading-relaxed text-olive">
          Reset links only work once and don’t last forever. Ask for a
          fresh one and you’ll be sorted in a minute.
        </p>
        <Link
          href="/forgot-password"
          className="cta-sheen press mt-8 flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full bg-gold px-8 py-3.5 text-lg font-semibold text-forest-deep shadow-[0_10px_34px_-12px_rgba(201,154,63,0.8)] transition-colors hover:bg-gold-soft"
        >
          Send me a new link
        </Link>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          Password changed
        </h1>
        <p className="mt-4 text-olive">You’re signed in — taking you to the portal…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="stagger space-y-4">
      <div className="mb-7 text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
          Choose a new password
        </h1>
        <p className="mt-2 text-olive">Make it one you’ll remember — at least 6 characters.</p>
      </div>

      <Field label="New password" htmlFor="password">
        <IconInput
          id="password"
          icon="lock"
          name="new-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              className="inline-flex min-h-[var(--bh-tap)] items-center rounded-xl px-3 text-sm font-semibold text-olive hover:bg-sage-mist/60 hover:text-forest"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />
      </Field>

      <Field label="Type it again" htmlFor="confirm">
        <IconInput
          id="confirm"
          icon="lock"
          name="confirm-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
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
        {busy ? 'One moment…' : 'Save my new password'}
      </Button>
    </form>
  );
}
