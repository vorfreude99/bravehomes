import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What personal information Brave Homes collects, why, and your rights.',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-serif text-2xl font-medium text-forest">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-relaxed text-olive">{children}</p>;
}

/** Two-column facts, readable on a phone without a sideways scroll. */
function FactTable({ rows, headers }: { rows: [string, string][]; headers: [string, string] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b-2 border-sage/40 py-2 pr-4 text-sm font-bold uppercase tracking-[0.1em] text-forest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className="border-b border-sage/20 py-2.5 pr-4 align-top text-olive">{a}</td>
              <td className="border-b border-sage/20 py-2.5 align-top text-olive">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-sage-ink">
        Last updated: 29 August 2026
      </p>

      <H2>1. Who we are</H2>
      <P>
        <strong className="text-forest">Brave Homes Community Interest Company</strong> is
        the data controller for the personal information described in this policy. We are a
        community interest company limited by guarantee, registered in England and Wales,
        company number 17348356, registered office 147 Benhurst Avenue, Hornchurch,
        England, RM12 4QN.
      </P>
      <P>
        Contact us about privacy at{' '}
        <a href="mailto:support@bravehomes.co.uk" className="font-semibold text-forest underline">support@bravehomes.co.uk</a>.
      </P>
      <P>
        We are registered with the Information Commissioner&rsquo;s Office under
        registration number ZC226772.
      </P>

      <H2>2. What this policy covers</H2>
      <P>
        This policy explains what personal information we collect through bravehomes.co.uk
        and the Brave Homes app, why we collect it, how long we keep it, who we share it
        with, and what rights you have.
      </P>
      <P>We are not a registered charity. We are a community interest company.</P>

      <H2>3. Information we collect</H2>
      <P>
        <strong className="text-forest">When you create an account</strong> Name, age,
        city, email address, password (stored encrypted), and any profile photograph or
        description you choose to add.
      </P>
      <P>
        <strong className="text-forest">When you verify your age</strong> A live selfie
        (and, if needed, a photo of an identity document) captured and assessed by our
        verification partner Didit. Didit stores the images on its secure systems; our
        own systems store only the outcome of the check. Authorised Brave Homes staff can
        view a verification in Didit&rsquo;s console where necessary — for example to
        investigate a report or a disputed check.
      </P>
      <P>
        <strong className="text-forest">When you use the Platform</strong> Messages you
        send and receive, voice notes, and records of video calls (date, time, duration and
        participants — we do not record the content of calls). Details of meetings you
        arrange through the Platform.
      </P>
      <P>
        <strong className="text-forest">When you donate</strong> Name, email address,
        donation amount, date, and the last four digits and type of your card. Your full
        card details are collected and processed by Stripe. We never see or store them.
      </P>
      <P>
        <strong className="text-forest">Automatically</strong> IP address, device and
        browser type, operating system, and pages visited.
      </P>
      <P>
        <strong className="text-forest">When you contact us</strong> Anything you send us
        by email, through the contact form, or through a report.
      </P>
      <P>
        <strong className="text-forest">Special category data</strong> We do not ask for
        health information. Members sometimes mention health, care needs, religion or
        similar in conversation or in a report to us. Where that happens we treat it as
        special category data and rely on your explicit consent, or on the substantial
        public interest condition for safeguarding of adults at risk (UK GDPR Article
        9(2)(g) and Data Protection Act 2018 Schedule 1 Part 2 paragraph 18).
      </P>

      <H2>4. Why we use it and our lawful basis</H2>
      <FactTable
        headers={['What we use it for', 'Lawful basis']}
        rows={[
          ['Creating and running your account', 'Contract'],
          ['Enabling messaging, calls and introductions between members', 'Contract'],
          ['Verifying identity and age', 'Legitimate interests — protecting adults at risk'],
          ['Investigating reports, complaints and safeguarding concerns', 'Legitimate interests, and legal obligation where reporting is required'],
          ['Processing and recording donations', 'Contract and legal obligation (accounting and tax records)'],
          ['Site security, fraud prevention and abuse detection', 'Legitimate interests'],
          ['Service emails (password resets, changes to terms)', 'Contract'],
          ['Marketing and fundraising emails', 'Consent'],
          ['Anonymous statistics about how the Platform is used', 'Legitimate interests'],
        ]}
      />
      <P>
        You can withdraw consent to marketing at any time using the unsubscribe link or by
        emailing us. Withdrawing consent does not affect processing carried out before you
        withdrew it.
      </P>

      <H2>5. Who we share it with</H2>
      <P>
        <strong className="text-forest">Other members.</strong> Your name, age, city,
        photograph and profile description are visible to other members. Your email
        address, and any other contact details, are not shown unless you choose to give
        them to someone.
      </P>
      <P>
        <strong className="text-forest">Our suppliers.</strong> Stripe (payment
        processing), Didit (identity and age verification), and our hosting and email
        providers. They act on our instructions and are bound by contract.
      </P>
      <P>
        <strong className="text-forest">A member&rsquo;s family or care provider</strong>,
        where necessary for that member&rsquo;s welfare or safety.
      </P>
      <P>
        <strong className="text-forest">Police, safeguarding authorities and other
        authorities.</strong> We will share information without your consent where we
        believe there is a risk of harm to you or another person, where we suspect a
        criminal offence, or where we are required to by law. We may not be able to tell
        you when we do this.
      </P>
      <P>
        <strong className="text-forest">Professional advisers, insurers and auditors</strong>,
        where necessary.
      </P>
      <P>We do not sell personal information. We do not share it for third party advertising.</P>

      <H2>6. International transfers</H2>
      <P>
        Some of our suppliers process data outside the UK. Where that happens we rely on UK
        adequacy regulations or the International Data Transfer Addendum to the EU Standard
        Contractual Clauses.
      </P>

      <H2>7. How long we keep it</H2>
      <FactTable
        headers={['Data', 'Retention']}
        rows={[
          ['Account and profile', 'While your account is open, then 12 months after closure'],
          ['Messages, voice notes, call records', '12 months, then deleted'],
          ['Donation records', '7 years (accounting and tax)'],
          ['Safeguarding reports and investigations', '7 years from the date the matter is closed'],
          ['Records of members removed for serious breaches', '7 years, to prevent re-registration'],
          ['Correspondence with us', '3 years'],
          ['Website logs', '12 months'],
        ]}
      />

      <H2>8. Security</H2>
      <P>
        Data is encrypted in transit. Passwords are hashed. Access to member data inside
        Brave Homes is limited to those who need it. No system is completely secure. If a
        breach occurs that is likely to result in a risk to your rights, we will notify the
        ICO within 72 hours and tell you where required.
      </P>

      <H2>9. Your rights</H2>
      <P>You have the right to:</P>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed text-olive">
        <li>ask for a copy of the personal information we hold about you;</li>
        <li>have inaccurate information corrected;</li>
        <li>ask for information to be deleted;</li>
        <li>object to processing based on legitimate interests;</li>
        <li>ask us to restrict processing while a dispute is resolved;</li>
        <li>receive your data in a portable format;</li>
        <li>withdraw consent where consent is the basis we rely on.</li>
      </ul>
      <P>
        These rights are not absolute. We may keep information where we need it for a
        safeguarding matter, a legal claim, or a legal obligation, and we will tell you if
        that applies.
      </P>
      <P>
        To make a request, email{' '}
        <a href="mailto:support@bravehomes.co.uk" className="font-semibold text-forest underline">support@bravehomes.co.uk</a>.
        We respond within one month. There is no charge.
      </P>
      <P>
        If you are unhappy with our response, you can complain to the Information
        Commissioner&rsquo;s Office: ico.org.uk, 0303 123 1113, Wycliffe House, Water Lane,
        Wilmslow, Cheshire, SK9 5AF. We would ask you to raise it with us first.
      </P>

      <H2>10. Children</H2>
      <P>
        The Platform is for adults aged 18 and over. We do not knowingly collect
        information from anyone under 18. If we discover that an under-18 has registered,
        we will close the account and delete the data.
      </P>

      <H2>11. Changes</H2>
      <P>
        We may update this policy. Where a change is significant, we will tell you by email
        or on the Platform. See also our{' '}
        <Link href="/terms" className="font-semibold text-forest underline">Terms and Conditions</Link> and{' '}
        <Link href="/safety" className="font-semibold text-forest underline">Community &amp; Safety Rules</Link>.
      </P>
    </div>
  );
}
