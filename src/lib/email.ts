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
