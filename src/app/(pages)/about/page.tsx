import type { Metadata } from 'next';
import { Eyebrow, LinkButton } from '@/components/ui/Button';
import { manifesto, values } from '@/lib/content';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why Brave Homes exists: connecting generations and building homes, with 100% of donations going directly to the cause.',
};

export default function AboutPage() {
  return (
    <>
      <Eyebrow>{manifesto.eyebrow}</Eyebrow>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Connecting generations. Building homes. Changing lives.
      </h1>

      <blockquote className="mt-9 border-l-4 border-gold pl-6">
        <p className="font-serif text-2xl font-medium italic leading-snug text-forest">
          {manifesto.quote}
        </p>
      </blockquote>

      <div className="mt-9 space-y-6 text-lg leading-relaxed text-olive">
        <p>{manifesto.body}</p>
        <p>
          Brave Homes does two things at once. It puts people of different
          generations in touch with each other — by text, by voice, by video, in
          any language — and it builds the physical homes where people who have
          nowhere safe to go can live.
        </p>
        <p>
          The second part is funded entirely by donations, and we don’t take a
          penny of them. Admin and hosting are paid for separately. When you give
          £20, twenty pounds of bricks, mortar and labour goes into a building.
        </p>
      </div>

      <h2 className="mt-14 font-serif text-3xl font-medium text-forest">
        What we hold ourselves to
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <li key={v.label} className="card-solid p-5">
            <span className="font-serif text-xl font-medium text-forest">
              {v.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap gap-3">
        <LinkButton href="/signup" size="lg">
          Join free
        </LinkButton>
        <LinkButton href="/portal/donate" variant="gold" size="lg">
          Donate
        </LinkButton>
      </div>
    </>
  );
}
