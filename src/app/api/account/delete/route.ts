import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb } from '@/lib/stripe';

/**
 * Deletes the signed-in member's account, completely.
 *
 * `profiles`, `messages` and `pledges` all reference `auth.users` with
 * `on delete cascade`, so removing the auth user removes every row that
 * belongs to them in one step — no separate table-by-table cleanup to
 * keep in sync as the schema grows. Deleting the auth user requires the
 * service-role key (the anon client has no permission to do this, by
 * design), so this only ever runs server-side, and only for whoever the
 * request's own session says they are — nobody can pass another
 * person's id here.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const db = adminDb();

  // Best-effort: cascades clean up the database, but storage objects
  // aren't foreign-keyed to anything, so a photo or a voice note would
  // otherwise sit there forever with no row left pointing at it. Both
  // buckets key files under `<user id>/…`, so this is a plain prefix
  // listing — failures here are logged, never allowed to block the
  // account deletion itself.
  //
  // `list()` pages at 100 by default — someone with more than that many
  // voice notes would otherwise keep everything past the first page
  // sitting in storage after "deletion", so this pages through until a
  // partial page confirms there's nothing left.
  const PAGE_SIZE = 100;
  for (const bucket of ['avatars', 'voice-messages']) {
    try {
      let offset = 0;
      for (;;) {
        const { data: files } = await db.storage
          .from(bucket)
          .list(user.id, { limit: PAGE_SIZE, offset });
        if (!files?.length) break;
        await db.storage
          .from(bucket)
          .remove(files.map((f) => `${user.id}/${f.name}`));
        if (files.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
    } catch (err) {
      console.error(`Could not clear ${bucket} for ${user.id}:`, err);
    }
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
