import type { Metadata } from 'next';
import { Eyebrow, LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Brave Homes team.',
};

export default function ContactPage() {
  return (
    <>
      <Eyebrow>CONTACT</Eyebrow>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Talk to us
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-olive">
        Whether you want to help build, to give, to partner with us, or to ask
        how any of this works — write to us and a person will answer.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="card-solid p-6">
          <h2 className="font-serif text-xl font-medium text-forest">General</h2>
          <p className="mt-2 text-olive">Questions, ideas, or just hello.</p>
          <a
            href="mailto:hello@bravehomes.org"
            className="mt-4 inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
          >
            hello@bravehomes.org
          </a>
        </section>

        <section className="card-solid p-6">
          <h2 className="font-serif text-xl font-medium text-forest">The builds</h2>
          <p className="mt-2 text-olive">
            Land, contractors, and progress on the homes.
          </p>
          <a
            href="mailto:build@bravehomes.org"
            className="mt-4 inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
          >
            build@bravehomes.org
          </a>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/signup" size="lg">
          Join free
        </LinkButton>
        <LinkButton href="/portal/donate" variant="gold" size="lg">
          Donate
        </LinkButton>
      </div>

      <p className="mt-12 text-sm text-ink-muted">
        These addresses are placeholders until the team’s real inboxes are
        connected.
      </p>
    </>
  );
}
