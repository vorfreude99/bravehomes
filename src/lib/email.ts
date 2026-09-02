import { brand } from '@/lib/content';

/**
 * Resend over the REST API directly rather than their SDK — one fetch
 * call is all this needs, and it keeps the dependency list from growing
 * for a single endpoint.
 */
const RESEND_URL = 'https://api.resend.com/emails';

function welcomeEmailHtml(name: string) {
  const firstName = name.trim().split(/\s+/)[0] || 'there';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:40px 32px 8px;text-align:center;">
                <img src="https://bravehomes.co.uk/logo-icon.png" width="48" height="48" alt="${brand.name}" style="display:block;margin:0 auto 16px;" />
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7a8a6f;">
                  ${brand.tagline}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;text-align:center;">
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#2f3a23;font-weight:600;">
                  Welcome, ${firstName}.
                </h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#4a5540;">
                  Your profile is live. Somewhere out there is someone hoping you say hello first — go take a look.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="https://bravehomes.co.uk/portal/find"
                   style="display:inline-block;background:#2f3a23;color:#f5f3ef;font-weight:600;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:999px;">
                  Meet the people here
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 40px;text-align:center;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#8a9280;">
                  ${brand.footerLine}<br />
                  Questions? Just reply to this email, or write to
                  <a href="mailto:support@bravehomes.co.uk" style="color:#8a9280;">support@bravehomes.co.uk</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Best-effort — a failed welcome email should never be the reason a
 * signup itself fails or a webhook retries forever. Callers log the
 * result; nothing here throws.
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${brand.name} <info@bravehomes.co.uk>`,
        to,
        subject: `Welcome to ${brand.name}`,
        html: welcomeEmailHtml(name),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
