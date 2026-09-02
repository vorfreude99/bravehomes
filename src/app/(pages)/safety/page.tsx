import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community & Safety Rules',
  description:
    'The rules every Brave Homes member must follow, how to report a concern, and what we do when one is raised.',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-serif text-2xl font-medium text-forest">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-relaxed text-olive">{children}</p>;
}

export default function SafetyPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Community &amp; Safety Rules and Safeguarding Policy
      </h1>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-sage-ink">
        Adopted: 29 August 2026 · Reviewed annually
      </p>
      <P>
        Brave Homes Community Interest Company — company number 17348356 — 147 Benhurst
        Avenue, Hornchurch, England, RM12 4QN.
      </P>

      <H2>1. Purpose</H2>
      <P>
        Brave Homes is a communication platform for adults aged 18 and over, anywhere in
        the world. This policy sets out the rules every member must follow, how to report a
        concern, and what we do when one is raised.
      </P>
      <P>
        No organisation can prevent wrongdoing before it happens, and Brave Homes does not
        claim to. Responsibility for a member&rsquo;s conduct lies with that member alone.
        Our role is to reduce the opportunity for harm through verification, make
        wrongdoing visible through reporting, and act decisively after a concern is raised.
      </P>

      <H2>2. Safeguarding Lead</H2>
      <P>
        Safeguarding is led by the Director of Brave Homes Community Interest Company.
        Contact:{' '}
        <a href="mailto:safeguarding@bravehomes.co.uk" className="font-semibold text-forest underline">safeguarding@bravehomes.co.uk</a>.
        If a concern involves the Safeguarding Lead, report it directly to the police or
        your local adult safeguarding authority. In an emergency, contact your local
        emergency services (999 in the UK, 112 in Europe, 911 in the US and Canada).
      </P>

      <H2>3. Member verification</H2>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed text-olive">
        <li>
          All members: email verification and an 18+ age check (a live selfie assessed by
          our verification partner, with an identity document as a fallback).
        </li>
        <li>
          Members arranging to meet in person: photographic identity verification (an
          identity document plus a live selfie, completed on the member&rsquo;s phone).
        </li>
      </ul>
      <P>
        Verification confirms identity. It does not guarantee anyone&rsquo;s character or
        conduct.
      </P>

      <H2>4. Community rules</H2>
      <P>Members must never:</P>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed text-olive">
        <li>ask for, accept or offer money, loans, gifts, cards, PINs or bank details;</li>
        <li>ask about another member&rsquo;s savings, pension, benefits, property or will;</li>
        <li>ask a member to keep the friendship secret from family or carers;</li>
        <li>send sexual, threatening or abusive content;</li>
        <li>record a call without consent;</li>
        <li>misrepresent their identity or age;</li>
        <li>collect a member from, or visit, their home before a first meeting in a public place.</li>
      </ul>
      <P>
        Breach results in immediate suspension pending investigation, and permanent removal
        where the breach is confirmed.
      </P>

      <H2>5. Reporting a concern</H2>
      <P>
        Anyone — a member, a family member, a carer — can report a concern at{' '}
        <a href="mailto:safeguarding@bravehomes.co.uk" className="font-semibold text-forest underline">safeguarding@bravehomes.co.uk</a>{' '}
        or through the report button on the Platform. Reports may be made anonymously.
        Reports are read every working day. If someone is in immediate danger, contact
        local emergency services first.
      </P>

      <H2>6. What we do with a concern</H2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 leading-relaxed text-olive">
        <li>
          <strong className="text-forest">Safety first.</strong> Immediate danger goes to
          the emergency services, not to us.
        </li>
        <li>
          <strong className="text-forest">Suspend.</strong> The reported account is
          suspended as soon as reasonably practicable. Suspension is not a finding of
          guilt.
        </li>
        <li>
          <strong className="text-forest">Record.</strong> The date, the concern in the
          reporter&rsquo;s own words, and the action taken. Records are kept securely for 7
          years.
        </li>
        <li>
          <strong className="text-forest">Refer.</strong> Where we reasonably believe an
          adult at risk has been abused, or a crime has been committed, we report to the
          police and, in the UK, to the relevant local authority adult safeguarding team,
          without delay.
        </li>
        <li>
          <strong className="text-forest">Decide.</strong> Permanent removal,
          reinstatement, or no further action — with the reason recorded.
        </li>
        <li>
          <strong className="text-forest">Cooperate.</strong> We do not investigate crimes;
          the police do. We preserve messages, call logs and account data and hand them
          over on lawful request.
        </li>
      </ol>

      <H2>7. People working for Brave Homes</H2>
      <P>
        Anyone working for Brave Homes with access to member data completes safeguarding
        awareness training, signs this policy, and reports concerns to the Safeguarding
        Lead the same day.
      </P>

      <H2>8. Review</H2>
      <P>This policy is reviewed every 12 months and after any serious incident.</P>

      <P>
        See also our{' '}
        <Link href="/terms" className="font-semibold text-forest underline">Terms and Conditions</Link> and{' '}
        <Link href="/privacy" className="font-semibold text-forest underline">Privacy Policy</Link>.
      </P>
    </div>
  );
}
