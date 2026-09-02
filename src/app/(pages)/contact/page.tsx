import type { Metadata } from 'next';
import { Eyebrow } from '@/components/ui/Button';

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

      <section className="card-solid mt-10 p-6 sm:max-w-sm">
        <h2 className="font-serif text-xl font-medium text-forest">Email us</h2>
        <p className="mt-2 text-olive">
          Building, giving, joining, or just saying hello — one address, and
          a person reads every message.
        </p>
        <a
          href="mailto:support@bravehomes.co.uk"
          className="mt-4 inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
        >
          support@bravehomes.co.uk
        </a>
      </section>
    </>
  );
}
