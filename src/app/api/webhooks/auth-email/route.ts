import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { authEmailContent, sendEmail } from '@/lib/email';

/**
 * Supabase's Send Email hook. With this enabled, GoTrue composes no
 * emails of its own — every auth email (password recovery, signup
 * confirmation, magic link, invite, email change, reauth code) arrives
 * here as an event, and we send the actual email through Resend with
 * the same designed templates the welcome email uses. Templates live in
 * src/lib/email.ts, in git, instead of a dashboard text box.
 *
 * Verification follows the Standard Webhooks spec Supabase uses:
 * HMAC-SHA256 over "<id>.<timestamp>.<body>" with the base64 secret
 * from the hook's dashboard entry (the part after "v1,whsec_").
 */
export async function POST(request: Request) {
  const secretRaw = process.env.AUTH_EMAIL_HOOK_SECRET;
  if (!secretRaw) {
    return NextResponse.json({ error: 'Hook not configured.' }, { status: 503 });
  }

  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signatureHeader = request.headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) {
    return NextResponse.json({ error: 'Missing signature headers.' }, { status: 401 });
  }

  // Five-minute window, same as the Didit webhook — a captured request
  // must not be replayable later.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    return NextResponse.json({ error: 'Stale timestamp.' }, { status: 401 });
  }

  const raw = await request.text();
  const key = Buffer.from(secretRaw.replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${raw}`)
    .digest('base64');

  // The header can carry several space-separated "v1,<sig>" entries.
  const valid = signatureHeader.split(' ').some((entry) => {
    const sig = entry.startsWith('v1,') ? entry.slice(3) : entry;
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!valid) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 401 });
  }

  const payload = JSON.parse(raw) as {
    user?: { email?: string };
    email_data?: {
      token?: string;
      token_hash?: string;
      redirect_to?: string;
      email_action_type?: string;
    };
  };

  const to = payload.user?.email;
  const data = payload.email_data;
  if (!to || !data?.email_action_type) {
    return NextResponse.json({ error: 'Malformed payload.' }, { status: 400 });
  }

  // The same verification URL GoTrue's own emails point at — it checks
  // the token, then forwards the browser to redirect_to.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const link = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(
    data.token_hash ?? '',
  )}&type=${encodeURIComponent(data.email_action_type)}&redirect_to=${encodeURIComponent(
    data.redirect_to ?? 'https://bravehomes.co.uk',
  )}`;

  const { subject, html } = authEmailContent(data.email_action_type, link, data.token ?? '');
  const result = await sendEmail(to, subject, html);

  if (!result.ok) {
    // A non-2xx makes GoTrue fail the member's own request (their reset
    // click would show an error), which is right: better an immediate
    // "try again" than a silent email that never comes.
    console.error('auth email send failed:', data.email_action_type, result.error);
    return NextResponse.json({ error: 'Email delivery failed.' }, { status: 500 });
  }

  return NextResponse.json({});
}
