import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminDb } from '@/lib/stripe';
import { currency } from '@/lib/content';

export const metadata: Metadata = { title: 'Admin' };

const YELLOW = '#f5d64e';

type PledgeRow = {
  user_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  refunded_amount: number | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  age: number | null;
  is_admin: boolean | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Everything, for the one person running this charity — not for members.
 *
 * Gated server-side, twice over: first by re-checking `is_admin` with
 * the signed-in user's own session (so RLS still applies to that one
 * read — this is real password-based access, the same email+password
 * sign-in as the rest of the site, just behind an extra flag nobody can
 * set on themselves from the browser), and only then by reaching for the
 * service-role key to read every member and every pledge. `profiles` and
 * `pledges` both have RLS policies that stop an ordinary session from
 * reading anyone else's rows, so an ordinary member's session could not
 * load this even if they guessed the URL.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (me?.is_admin !== true) notFound();

  const db = adminDb();
  const [{ data: pledges }, { data: profiles }, { count: messageCount }, authUsers] =
    await Promise.all([
      db
        .from('pledges')
        .select('user_id, amount, status, paid_at, created_at, refunded_amount')
        .order('created_at', { ascending: false }),
      db
        .from('profiles')
        .select('id, full_name, email, city, age, is_admin'),
      db.from('messages').select('id', { count: 'exact', head: true }),
      db.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const pledgeRows = (pledges ?? []) as PledgeRow[];
  const profileRows = (profiles ?? []) as ProfileRow[];
  const joinedAt = new Map(
    (authUsers.data?.users ?? []).map((u) => [u.id, u.created_at as string]),
  );

  const members = profileRows
    .map((p) => ({ ...p, joined: joinedAt.get(p.id) ?? null }))
    .sort((a, b) => (b.joined ?? '').localeCompare(a.joined ?? ''));

  // A partially-refunded gift stays `status: 'paid'` (some of it truly
  // arrived) with `refunded_amount` set — every total here subtracts
  // that back out, so "Total raised" reflects what's actually left, not
  // what a gift first looked like before some of it went back.
  const paid = pledgeRows.filter((r) => r.status === 'paid');
  const totalRaised = paid.reduce((sum, r) => sum + r.amount - (r.refunded_amount ?? 0), 0);
  const pending = pledgeRows.filter((r) => r.status === 'intent').length;
  const refundedTotal = pledgeRows.reduce((sum, r) => sum + (r.refunded_amount ?? 0), 0);
  const refundedCount = pledgeRows.filter((r) => (r.refunded_amount ?? 0) > 0).length;

  const byDonor = new Map<
    string,
    { total: number; count: number; lastPaid: string | null }
  >();
  for (const r of paid) {
    const entry = byDonor.get(r.user_id) ?? { total: 0, count: 0, lastPaid: null };
    entry.total += r.amount - (r.refunded_amount ?? 0);
    entry.count += 1;
    if (!entry.lastPaid || (r.paid_at ?? '') > entry.lastPaid) entry.lastPaid = r.paid_at;
    byDonor.set(r.user_id, entry);
  }
  const peopleById = new Map(profileRows.map((p) => [p.id, p]));
  const donors = [...byDonor.entries()]
    .map(([userId, stats]) => ({ userId, ...stats, person: peopleById.get(userId) }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="px-5 pb-12 sm:px-8">
      <div className="pb-6 pt-1">
        <h1 className="text-3xl font-medium tracking-tight text-[#1a1a1a] sm:text-4xl">
          Admin
        </h1>
        <p className="mt-2 max-w-2xl text-[#1a1a1a]/70">
          Only you can see this page. Every figure below is read live from
          the database.
        </p>
      </div>

      {/* --------------------------------- stats --------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-[1.75rem] bg-[#1a1a1a] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            Total raised
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight">
            {currency.format(totalRaised)}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-white/75 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
            Members
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
            {members.length}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-white/75 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
            Messages sent
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
            {messageCount ?? 0}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-white/75 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
            Donors
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
            {donors.length}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-white/75 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
            Pending / abandoned
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
            {pending}
          </p>
        </div>
        {/* Kept visible rather than just quietly missing from "Total
            raised" — a refund should read as accounted for, not erased. */}
        <div className="rounded-[1.75rem] bg-white/75 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
            Refunded
          </p>
          <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
            {currency.format(refundedTotal)}
          </p>
          {refundedCount > 0 && (
            <p className="mt-1 text-xs text-[#1a1a1a]/45">
              {refundedCount} {refundedCount === 1 ? 'gift' : 'gifts'}
            </p>
          )}
        </div>
      </div>

      {/* -------------------------------- members -------------------------------- */}
      <section className="mt-4 rounded-[1.75rem] bg-white/75 p-6 sm:p-7">
        <h2 className="font-semibold text-[#1a1a1a]">Every member</h2>

        {members.length === 0 ? (
          <p className="mt-4 text-[#1a1a1a]/60">Nobody has signed up yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.1em] text-[#1a1a1a]/50">
                  <th className="pb-3 pr-4">Member</th>
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3 pr-4">Age</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]/[0.06]">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2">
                        <span className="block font-semibold text-[#1a1a1a]">
                          {m.full_name || 'Unnamed member'}
                        </span>
                        {m.is_admin && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#1a1a1a]"
                            style={{ background: YELLOW }}
                          >
                            Admin
                          </span>
                        )}
                      </span>
                      <span className="block text-sm text-[#1a1a1a]/55">{m.email}</span>
                    </td>
                    <td className="py-3 pr-4 text-[#1a1a1a]/70">{m.city || '—'}</td>
                    <td className="py-3 pr-4 text-[#1a1a1a]/70">{m.age ?? '—'}</td>
                    <td className="py-3 text-sm text-[#1a1a1a]/60">{fmtDate(m.joined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------- donors --------------------------------- */}
      <section className="mt-4 rounded-[1.75rem] bg-white/75 p-6 sm:p-7">
        <h2 className="font-semibold text-[#1a1a1a]">Every donor</h2>

        {donors.length === 0 ? (
          <p className="mt-4 text-[#1a1a1a]/60">No paid donations yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.1em] text-[#1a1a1a]/50">
                  <th className="pb-3 pr-4">Donor</th>
                  <th className="pb-3 pr-4">Total given</th>
                  <th className="pb-3 pr-4">Gifts</th>
                  <th className="pb-3">Last gift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]/[0.06]">
                {donors.map((d) => (
                  <tr key={d.userId}>
                    <td className="py-3 pr-4">
                      <span className="block font-semibold text-[#1a1a1a]">
                        {d.person?.full_name || 'Unnamed member'}
                      </span>
                      <span className="block text-sm text-[#1a1a1a]/55">
                        {d.person?.email || d.userId}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-sm font-bold text-[#1a1a1a]"
                        style={{ background: YELLOW }}
                      >
                        {currency.format(d.total)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#1a1a1a]">{d.count}</td>
                    <td className="py-3 text-sm text-[#1a1a1a]/60">{fmtDate(d.lastPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
