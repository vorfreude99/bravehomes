'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, IconInput, Notice } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

type Mode = 'login' | 'signup';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/portal';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  // Computed once per mount so the greeting can't change mid-session.
  const hello = useMemo(greeting, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured) {
      setError('Sign-in is not connected yet. Add your Supabase keys to .env.local.');
      return;
    }

    setBusy(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (signUpError) throw signUpError;

        // With email confirmation on, there is no session yet — say so
        // plainly instead of bouncing the user to a guarded route.
        if (!data.session) {
          setInfo('Check your inbox to confirm your email, then sign in.');
          return;
        }

        // Seed the profile row the rest of the portal reads from.
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="rise-in space-y-4"
        style={{ animationDelay: '90ms' }}
      >
        <div className="mb-7 text-center">
          <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-olive [@media(max-height:720px)]:hidden">
            {isSignup
              ? 'Free to join, and it takes about a minute.'
              : `${hello}. Sign in to pick up your conversations.`}
          </p>
        </div>

        {isSignup && (
          <Field label="Your name" htmlFor="fullName">
            <IconInput
              id="fullName"
              icon="profile"
              name="name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jonas"
            />
          </Field>
        )}

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

        <Field
          label="Password"
          htmlFor="password"
          hint={isSignup ? 'At least 6 characters.' : undefined}
        >
          <IconInput
            id="password"
            icon="lock"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            trailing={
              // A real accessibility win for this audience: mistyping a
              // password you can't see is the commonest way people get
              // locked out of their own account.
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

        {error && <Notice tone="error">{error}</Notice>}
        {info && <Notice tone="success">{info}</Notice>}

        <Button type="submit" variant="gold" size="lg" className="mt-2 w-full" disabled={busy}>
          {busy ? 'One moment…' : isSignup ? 'Create my profile' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          {isSignup ? 'Already have an account? ' : 'New here? '}
          <Link
            href={isSignup ? '/login' : '/signup'}
            className="inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
          >
            {isSignup ? 'Sign in' : 'Create a profile'}
          </Link>
        </p>
      </form>

      <ul
        className="rise-in mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted [@media(max-height:700px)]:hidden"
        style={{ animationDelay: '260ms' }}
      >
        <li className="inline-flex items-center gap-1.5">
          <Icon name="check" size={14} className="text-sage-ink" />
          Free, always
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Icon name="check" size={14} className="text-sage-ink" />
          No ads, no data selling
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Icon name="check" size={14} className="text-sage-ink" />
          100% of donations to the cause
        </li>
      </ul>
    </div>
  );
}
