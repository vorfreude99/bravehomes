import 'server-only';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

/**
 * Server-only Didit and Supabase helpers.
 *
 * Everything here needs a secret, so nothing in this file may ever be
 * imported from a client component — `server-only` makes that a build
 * error rather than a leak nobody notices.
 */

const BASE_URL = 'https://verification.didit.me/v3';

/** True once the keys are set, so the UI can say what is missing. */
export function diditConfigured() {
  return Boolean(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
}

function apiKey() {
  const key = process.env.DIDIT_API_KEY;
  if (!key) throw new Error('DIDIT_API_KEY is not set');
  return key;
}

export type DiditSession = {
  session_id: string;
  url: string;
  status: string;
};

/**
 * Starts a hosted verification session for one member.
 *
 * `vendor_data` carries our own user id, so the webhook can find its way
 * back to the right profile without us having to keep a lookup table —
 * Didit just echoes it back on every event for this session.
 */
export async function createDiditSession(
  userId: string,
  origin: string,
): Promise<DiditSession> {
  const workflowId = process.env.DIDIT_WORKFLOW_ID;
  if (!workflowId) throw new Error('DIDIT_WORKFLOW_ID is not set');

  const res = await fetch(`${BASE_URL}/session/`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: userId,
      callback: `${origin}/verify-age/callback`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Didit session create failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * The authoritative result for a session, fetched fresh rather than
 * trusted from the webhook's own embedded payload — the webhook only
 * has to tell us a session changed, not carry the full decision.
 */
export async function getDiditDecision(sessionId: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/session/${sessionId}/decision/`, {
    headers: { 'x-api-key': apiKey() },
  });

  if (!res.ok) {
    throw new Error(`Didit decision fetch failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export const MIN_AGE = 18;

/**
 * Maps a Didit session status (plus its decision payload) onto our
 * profiles.age_verification_status. Shared by the webhook and the
 * /api/didit/status reconciler so the two paths can never disagree on
 * what counts as approved. Fails closed: an Approved session with no
 * confidently-parsed age is declined, never silently approved.
 */
export function ageStatusFromDecision(
  sessionStatus: string | undefined,
  decision: unknown,
): 'approved' | 'declined' | 'pending' {
  if (sessionStatus === 'Declined' || sessionStatus === 'Expired' || sessionStatus === 'Abandoned') {
    return 'declined';
  }
  if (sessionStatus === 'Approved') {
    const age = findEstimatedAge(decision);
    return age != null && age >= MIN_AGE ? 'approved' : 'declined';
  }
  return 'pending';
}

/**
 * Recursively sorts object keys so the same payload always serialises
 * the same way — Didit's X-Signature-V2 is computed over this canonical
 * form, not whatever key order the JSON happened to arrive in.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
}

/**
 * Verifies a Didit webhook is really from Didit: HMAC-SHA256 over the
 * canonical (sorted-key) JSON, using the shared secret from the Didit
 * dashboard, plus a 5-minute window on the timestamp so a captured
 * request can't be replayed indefinitely.
 */
export function verifyDiditWebhook(rawBody: string, timestamp: string, signature: string) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  let canonical: string;
  try {
    canonical = JSON.stringify(canonicalize(JSON.parse(rawBody)));
  } catch {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Pulls an estimated age out of a session decision payload.
 *
 * The exact nesting isn't nailed down from the docs alone — Didit's own
 * reference shows the *standalone* age-estimation endpoint returning
 * `age_estimation.age_estimation` (a plain number), but a *session*
 * decision instead buries the same result inside `liveness_checks[]`
 * entries tagged `features: ["AGE_ESTIMATION"]`, whose exact field name
 * for the number itself isn't shown anywhere in the public docs. Rather
 * than hard-code a guess, this walks the whole payload looking for any
 * key plausibly named as an age and returns the first sane one (a
 * finite number between 1 and 120) it finds. **Confirm this against a
 * real sandbox response once live credentials exist** — see the plan
 * note in the webhook route.
 */
export function findEstimatedAge(value: unknown): number | null {
  const AGE_KEYS = new Set(['age_estimation', 'estimated_age', 'age']);

  const walk = (node: unknown): number | null => {
    if (node == null) return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found != null) return found;
      }
      return null;
    }
    if (typeof node === 'object') {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        if (AGE_KEYS.has(key) && typeof val === 'number' && val > 0 && val < 120) {
          return val;
        }
      }
      for (const val of Object.values(node as Record<string, unknown>)) {
        const found = walk(val);
        if (found != null) return found;
      }
    }
    return null;
  };

  return walk(value);
}

/**
 * A Supabase client with the service-role key.
 *
 * Used by the session-create route and the webhook, since the
 * `guard_age_verification` trigger (0014_age_verification.sql) blocks
 * any change to age_verification_status/session_id that doesn't come
 * from the service role — a signed-in member's own session can't move
 * either column, by design.
 */
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service-role credentials are not set');
  return createClient(url, key, { auth: { persistSession: false } });
}
