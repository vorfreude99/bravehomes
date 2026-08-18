import type { Metadata } from 'next';
import { Eyebrow } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Brave Homes stores, why, and how to have it removed.',
};

const SECTIONS = [
  {
    heading: 'What we store',
    body: 'Your email address and password (held by our authentication provider, never by us in readable form), and whatever you choose to put on your profile: name, age, city, a short bio, and interests. We also store the messages you send through the app.',
  },
  {
    heading: 'Why we store it',
    body: 'So that other members can find you and talk to you, and so your conversations are still there when you come back. That is the entire purpose. We do not sell data, and we do not run advertising.',
  },
  {
    heading: 'Who can see it',
    body: 'Your profile is visible to other signed-in members. Your messages are visible to you and to the person you sent them to. Nothing on your profile is required beyond a name and an email.',
  },
  {
    heading: 'Donations',
    body: 'When card payments are enabled, they will be handled by a regulated payment provider. Card details will never touch our servers. We keep a record of the amount and the project so we can account for every penny.',
  },
  {
    heading: 'Removing your data',
    body: 'Email us and we will delete your account, your profile and your messages. There is no retention period and no exit interview.',
  },
  {
    heading: 'Cookies',
    body: 'We set one cookie, to keep you signed in. There are no tracking or advertising cookies.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Eyebrow>PRIVACY</Eyebrow>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        What we keep, and why
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-olive">
        Plain English, because a privacy policy nobody can read isn’t a privacy
        policy.
      </p>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="font-serif text-2xl font-medium text-forest">
              {s.heading}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-olive">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-14 text-sm text-ink-muted">
        This page describes how the Brave Homes portal is built. It is not legal
        advice, and it should be reviewed by a solicitor before launch.
      </p>
    </>
  );
}
