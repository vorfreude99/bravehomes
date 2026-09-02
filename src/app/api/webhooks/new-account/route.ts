import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * Fired by a Supabase Database Webhook (see
 * `supabase/migrations/0013_welcome_email_webhook.sql`) on every INSERT
 * into `auth.users` — i.e. every new signup, confirmed or not. Fully
 * decoupled from Supabase's own auth emails: if their SMTP breaks again,
 * this path is unaffected, and vice versa.
 */
export async function POST(request: Request) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  // Supabase's webhook has no built-in signature — this shared header is
  // the only thing standing between this endpoint and anyone on the
  // internet who finds the URL.
  if (request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const email: string | undefined = payload?.record?.email;
  const name: string | undefined = payload?.record?.raw_user_meta_data?.full_name;

  if (!email) {
    return NextResponse.json({ error: 'No email in payload.' }, { status: 400 });
  }

  // The trigger stays live in Supabase, but sending itself is switched
  // off here — a template revision is coming, and this way turning it
  // back on is a Vercel env var, not another trip through the database.
  if (process.env.WELCOME_EMAIL_ENABLED !== 'true') {
    return NextResponse.json({ received: true, skipped: 'disabled' });
  }

  const result = await sendWelcomeEmail(email, name || 'there');
  if (!result.ok) {
    // Logged, not thrown — Supabase would otherwise retry a webhook that
    // already did its one meaningful job (nothing else depends on this
    // succeeding), and a slow/broken email provider becoming a growing
    // backlog of retried requests is worse than one missed welcome email.
    console.error('sendWelcomeEmail failed:', result.error);
  }

  return NextResponse.json({ received: true });
}
