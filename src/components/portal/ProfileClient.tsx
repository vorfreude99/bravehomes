'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead, useSessionUser } from './PortalShell';
import { Button } from '@/components/ui/Button';
import { Field, Input, Notice, Textarea } from '@/components/ui/Field';
import { SimpleModeToggle } from '@/components/SettingsProvider';
import { createClient } from '@/lib/supabase/client';
import { avatarsAvailable, getProfile, uploadAvatar, upsertProfile } from '@/lib/db';

const SUGGESTED = [
  'Gardening',
  'Cooking',
  'Football',
  'Chess',
  'Music',
  'History',
  'Walking',
  'Books',
  'Films',
  'Languages',
];

export function ProfileClient() {
  const me = useSessionUser();
  const router = useRouter();

  const [fullName, setFullName] = useState(me.name);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarsOn, setAvatarsOn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null,
  );

  async function onPickPhoto(file: File) {
    setUploading(true);
    const { url, error: upError } = await uploadAvatar(me.id, file);
    setUploading(false);
    if (upError || !url) {
      setResult({ tone: 'error', text: 'That photo did not upload. Try a smaller one.' });
      return;
    }
    setResult({ tone: 'success', text: 'Photo saved.' });
    setAvatar(url);
  }

  useEffect(() => {
    let alive = true;

    void (async () => {
      const profile = await getProfile(me.id);
      if (!alive) return;

      if (profile) {
        setFullName(profile.full_name ?? me.name);
        setAge(profile.age != null ? String(profile.age) : '');
        setCity(profile.city ?? '');
        setBio(profile.bio ?? '');
        setInterests(profile.interests ?? []);
        setAvatar(profile.avatar_url ?? null);
      }
      // Hide the uploader rather than offer one that always errors.
      setAvatarsOn(await avatarsAvailable());
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [me.id, me.name]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);

    const parsedAge = Number.parseInt(age, 10);

    const { error } = await upsertProfile(me.id, {
      email: me.email,
      full_name: fullName.trim(),
      age: Number.isFinite(parsedAge) ? parsedAge : null,
      city: city.trim() || null,
      bio: bio.trim() || null,
      interests,
    });

    setSaving(false);
    setResult(
      error
        ? { tone: 'error', text: `We couldn’t save that: ${error.message}` }
        : { tone: 'success', text: 'Saved. Your profile is up to date.' },
    );
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <PageHead
        title="Your profile"
        subtitle="This is what other people see. A little detail makes it far easier for someone to start talking to you."
      />

      <div className="grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <form onSubmit={onSave} className="space-y-6">
          {/* Photo first: it is the thing that makes a stranger feel like
              a person, and the one field people most expect to see. */}
          {avatarsOn && (
            <div className="flex items-center gap-5">
              <span className="relative flex h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sage-mist">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-forest">
                    {(fullName || me.name).charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <div>
                <label className="inline-flex min-h-[var(--bh-tap)] cursor-pointer items-center rounded-full border-2 border-sage/40 px-5 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60">
                  {uploading ? 'Uploading…' : avatar ? 'Change photo' : 'Add a photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onPickPhoto(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <p className="mt-2 text-sm text-ink-muted">
                  A face makes it much easier for someone to say hello.
                </p>
              </div>
            </div>
          )}

          <Field label="Your name" htmlFor="fullName">
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Age" htmlFor="age" hint="Optional — it helps people say hello.">
              <Input
                id="age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="78"
                disabled={loading}
              />
            </Field>

            <Field label="City" htmlFor="city" hint="So you can meet for coffee.">
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Manchester"
                disabled={loading}
              />
            </Field>
          </div>

          <Field
            label="A little about you"
            htmlFor="bio"
            hint="A sentence or two is plenty."
          >
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I kept a garden for forty years and I still make the best Sunday roast on the street."
              disabled={loading}
            />
          </Field>

          <fieldset>
            <legend className="mb-2 font-semibold text-forest">
              What do you like talking about?
            </legend>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((interest) => {
                const active = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    className={`min-h-[var(--bh-tap)] rounded-full border-2 px-5 font-semibold transition ${
                      active
                        ? 'border-sage bg-sage-mist/70 text-forest'
                        : 'border-sage/30 bg-parchment text-olive hover:border-sage'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {result && <Notice tone={result.tone}>{result.text}</Notice>}

          <Button type="submit" size="lg" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save my profile'}
          </Button>
        </form>

        {/* Preview + account */}
        <div className="space-y-6">
          <section className="card-solid p-6">
            <h2 className="text-sm font-bold tracking-[0.2em] text-sage">
              HOW OTHERS SEE YOU
            </h2>

            <div className="mt-5 flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-mist text-2xl font-bold text-forest">
                {(fullName || me.name).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-serif text-2xl font-medium text-forest">
                  {fullName || me.name}
                  {age ? `, ${age}` : ''}
                </p>
                {city && <p className="text-sm text-ink-muted">{city}</p>}
              </div>
            </div>

            {bio && <p className="mt-4 leading-relaxed text-olive">{bio}</p>}

            {interests.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {interests.map((i) => (
                  <li
                    key={i}
                    className="rounded-full bg-cream-deep px-3 py-1 text-sm text-olive"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-solid p-6">
            <h2 className="font-serif text-xl font-medium text-forest">
              Making things easier to see
            </h2>
            <p className="mt-2 text-olive">
              Easy view makes every button and every word bigger, and turns off
              background movement.
            </p>
            <SimpleModeToggle className="mt-4 w-full justify-center" />
          </section>

          <section className="card-solid p-6">
            <h2 className="font-serif text-xl font-medium text-forest">Account</h2>
            <p className="mt-2 break-words text-olive">{me.email}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={signOut}>
              Sign out
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
