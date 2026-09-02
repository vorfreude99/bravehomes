import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Cloudflare gives 1,000GB of TURN relay traffic free every month, then
 * bills per GB past that. This is the one check standing between "video
 * calls use TURN when they need it" and "the bill starts growing" — a
 * little under the actual free amount, so there is room to notice and
 * react before anything is ever billed.
 */
const MONTHLY_LIMIT_GB = Number(process.env.CLOUDFLARE_MONTHLY_LIMIT_GB) || 900;

/**
 * This month's actual TURN relay usage, in GB, straight from
 * Cloudflare's own analytics — not an estimate. Returns `null` if it
 * can't be determined for any reason (token missing, API error,
 * network failure), which the caller treats as "assume the worst,
 * don't spend anything."
 */
async function usedGBThisMonth(): Promise<number | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const analyticsToken = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!accountId || !analyticsToken) return null;

  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dateFrom = firstOfMonth.toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);

  const query = `
    query ($accountId: String!, $dateFrom: Date!, $dateTo: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          callsTurnUsageAdaptiveGroups(
            limit: 10000
            filter: { date_geq: $dateFrom, date_leq: $dateTo }
          ) {
            sum {
              egressBytes
              ingressBytes
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analyticsToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { accountId, dateFrom, dateTo } }),
    });

    if (!res.ok) {
      console.error('Cloudflare analytics request failed:', res.status);
      return null;
    }

    const json = (await res.json()) as {
      errors?: { message: string }[];
      data?: {
        viewer?: {
          accounts?: {
            callsTurnUsageAdaptiveGroups?: {
              sum?: { egressBytes?: number; ingressBytes?: number };
            }[];
          }[];
        };
      };
    };

    if (json.errors?.length) {
      console.error('Cloudflare analytics query error:', json.errors[0].message);
      return null;
    }

    // An empty/missing `accounts` entry (wrong account ID, a token
    // without the right scope) is a configuration failure, not "zero
    // usage" — treating it as zero would silently turn the spend cap
    // off. A genuinely valid account with no TURN traffic yet still
    // returns one account entry, just with an empty groups array, which
    // legitimately means 0GB and is handled by the `?? []` below.
    const account = json.data?.viewer?.accounts?.[0];
    if (!account) {
      console.error('Cloudflare analytics returned no account data — refusing TURN.');
      return null;
    }

    const groups = account.callsTurnUsageAdaptiveGroups ?? [];
    const totalBytes = groups.reduce(
      (sum, g) => sum + (g.sum?.egressBytes ?? 0) + (g.sum?.ingressBytes ?? 0),
      0,
    );
    return totalBytes / 1_000_000_000;
  } catch (err) {
    console.error('Cloudflare analytics lookup failed:', err);
    return null;
  }
}

/**
 * Short-lived TURN credentials for the person about to start or answer a
 * call.
 *
 * STUN alone can't connect two people who are both behind a restrictive
 * ("symmetric") NAT — common on mobile data, which matters here because
 * this audience skews toward exactly that. TURN is a relay that always
 * works, but it costs bandwidth, so credentials are minted fresh per
 * call rather than a static key ever reaching the browser, and only for
 * someone already signed into the portal.
 *
 * One gate decides whether TURN is offered at all: are we still under
 * this month's free usage? If that can't be confirmed — for any reason
 * — this refuses TURN rather than assume it's fine. Either way, the
 * call itself never breaks: it just falls back to free STUN, which
 * still connects most call pairs.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const token = process.env.CLOUDFLARE_TURN_TOKEN;

  if (!keyId || !token) {
    return NextResponse.json({ configured: false, iceServers: null });
  }

  const usedGB = await usedGBThisMonth();
  if (usedGB === null) {
    console.error('Could not confirm this month\'s Cloudflare usage — refusing TURN.');
    return NextResponse.json({ configured: false, iceServers: null });
  }
  if (usedGB >= MONTHLY_LIMIT_GB) {
    console.error(
      `Cloudflare usage (${usedGB.toFixed(1)}GB) at or past the ${MONTHLY_LIMIT_GB}GB limit — falling back to STUN-only.`,
    );
    return NextResponse.json({ configured: false, iceServers: null, capped: true });
  }

  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Comfortably longer than any call could run, short enough that
        // a leaked credential (it does briefly reach the browser) isn't
        // useful for long.
        body: JSON.stringify({ ttl: 3600 }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ configured: false, iceServers: null });
    }

    const data = (await response.json()) as { iceServers?: RTCIceServer[] };
    return NextResponse.json({ configured: true, iceServers: data.iceServers ?? null });
  } catch {
    return NextResponse.json({ configured: false, iceServers: null });
  }
}
