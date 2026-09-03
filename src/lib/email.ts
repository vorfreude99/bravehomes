import { brand } from '@/lib/content';

/**
 * Resend over the REST API directly rather than their SDK — one fetch
 * call is all this needs, and it keeps the dependency list from growing
 * for a single endpoint.
 */
const RESEND_URL = 'https://api.resend.com/emails';

const SITE = 'https://bravehomes.co.uk';

/** Minimal HTML escape for user-supplied strings interpolated into markup. */
function esc(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function welcomeEmailHtml(name: string) {
  const firstName = esc(name.trim().split(/\s+/)[0] || 'there');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Welcome to Brave Homes</title>
<style>
a:hover{opacity:.85}
@media only screen and (max-width:620px){
.wrap{width:100%!important}
.px{padding-left:22px!important;padding-right:22px!important}
.h1{font-size:32px!important;line-height:38px!important}
.stack{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important}
.step-num{width:60px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#e8e4da;">
<span style="display:none;font-size:1px;color:#e8e4da;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">You're in. Here's how to say your first hello &mdash; it takes about a minute.</span>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e8e4da;">
<tr><td align="center" style="padding:28px 12px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;background-color:#f4f1ea;border-radius:14px;overflow:hidden;">

<!-- masthead -->
<tr><td align="center" style="background-color:#2f3a26;padding:26px 32px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:36px;mso-line-height-rule:exactly;color:#f4f1ea;font-weight:normal;letter-spacing:-0.3px;">Brave<span style="color:#f0cb4d;">Homes</span></div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;mso-line-height-rule:exactly;color:#b5b2a8;letter-spacing:3px;text-transform:uppercase;padding-top:6px;">Connecting generations</div>
</td></tr>

<!-- verified banner -->
<tr><td align="center" style="background-color:#f0cb4d;padding:14px 24px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;mso-line-height-rule:exactly;color:#2b3323;letter-spacing:2.6px;text-transform:uppercase;font-weight:bold;">&#10003;&nbsp; You're verified &mdash; your account is open</div>
</td></tr>

<!-- greeting -->
<tr><td class="px" style="padding:40px 40px 0 40px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:#3a3a35;letter-spacing:2.4px;text-transform:uppercase;font-weight:bold;">Welcome</div>
<div class="h1" style="font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:44px;mso-line-height-rule:exactly;color:#17171a;padding-top:12px;">Hello ${firstName} &mdash; <i style="color:#6b6b64;">you're in.</i></div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:27px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:18px;">Your age check is done, so that's the paperwork over with. What's left is the good part: somebody on here is hoping a message arrives today. Three small things and it could be yours.</div>
</td></tr>

<!-- steps -->
<tr><td class="px" style="padding:26px 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">

<tr><td style="padding-bottom:14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#fdfcf9;border-radius:12px;">
<tr>
<td width="74" class="step-num" valign="top" align="center" style="width:74px;padding:22px 0 22px 18px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="46" height="46" align="center" valign="middle" bgcolor="#f0cb4d" style="width:46px;height:46px;border-radius:23px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#2b3323;">1</td></tr></table>
</td>
<td valign="top" style="padding:22px 22px 22px 8px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:25px;mso-line-height-rule:exactly;font-weight:bold;color:#17171a;">Finish your card</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:5px;">Your city and a few things you like talking about. This is what somebody reads before they say hello, so a sentence about yourself goes a long way.</div>
</td>
</tr>
</table>
</td></tr>

<tr><td style="padding-bottom:14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#fdfcf9;border-radius:12px;">
<tr>
<td width="74" class="step-num" valign="top" align="center" style="width:74px;padding:22px 0 22px 18px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="46" height="46" align="center" valign="middle" bgcolor="#f0cb4d" style="width:46px;height:46px;border-radius:23px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#2b3323;">2</td></tr></table>
</td>
<td valign="top" style="padding:22px 22px 22px 8px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:25px;mso-line-height-rule:exactly;font-weight:bold;color:#17171a;">Find one person</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:5px;">Not ten. One. Look for somebody near you, or search by what you have in common &mdash; gardening, football, cooking, the same hometown.</div>
</td>
</tr>
</table>
</td></tr>

<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#fdfcf9;border-radius:12px;">
<tr>
<td width="74" class="step-num" valign="top" align="center" style="width:74px;padding:22px 0 22px 18px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="46" height="46" align="center" valign="middle" bgcolor="#f0cb4d" style="width:46px;height:46px;border-radius:23px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#2b3323;">3</td></tr></table>
</td>
<td valign="top" style="padding:22px 22px 22px 8px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:25px;mso-line-height-rule:exactly;font-weight:bold;color:#17171a;">Say something small</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:5px;">You don't need an opening line. &ldquo;Hello, I saw you like the garden&rdquo; is plenty. Text, voice or video &mdash; whichever you're comfortable with.</div>
</td>
</tr>
</table>
</td></tr>

</table>
</td></tr>

<!-- first message helper -->
<tr><td class="px" style="padding:30px 40px 0 40px;">
<img src="${SITE}/email-talk.png" width="520" alt="A younger and an older person in conversation" style="display:block;width:100%;max-width:520px;height:auto;border:0;outline:none;text-decoration:none;border-radius:12px 12px 0 0;background-color:#ece8de;">
</td></tr>
<tr><td class="px" style="padding:0 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#ece8de;border-radius:0 0 12px 12px;">
<tr><td style="padding:22px 24px 8px 24px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;mso-line-height-rule:exactly;color:#4f4f4a;letter-spacing:2.4px;text-transform:uppercase;font-weight:bold;">Stuck on what to say?</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;padding-top:6px;">
<tr><td style="padding-top:12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="86%" style="width:86%;"><tr><td bgcolor="#fdfcf9" style="border-radius:16px;padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;mso-line-height-rule:exactly;color:#17171a;">&ldquo;Hello Margaret &mdash; I&rsquo;m new here. What&rsquo;s growing in your garden this week?&rdquo;</td></tr></table>
</td></tr>
<tr><td style="padding-top:10px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="86%" style="width:86%;"><tr><td bgcolor="#fdfcf9" style="border-radius:16px;padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;mso-line-height-rule:exactly;color:#17171a;">&ldquo;I saw you&rsquo;re in Manchester too. How long have you been there?&rdquo;</td></tr></table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 24px 22px 24px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;mso-line-height-rule:exactly;color:#4f4f4a;">Copy one if it helps. Nobody minds a simple start.</div>
</td></tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td class="px" align="center" style="padding:32px 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#f0cb4d" style="border-radius:30px;">
<a href="${SITE}/portal/profile" style="display:block;padding:18px 44px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;mso-line-height-rule:exactly;font-weight:bold;color:#2b3323;text-decoration:none;border-radius:30px;">Finish your card &rarr;</a>
</td>
</tr></table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:14px;">Takes about a minute &mdash; on any phone, tablet or computer</div>
</td></tr>

<!-- safety -->
<tr><td class="px" style="padding:30px 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#17171a;border-radius:12px;">
<tr><td style="padding:24px 26px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;mso-line-height-rule:exactly;color:#b5b2a8;letter-spacing:2.6px;text-transform:uppercase;font-weight:bold;">Who you're talking to</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;mso-line-height-rule:exactly;color:#f0cb4d;padding-top:8px;">Everyone here passed the same age check as you.</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#b5b2a8;padding-top:10px;">Your check photo is used only for verification, held securely by our verification partner &mdash; it never becomes your profile picture. You choose what goes on your card, and you can stop a conversation at any time.</div>
</td></tr>
</table>
</td></tr>

<!-- divider -->
<tr><td class="px" style="padding:32px 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;"><tr><td height="1" style="height:1px;background-color:#ddd8cc;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>

<!-- sign off -->
<tr><td class="px" style="padding:26px 40px 40px 40px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#4f4f4a;">Joining is free and always will be. If you ever get stuck, reply to this email &mdash; a real person reads them.</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:#17171a;padding-top:14px;">Glad you're here,<br><strong>The ${brand.name} team</strong></div>
</td></tr>

<!-- footer -->
<tr><td align="center" style="background-color:#e7e3da;padding:26px 32px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:#2b2b2e;">Grateful &middot; Honest &middot; Loyal &middot; Brave</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:10px;">Brave Homes Community Interest Company, 147 Benhurst Avenue, Hornchurch, England, RM12 4QN</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:#4f4f4a;padding-top:8px;">
<a href="${SITE}" style="color:#4f4f4a;text-decoration:underline;">bravehomes.co.uk</a>
&nbsp;&middot;&nbsp;
<a href="mailto:support@bravehomes.co.uk?subject=Unsubscribe" style="color:#4f4f4a;text-decoration:underline;">Unsubscribe</a>
&nbsp;&middot;&nbsp;
<a href="${SITE}/privacy" style="color:#4f4f4a;text-decoration:underline;">Privacy</a>
</div>
</td></tr>

</table>

</td></tr>
</table>
</body></html>`;
}

/**
 * One sender for every email this site produces. Best-effort — callers
 * log the result; nothing here throws.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
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
        subject,
        html,
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

/**
 * A failed welcome email should never be the reason a signup itself
 * fails or a webhook retries forever.
 */
export function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(to, `Welcome to ${brand.name}`, welcomeEmailHtml(name));
}

/**
 * The card every auth email shares — dark masthead with the logo, gold
 * thread, serif headline, gold CTA, "didn't ask?" aside, footer. The
 * same design language as the welcome email, but leaner: these emails
 * exist to be clicked once, not read.
 */
function authEmailHtml(opts: {
  eyebrow: string;
  headlineHtml: string;
  intro: string;
  cta?: { label: string; link: string };
  code?: string;
  ignoreNote: string;
}) {
  const action = opts.cta
    ? `<tr><td align="center" style="padding:32px 44px 0 44px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;"><tr>
<td align="center" bgcolor="#f0cb4d" style="border-radius:32px;box-shadow:0 12px 28px -14px rgba(201,154,63,0.9);">
<a href="${opts.cta.link}" style="display:block;padding:19px 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:23px;font-weight:bold;color:#2b3323;text-decoration:none;border-radius:32px;">${opts.cta.label} &nbsp;&rarr;</a>
</td>
</tr></table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8a8474;padding-top:16px;">This link works once. If it&rsquo;s stopped working, just ask for a fresh one.</div>
</td></tr>`
    : `<tr><td align="center" style="padding:32px 44px 0 44px;">
<div style="display:inline-block;background-color:#ece8de;border-radius:14px;padding:18px 34px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:40px;letter-spacing:8px;color:#17171a;">${opts.code ?? ''}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8a8474;padding-top:16px;">Type this code where you&rsquo;re asked for it.</div>
</td></tr>`;

  return `<span style="display:none;font-size:1px;color:#e8e4da;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.intro}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e8e4da;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;">
<tr><td style="background-color:#f4f1ea;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px -24px rgba(47,58,38,0.45);">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
<tr><td align="center" style="background-color:#2f3a26;padding:32px 32px 28px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="64" height="64" align="center" valign="middle" bgcolor="#f4f1ea" style="width:64px;height:64px;border-radius:32px;">
<img src="${SITE}/email-logo.png" width="40" height="40" alt="${brand.name}" style="display:block;border:0;width:40px;height:40px;">
</td>
</tr></table>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:34px;color:#f4f1ea;letter-spacing:-0.3px;padding-top:14px;">Brave<span style="color:#f0cb4d;">Homes</span></div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#b5b2a8;letter-spacing:3.4px;text-transform:uppercase;padding-top:7px;">Connecting generations</div>
</td></tr>
<tr><td style="background-color:#f0cb4d;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:44px 44px 0 44px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;color:#8a8474;letter-spacing:2.8px;text-transform:uppercase;font-weight:bold;">${opts.eyebrow}</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:40px;color:#17171a;padding-top:14px;">${opts.headlineHtml}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:27px;color:#4f4f4a;padding-top:18px;">${opts.intro}</div>
</td></tr>
${action}
<tr><td style="padding:34px 44px 0 44px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" style="height:1px;background-color:#ddd8cc;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>
<tr><td style="padding:26px 44px 0 44px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
<tr>
<td width="4" style="width:4px;background-color:#f0cb4d;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
<td style="padding:2px 0 2px 18px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#4f4f4a;"><strong style="color:#17171a;">Didn&rsquo;t ask for this?</strong> ${opts.ignoreNote}</div>
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:30px 44px 42px 44px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;color:#4f4f4a;">Stuck? Reply to this email &mdash; a real person reads them.</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:26px;color:#17171a;padding-top:14px;">Warmly,<br><strong>The ${brand.name} team</strong></div>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:26px 24px 8px 24px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#8a8474;letter-spacing:2.4px;text-transform:uppercase;font-weight:bold;">Grateful &middot; Honest &middot; Loyal &middot; Brave</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#8a8474;padding-top:10px;">Brave Homes Community Interest Company<br>147 Benhurst Avenue, Hornchurch, England, RM12 4QN</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;padding-top:8px;">
<a href="${SITE}" style="color:#8a8474;text-decoration:underline;">bravehomes.co.uk</a>
&nbsp;&middot;&nbsp;
<a href="${SITE}/privacy" style="color:#8a8474;text-decoration:underline;">Privacy</a>
</div>
</td></tr>
</table>
</td></tr>
</table>`;
}

/**
 * Subject + body for each auth email GoTrue can ask us to send once the
 * Send Email hook is on. Every action type must be covered — with the
 * hook enabled, Supabase sends nothing itself, so an unhandled type
 * here would be an email that simply never arrives.
 */
export function authEmailContent(
  actionType: string,
  link: string,
  code: string,
): { subject: string; html: string } {
  switch (actionType) {
    case 'recovery':
      return {
        subject: 'Let’s get you back in',
        html: authEmailHtml({
          eyebrow: 'Password reset',
          headlineHtml: 'Let&rsquo;s get you <i style="color:#6b6b64;">back in.</i>',
          intro:
            'Someone asked to reset the password for this account &mdash; hopefully you! Press the button below and choose a new one. Your conversations are exactly where you left them.',
          cta: { label: 'Choose a new password', link },
          ignoreNote:
            'Then simply ignore this email. Your password stays exactly as it is &mdash; nobody can change it without this link, and your account is safe.',
        }),
      };
    case 'signup':
      return {
        subject: 'Confirm your email',
        html: authEmailHtml({
          eyebrow: 'One quick check',
          headlineHtml: 'Is this really <i style="color:#6b6b64;">you?</i>',
          intro:
            'Welcome to Brave Homes! Press the button below to confirm this is your email address, and your account is ready.',
          cta: { label: 'Confirm my email', link },
          ignoreNote:
            'Then someone typed your address by mistake &mdash; ignore this email and nothing at all will happen.',
        }),
      };
    case 'magiclink':
      return {
        subject: 'Your sign-in link',
        html: authEmailHtml({
          eyebrow: 'Sign in',
          headlineHtml: 'Step right <i style="color:#6b6b64;">in.</i>',
          intro: 'Press the button below and you&rsquo;re signed in &mdash; no password needed.',
          cta: { label: 'Sign me in', link },
          ignoreNote: 'Then ignore this email &mdash; nobody can use this link but you.',
        }),
      };
    case 'invite':
      return {
        subject: 'You’re invited to Brave Homes',
        html: authEmailHtml({
          eyebrow: 'An invitation',
          headlineHtml: 'Someone saved you <i style="color:#6b6b64;">a seat.</i>',
          intro:
            'You&rsquo;ve been invited to join Brave Homes &mdash; a place where generations talk to each other. Press the button to accept and set up your account.',
          cta: { label: 'Accept the invitation', link },
          ignoreNote: 'Then feel free to ignore this &mdash; the invitation simply expires.',
        }),
      };
    case 'email_change':
      return {
        subject: 'Confirm your new email address',
        html: authEmailHtml({
          eyebrow: 'Email change',
          headlineHtml: 'Confirm your <i style="color:#6b6b64;">new address.</i>',
          intro:
            'You asked to change the email on your Brave Homes account. Press the button below to confirm this address.',
          cta: { label: 'Confirm this address', link },
          ignoreNote:
            'Then don&rsquo;t press the button &mdash; your account keeps its current address and nothing changes.',
        }),
      };
    default:
      // reauthentication (and anything new): GoTrue supplies a code, not a link.
      return {
        subject: 'Your Brave Homes confirmation code',
        html: authEmailHtml({
          eyebrow: 'Confirmation code',
          headlineHtml: 'Here&rsquo;s your <i style="color:#6b6b64;">code.</i>',
          intro: 'Use this code to confirm it&rsquo;s really you:',
          code,
          ignoreNote: 'Then ignore this email &mdash; the code expires on its own shortly.',
        }),
      };
  }
}
