import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'The terms that govern your use of Brave Homes.',
};

/** Shared heading/body rhythm for the legal pages. */
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-serif text-2xl font-medium text-forest">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-relaxed text-olive">{children}</p>;
}

export default function TermsPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Terms and Conditions
      </h1>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-sage-ink">
        Last updated: 29 August 2026
      </p>

      <H2>1. Who we are</H2>
      <P>
        Brave Homes is operated by <strong className="text-forest">Brave Homes Community
        Interest Company</strong>, a community interest company limited by guarantee,
        registered in England and Wales under company number 17348356, registered office
        147 Benhurst Avenue, Hornchurch, England, RM12 4QN (&ldquo;Brave Homes&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;).
      </P>
      <P>
        Contact: <a href="mailto:info@bravehomes.co.uk" className="font-semibold text-forest underline">info@bravehomes.co.uk</a>.
      </P>
      <P>
        We are a community interest company, not a registered charity. Donations to us do
        not qualify for Gift Aid or charitable tax relief.
      </P>

      <H2>2. These terms</H2>
      <P>
        These terms govern your use of bravehomes.co.uk and the Brave Homes app (the
        &ldquo;Platform&rdquo;). By creating an account, using the Platform or donating,
        you accept them. Our <Link href="/privacy" className="font-semibold text-forest underline">Privacy Policy</Link> and{' '}
        <Link href="/safety" className="font-semibold text-forest underline">Community &amp; Safety Rules</Link> form
        part of these terms.
      </P>

      <H2>3. Who can join</H2>
      <P>
        You must be 18 or over, able to enter a binding agreement, and you may hold one
        account, which is personal to you. Give accurate information when registering and
        keep your login details secure.
      </P>

      <H2>4. What Brave Homes is — and is not</H2>
      <P>
        4.1 Brave Homes is a communication platform. It lets members talk to each other by
        text, voice note and video call, and arrange to meet if they choose.
      </P>
      <P>
        4.2 We are not a care provider, health service, counselling service or emergency
        service. We do not supervise conversations or meetings. Members are not our
        employees, volunteers or representatives.
      </P>
      <P>
        4.3 Every member must verify their email address and confirm they are 18 or over.
        Before arranging to meet another member in person, a member must complete
        photographic identity verification (a photo of an identity document plus a live
        selfie, done on your phone).
      </P>
      <P>
        4.4 Verification confirms who a person is. It does not confirm that they are safe,
        honest or suitable. We cannot prevent misconduct before it occurs and we do not
        guarantee the conduct of any member. <strong className="text-forest">Responsibility
        for a member&rsquo;s words and actions, online or in person, lies with that
        member.</strong> Our role is to act on concerns after they are reported to us.
      </P>

      <H2>5. Meeting in person</H2>
      <P>5.1 Meeting another member is entirely your decision and at your own risk.</P>
      <P>
        5.2 Meet in a public place, tell someone you trust where you are going, and never
        share bank details, PINs, passwords or identity documents. Never send, lend or
        accept money, whatever reason you are given.
      </P>
      <P>
        5.3 Asking another member for money, gifts, loans or financial information is a
        serious breach of these terms and results in permanent removal and, where
        appropriate, a report to the police.
      </P>
      <P>
        5.4 If anything about a member concerns you, report it at{' '}
        <a href="mailto:safeguarding@bravehomes.co.uk" className="font-semibold text-forest underline">safeguarding@bravehomes.co.uk</a>{' '}
        or through the report button. If you are in immediate danger, contact your local
        emergency services (999 in the UK, 112 in Europe, 911 in the US and Canada).
      </P>

      <H2>6. Acceptable use</H2>
      <P>
        You must not: misrepresent your identity or age; harass, threaten, abuse or exploit
        anyone; request money, gifts or financial information from a member; send sexual,
        discriminatory or offensive content; record a call without consent; share another
        member&rsquo;s information or messages outside the Platform; use the Platform for
        advertising, recruitment or campaigning; interfere with the Platform&rsquo;s
        security or operation; or use it for any unlawful purpose.
      </P>
      <P>
        We may suspend or terminate your account immediately, without notice, for breach of
        this clause, and may report unlawful conduct to the police.
      </P>

      <H2>7. Your content</H2>
      <P>
        You own what you upload. You give us a licence to host and display it only to run
        the Platform; the licence ends when you delete it or close your account, except
        where we must keep it for a legal obligation, a safety matter or a claim. We do not
        use your content in marketing without your separate consent. We do not routinely
        monitor messages; we may review content that is reported to us or where the law
        requires.
      </P>

      <H2>8. Donations</H2>
      <P>
        8.1 Donations are processed by Stripe and are voluntary gifts, not payment for
        services. They are non-refundable, except where made in error or without
        authorisation — contact us within 14 days and we will consider a refund. Donations
        made with a stolen card are always refunded.
      </P>
      <P>
        8.2 Stripe deducts a payment processing fee from every donation before the money
        reaches us. That fee is charged by Stripe, not by us.{' '}
        <strong className="text-forest">100% of every donation we receive is applied to the
        cause.</strong> Nothing is used for salaries, directors&rsquo; fees or overheads.
      </P>
      <P>
        8.3 &ldquo;The cause&rdquo; means supporting care homes and the wellbeing of the
        people who live in them, and the running of Brave Homes&rsquo; community
        programmes. We decide how funds are allocated.
      </P>
      <P>
        8.4 Recurring donations can be cancelled at any time, effective from the next
        scheduled payment. Only donate with a payment method you are entitled to use.
      </P>

      <H2>9. Availability and changes</H2>
      <P>
        We aim to keep the Platform available but do not guarantee it. We may change,
        suspend or withdraw it, and may update these terms; material changes will be
        notified by email or on the Platform.
      </P>

      <H2>10. Intellectual property</H2>
      <P>
        The Brave Homes name, logo, software and content belong to us or our licensors. Do
        not copy or use them without written permission.
      </P>

      <H2>11. Liability</H2>
      <P>
        11.1 Nothing in these terms excludes liability for death or personal injury caused
        by our negligence, for fraud, or for anything that cannot lawfully be excluded.
      </P>
      <P>
        11.2 Subject to 11.1, we are not liable for: the conduct, acts or omissions of any
        member or third party, online or in person; any loss arising from a meeting
        arranged through the Platform; money or property given to another member; business
        losses; or loss that was not foreseeable. Our total liability is limited to £100
        or, if greater, the amount you donated in the 12 months before the claim.
      </P>
      <P>
        11.3 The Platform is free for personal use. Your statutory consumer rights are not
        affected.
      </P>

      <H2>12. Your data</H2>
      <P>
        We process personal data under the UK GDPR and Data Protection Act 2018 as set out
        in our <Link href="/privacy" className="font-semibold text-forest underline">Privacy Policy</Link>.
      </P>

      <H2>13. Termination</H2>
      <P>
        We may suspend or close your account for breach of these terms, for a safety
        concern, or where the law requires. You may close your account at any time.
        Clauses 7, 8, 10, 11 and 14 survive termination.
      </P>

      <H2>14. General</H2>
      <P>
        These terms are the whole agreement between us about the Platform. If one clause is
        unenforceable, the rest stand. These terms are governed by the law of England and
        Wales and the courts of England and Wales have jurisdiction; consumers in Scotland,
        Northern Ireland or elsewhere may also rely on mandatory protections and courts of
        their home country.
      </P>

      <H2>15. Complaints</H2>
      <P>
        Email <a href="mailto:info@bravehomes.co.uk" className="font-semibold text-forest underline">info@bravehomes.co.uk</a>.
        We acknowledge within 3 working days and respond within 20 working days.
      </P>
    </div>
  );
}
