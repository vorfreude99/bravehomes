'use client';

import Link from 'next/link';
import { PageHead } from './PortalShell';

const YELLOW = '#f5d64e';

/**
 * Where the homes actually stand — told straight.
 *
 * This page used to show named projects with money raised and build
 * stages. None of it existed yet, so it's gone: an honest beginning
 * beats an invented finish line.
 */
export function HomesClient() {
  return (
    <>
      <PageHead
        title="The homes"
        subtitle="Told honestly — here is exactly what Brave Homes does, and where your money goes."
      />

      <div className="grid gap-4 px-5 pb-10 sm:px-8 lg:grid-cols-3">
        {[
          {
            state: 'Happening now',
            on: true,
            title: 'Connecting generations',
            body: 'The part of Brave Homes you are standing in. People of different generations meeting, talking and looking out for each other — free, every day.',
          },
          {
            state: 'Where donations go',
            on: false,
            title: 'Helping care homes',
            body: 'Every donation goes towards the development and improvement of care homes — better rooms, better equipment, better days for the people who live in them.',
          },
          {
            state: 'The goal',
            on: false,
            title: 'Children’s homes overseas',
            body: 'The longer road: safe homes for children who have nowhere to go, wherever the need is greatest. Every gift brings it closer.',
          },
        ].map((card) => (
          <section key={card.title} className="flex flex-col rounded-[1.75rem] bg-white/75 p-6 sm:p-7">
            <span
              className={`self-start rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                card.on ? 'text-[#1a1a1a]' : 'bg-[#1a1a1a]/10 text-[#1a1a1a]/70'
              }`}
              style={card.on ? { background: YELLOW } : undefined}
            >
              {card.state}
            </span>
            <h2 className="mt-4 text-xl font-semibold text-[#1a1a1a]">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/65">{card.body}</p>
          </section>
        ))}
      </div>

      <div className="px-5 pb-12 sm:px-8">
        <section className="rounded-[2rem] bg-[#1a1a1a] p-7 text-white sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
                Every gift makes a care home better.
              </h2>
              <p className="mt-2 text-white/65">
                100% of every donation goes to the cause — helping care homes
                look after the people in them.
              </p>
            </div>
            <Link
              href="/portal/donate"
              className="inline-flex min-h-14 items-center rounded-full px-9 text-lg font-bold text-[#1a1a1a] transition-transform hover:scale-[1.02]"
              style={{ background: YELLOW }}
            >
              Give now
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
