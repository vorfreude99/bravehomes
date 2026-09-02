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

/**
 * The 20s cap on every Supabase request (see `lib/supabase/client.ts`)
 * surfaces as whatever the *library* calls it, not our own error — and
 * supabase-js re-wraps the raw `AbortSignal.timeout` rejection into its
 * own error class, dropping the `TimeoutError`/`AbortError` name in the
 * process and leaving only wording like "signal timed out" in `message`.
 * So this checks the message text too, not just the name — the only way
 * to still recognise it as a timeout once the library's rewritten it.
 */
function describeAuthError(err: unknown): string {
  // `DOMException` (what a raw `AbortSignal.timeout` rejects with) doesn't
  // extend `Error` in every environment, so both need checking directly.
  const e = err instanceof Error || err instanceof DOMException ? err : null;
  const name = e?.name ?? '';
  const message = e?.message ?? '';
  const timedOut =
    name === 'TimeoutError' || name === 'AbortError' || /abort|timed? ?out/i.test(message);

  if (timedOut) return "That's taking too long. Check your connection and try again.";
  return message || 'Something went wrong. Try again.';
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/portal';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
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
        const parsedAge = Number.parseInt(age, 10);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          // Age rides along in the auth metadata too, so the database
          // trigger can seed it even when the user has to confirm their
          // email before this page can write anything.
          options: { data: { full_name: fullName, age: parsedAge } },
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
            age: Number.isFinite(parsedAge) ? parsedAge : null,
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
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="stagger space-y-4 [@media(max-height:820px)]:space-y-2"
      >
        <div className="mb-7 text-center [@media(max-height:820px)]:mb-2">
          <h1 className="font-serif text-3xl font-medium leading-[1.1] text-forest sm:text-4xl [@media(max-height:820px)]:text-2xl">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-olive [@media(max-height:820px)]:hidden">
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

        {isSignup && (
          <Field
            label="Your age"
            htmlFor="age"
            hint="This is how we introduce the generations to each other."
          >
            <IconInput
              id="age"
              icon="heart"
              name="age"
              inputMode="numeric"
              required
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="72"
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

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="cta-sheen press mt-2 w-full [@media(max-height:820px)]:px-6 [@media(max-height:820px)]:py-2 [@media(max-height:820px)]:text-base"
          disabled={busy}
        >
          {busy ? (
            <span>
              One moment
              <span className="dot-bounce">.</span>
              <span className="dot-bounce">.</span>
              <span className="dot-bounce">.</span>
            </span>
          ) : isSignup ? (
            'Create my profile'
          ) : (
            'Sign in'
          )}
        </Button>

        {isSignup && (
          <p className="mt-3 text-center text-sm leading-relaxed text-olive">
            By creating a profile you confirm you are 18 or over and agree to
            our{' '}
            <Link href="/terms" className="font-semibold text-forest underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-forest underline">
              Privacy Policy
            </Link>
            .
          </p>
        )}

        <div className="mt-4 space-y-2 [@media(max-height:820px)]:mt-2">
          <p className="text-center text-sm text-olive [@media(max-height:820px)]:hidden">
            {isSignup ? 'Already have an account?' : 'New here?'}
          </p>
          {/* A proper button, not small print — half the people using
              this page will be doing it with reading glasses off. */}
          <Link
            href={isSignup ? '/login' : '/signup'}
            className="press flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full border-2 border-sage/40 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60"
          >
            {isSignup ? 'Back to sign in' : 'Create a profile'}
          </Link>
        </div>
      </form>

      <ul
        className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted [@media(max-height:820px)]:hidden"
      >
        <li className="pop-in inline-flex items-center gap-1.5" style={{ animationDelay: '700ms' }}>
          <Icon name="check" size={14} className="text-sage-ink" />
          Free, always
        </li>
        <li className="pop-in inline-flex items-center gap-1.5" style={{ animationDelay: '850ms' }}>
          <Icon name="check" size={14} className="text-sage-ink" />
          No ads, no data selling
        </li>
        <li className="pop-in inline-flex items-center gap-1.5" style={{ animationDelay: '1000ms' }}>
          <Icon name="check" size={14} className="text-sage-ink" />
          100% of donations to the cause
        </li>
      </ul>
    </div>
  );
}
