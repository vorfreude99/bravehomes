'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead, useSessionUser } from './PortalShell';
import { createClient } from '@/lib/supabase/client';
import { avatarsAvailable, getProfile, uploadAvatar, upsertProfile } from '@/lib/db';
import { CityField } from './CityField';

const YELLOW = '#f5d64e';

/** One input style for the whole page, in the dashboard's ink palette. */
const CONTROL =
  'min-h-[var(--bh-tap)] w-full rounded-2xl border-2 border-[#1a1a1a]/10 bg-white px-4 text-base text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#1a1a1a]/45 disabled:opacity-60';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/50">
      {children}
    </p>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-[#1a1a1a]">
      {children}
    </label>
  );
}

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
  const [customInterest, setCustomInterest] = useState('');

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

  function addInterest(raw: string) {
    const value = raw.trim();
    if (!value) return;
    // Case-insensitive so typing "gardening" doesn't sit next to the
    // suggested "Gardening" as a separate, duplicate chip.
    setInterests((prev) =>
      prev.some((i) => i.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value],
    );
  }

  function removeInterest(interest: string) {
    setInterests((prev) => prev.filter((i) => i !== interest));
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
        : { tone: 'success', text: 'Saved. Your card is up to date.' },
    );
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleting(false);
      setDeleteError(body.error || 'Something went wrong. Please try again.');
      return;
    }

    // The account is already gone server-side; this just clears the
    // browser's own copy of a session token that no longer means anything.
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <PageHead
        title="This card is you"
        subtitle="It’s what people see before they say hello. The fuller it feels, the sooner somebody will."
      />

      <div className="grid items-start gap-4 px-5 pb-10 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ------------------------------ the card ------------------------------
            The preview is the hero, not a sidebar afterthought: you are
            literally editing the card someone else will be handed. It
            updates with every keystroke, and sticks while you scroll. */}
        <section
          className="overflow-hidden rounded-[2rem] text-white lg:sticky lg:top-6"
          style={{ background: '#1a1a1a' }}
          aria-label="How others see you"
        >
          <div className="relative aspect-[4/3] w-full">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: YELLOW }}
              >
                <span className="text-8xl font-bold text-[#1a1a1a]">
                  {(fullName || me.name).charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <span className="absolute left-5 top-5 rounded-full bg-[#1a1a1a]/70 px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              How others see you
            </span>

            {avatarsOn && (
              <label className="absolute bottom-4 right-4 inline-flex min-h-[var(--bh-tap)] cursor-pointer items-center rounded-full bg-white/95 px-5 font-semibold text-[#1a1a1a] shadow-lg transition-transform hover:scale-[1.03]">
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
            )}
          </div>

          <div className="p-6 sm:p-7">
            <p className="text-3xl font-medium tracking-tight">
              {fullName || me.name}
              {age ? `, ${age}` : ''}
            </p>
            <p className="mt-1 text-white/55">{city || 'Somewhere in the UK'}</p>

            {bio ? (
              <p className="mt-4 leading-relaxed text-white/75">{bio}</p>
            ) : (
              <p className="mt-4 text-sm text-white/40">
                Add a line about yourself and it will appear here, word for word.
              </p>
            )}

            {interests.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {interests.map((i) => (
                  <li
                    key={i}
                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[#1a1a1a]"
                    style={{ background: YELLOW }}
                  >
                    {i}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* -------------------------------- form ------------------------------- */}
        <div className="space-y-4">
          <form onSubmit={onSave} className="rounded-[2rem] bg-white/75 p-6 sm:p-8">
            <SectionLabel>The basics</SectionLabel>

            <div className="mt-4">
              <Label htmlFor="fullName">Your name</Label>
              <input
                id="fullName"
                className={CONTROL}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="age">Age</Label>
                <input
                  id="age"
                  className={CONTROL}
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="78"
                  disabled={loading}
                />
                <p className="mt-1.5 text-sm text-[#1a1a1a]/50">
                  Optional — it helps people say hello.
                </p>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <CityField
                  id="city"
                  className={CONTROL}
                  value={city}
                  onChange={setCity}
                  disabled={loading}
                />
                <p className="mt-1.5 text-sm text-[#1a1a1a]/50">
                  So you can meet for coffee.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>In your own words</SectionLabel>
              <div className="mt-4">
                <Label htmlFor="bio">A little about you</Label>
                <textarea
                  id="bio"
                  className={`${CONTROL} py-3`}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I kept a garden for forty years and I still make the best Sunday roast on the street."
                  disabled={loading}
                />
                <p className="mt-1.5 text-sm text-[#1a1a1a]/50">
                  A sentence or two is plenty. This is the line that starts
                  conversations.
                </p>
              </div>
            </div>

            <fieldset className="mt-8">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/50">
                Interests
              </legend>

              {/* Whatever's actually on the card, each removable — the
                  place a custom, typed-in interest shows up and can be
                  taken back off, not just the suggested ones below. */}
              {interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="inline-flex min-h-[var(--bh-tap)] items-center gap-2 rounded-full px-5 font-semibold text-[#1a1a1a]"
                      style={{ background: YELLOW }}
                    >
                      {interest}
                      <span aria-hidden="true" className="text-[#1a1a1a]/50">
                        ×
                      </span>
                      <span className="sr-only">Remove {interest}</span>
                    </button>
                  ))}
                </div>
              )}

              {SUGGESTED.some((s) => !interests.includes(s)) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTED.filter((s) => !interests.includes(s)).map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => addInterest(interest)}
                      className="min-h-[var(--bh-tap)] rounded-full bg-[#1a1a1a]/[0.05] px-5 font-semibold text-[#1a1a1a]/75 transition-all hover:bg-[#1a1a1a]/[0.1]"
                    >
                      + {interest}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    addInterest(customInterest);
                    setCustomInterest('');
                  }}
                  placeholder="Add your own…"
                  maxLength={30}
                  className={CONTROL}
                />
                <button
                  type="button"
                  onClick={() => {
                    addInterest(customInterest);
                    setCustomInterest('');
                  }}
                  disabled={!customInterest.trim()}
                  className="min-h-[var(--bh-tap)] shrink-0 rounded-full bg-[#1a1a1a]/[0.05] px-6 font-semibold text-[#1a1a1a] transition-all hover:bg-[#1a1a1a]/[0.1] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </fieldset>

            {result && (
              <p
                role={result.tone === 'error' ? 'alert' : 'status'}
                className="mt-6 rounded-2xl px-4 py-3 text-sm font-medium"
                style={
                  result.tone === 'success'
                    ? {
                        background: 'rgba(245,214,78,0.3)',
                        border: `1px solid ${YELLOW}`,
                        color: '#1a1a1a',
                      }
                    : {
                        background: 'rgba(179,64,47,0.08)',
                        border: '1px solid rgba(179,64,47,0.4)',
                        color: '#8f3325',
                      }
                }
              >
                {result.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-[#1a1a1a] text-lg font-semibold text-white transition-all enabled:hover:scale-[1.01] enabled:hover:bg-black disabled:opacity-40 sm:w-auto sm:px-10"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <div className="grid gap-4">
            <section className="rounded-[1.75rem] bg-white/75 p-6">
              <h2 className="font-semibold text-[#1a1a1a]">Account</h2>
              <p className="mt-2 break-words text-sm text-[#1a1a1a]/65">{me.email}</p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="press mt-4 flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full bg-[#b3402f] font-semibold text-white transition-colors hover:bg-[#93331f]"
              >
                Sign out
              </button>
            </section>

            {/* Deliberately quieter than Sign out — this is the one
                action on the page that cannot be undone, so it should
                take a real decision to reach, not a stray tap. */}
            <section className="rounded-[1.75rem] bg-white/75 p-6">
              {!confirmingDelete ? (
                <>
                  <h2 className="font-semibold text-[#1a1a1a]">Delete account</h2>
                  <p className="mt-2 text-sm text-[#1a1a1a]/55">
                    Permanently remove your profile, messages, photos and
                    giving history.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="mt-3 text-sm font-semibold text-[#b3402f] underline underline-offset-4 hover:text-[#93331f]"
                  >
                    Delete my account
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-[#1a1a1a]">Are you sure?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/65">
                    This deletes your profile, every conversation, your
                    photos and your giving history for good.
                  </p>

                  {deleteError && (
                    <p
                      role="alert"
                      className="mt-3 rounded-2xl px-4 py-3 text-sm font-medium"
                      style={{
                        background: 'rgba(179,64,47,0.08)',
                        border: '1px solid rgba(179,64,47,0.4)',
                        color: '#8f3325',
                      }}
                    >
                      {deleteError}
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void deleteAccount()}
                      disabled={deleting}
                      className="press flex min-h-[var(--bh-tap)] flex-1 items-center justify-center rounded-full bg-[#b3402f] font-semibold text-white transition-colors hover:bg-[#93331f] disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete my account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeleteError(null);
                      }}
                      disabled={deleting}
                      className="flex min-h-[var(--bh-tap)] flex-1 items-center justify-center rounded-full border-2 border-[#1a1a1a]/15 font-semibold text-[#1a1a1a] transition-colors hover:border-[#1a1a1a] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
