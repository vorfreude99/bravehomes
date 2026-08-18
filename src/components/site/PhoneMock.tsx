'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { Icon, type IconName } from '@/components/ui/Icon';

type Line = {
  from: 'them' | 'me';
  text: string;
  /** Shown under the bubble as the AI translation note. */
  original?: string;
};

const SCRIPT: Line[] = [
  { from: 'them', text: 'Good morning! The garden is finally in bloom.', original: 'Translated automatically' },
  { from: 'me', text: 'That sounds lovely. Send me a photo?' },
  { from: 'them', text: 'Of course. My wife planted these forty years ago.' },
  { from: 'me', text: 'Forty years! Tell me about her.' },
  { from: 'them', text: 'Ah. Get comfortable — this is a long story.' },
];

const NAV: { icon: IconName; label: string }[] = [
  { icon: 'chat', label: 'Chat' },
  { icon: 'search', label: 'Find' },
  { icon: 'home', label: 'Homes' },
  { icon: 'heart', label: 'Donate' },
  { icon: 'profile', label: 'Profile' },
];

/** Which tab lights up for each step of the story. */
const TAB_FOR_STEP = [4, 0, 0, 3];

const HEADERS: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'profile', title: 'Your profile', sub: 'Takes about a minute' },
  { icon: 'profile', title: 'Margaret, 82 — Manchester', sub: 'Active now' },
  { icon: 'profile', title: 'Margaret, 82 — Manchester', sub: 'Active now' },
  { icon: 'heart', title: 'Donate', sub: '100% to the cause' },
];

/**
 * The product, shown rather than described.
 *
 * `step` switches the screen so the sticky phone actually demonstrates
 * the step being read beside it, rather than looping one conversation
 * through all four. Decorative throughout: every screen's content is
 * also in the prose next to it.
 */
export function PhoneMock({
  className = '',
  step = 1,
}: {
  className?: string;
  step?: number;
}) {
  const reduced = useReducedMotion();
  const header = HEADERS[step] ?? HEADERS[1];

  return (
    <div className={className} aria-hidden="true">
      <div className="relative mx-auto w-full max-w-[19rem] rounded-[2.6rem] border-[10px] border-forest bg-forest shadow-[0_50px_90px_-40px_rgba(30,38,23,0.75)]">
        <div className="overflow-hidden rounded-[2rem] bg-parchment">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[0.65rem] font-semibold text-olive">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              247 online
            </span>
          </div>

        {/* Screen header */}
        <div className="flex items-center gap-3 border-b border-sage/25 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-mist text-forest">
            <Icon name={header.icon} size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-forest">{header.title}</span>
            <span className="flex items-center gap-1.5 text-xs text-sage-ink">
              {step === 1 || step === 2 ? (
                <span className="h-2 w-2 rounded-full bg-sage" />
              ) : null}
              {header.sub}
            </span>
          </span>
        </div>

        {/* Body — one screen per step, cross-faded */}
        <div className="relative h-[19rem]">
          <Screen show={step === 0}>
            <ProfileScreen />
          </Screen>
          <Screen show={step === 1}>
            <ChatScreen reduced={reduced} active={step === 1} />
          </Screen>
          <Screen show={step === 2}>
            <CoffeeScreen />
          </Screen>
          <Screen show={step === 3}>
            <DonateScreen />
          </Screen>
        </div>

        {/* Composer. Shown only where it makes sense, but the row is always
            in the layout — dropping it on the profile and donate steps made
            the phone 68px shorter on those two, so it grew and shrank as
            you scrolled the steps. The height is now the same throughout. */}
        <div className="flex items-center gap-2 border-t border-sage/25 px-4 py-3">
          <div
            className={`flex flex-1 items-center gap-2 transition-opacity duration-500 ${
              step === 1 || step === 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="flex-1 rounded-full border border-sage/40 px-4 py-2.5 text-sm text-ink-muted">
              Write a message…
            </span>
            <Icon name="mic" size={18} className="text-olive" />
            <Icon name="video" size={18} className="text-olive" />
          </div>
        </div>

        {/* Tab bar — highlights the tab this step belongs to */}
        <nav className="grid grid-cols-5 border-t border-sage/25 px-1 pb-3 pt-2">
          {NAV.map((item, i) => {
            const on = TAB_FOR_STEP[step] === i;
            return (
              <span key={item.label} className="flex flex-col items-center gap-0.5">
                <Icon
                  name={item.icon}
                  size={19}
                  className={`transition-all duration-500 ${
                    on ? 'scale-110 text-forest' : 'text-ink-muted'
                  }`}
                />
                <span
                  className={`text-[0.58rem] font-semibold transition-colors duration-500 ${
                    on ? 'text-forest' : 'text-ink-muted'
                  }`}
                >
                  {item.label}
                </span>
              </span>
            );
          })}
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Screen({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden transition-all duration-500"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}

/** Sized to fit the 19rem body — any taller and the button clips
    behind the tab bar. */
function ProfileScreen() {
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-mist text-xl font-bold text-forest">
          M
        </span>
        <span className="text-sm text-ink-muted">Add a photo (optional)</span>
      </div>
      {[
        ['Name', 'Margaret'],
        ['Age', '82'],
        ['City', 'Manchester'],
      ].map(([label, value]) => (
        <div key={label}>
          <p className="text-[0.62rem] font-bold tracking-wide text-olive">{label}</p>
          <p className="mt-0.5 rounded-lg border border-sage/30 bg-cream/60 px-3 py-1.5 text-sm text-forest">
            {value}
          </p>
        </div>
      ))}
      <p className="!mt-3 rounded-full bg-forest py-2.5 text-center text-sm font-bold text-cream">
        Create my profile
      </p>
    </div>
  );
}

function CoffeeScreen() {
  return (
    <div className="space-y-2.5 px-4 py-4">
      <Bubble from="them">Are you free this weekend?</Bubble>
      <Bubble from="me">I am! Coffee on Saturday?</Bubble>
      <div className="rounded-2xl border border-sage/40 bg-cream/70 p-3">
        <p className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.14em] text-sage-ink">
          <Icon name="coffee" size={13} />
          COFFEE — SATURDAY
        </p>
        <p className="mt-1 text-sm font-semibold text-forest">3:00pm · The Corner Café</p>
        <p className="mt-2 rounded-full bg-forest py-1.5 text-center text-xs font-bold text-cream">
          I’ll be there
        </p>
      </div>
    </div>
  );
}

function DonateScreen() {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-2 gap-2">
        {['£10', '£20', '£50', '£100'].map((amount, i) => (
          <p
            key={amount}
            className={`rounded-xl border-2 py-3 text-center text-base font-bold ${
              i === 1
                ? 'border-sage bg-sage-mist/70 text-forest'
                : 'border-sage/30 text-olive'
            }`}
          >
            {amount}
          </p>
        ))}
      </div>
      <p className="mt-3 rounded-full bg-gold py-2.5 text-center text-sm font-bold text-forest-deep">
        Donate now
      </p>
      <p className="mt-3 flex items-center justify-center gap-1 text-[0.65rem] font-semibold text-sage-ink">
        <Icon name="check" size={12} />
        100% to the cause. Zero admin fees.
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full w-[62%] rounded-full bg-gold" />
      </div>
      <p className="mt-1.5 text-center text-[0.6rem] text-ink-muted">
        Care Home One
      </p>
    </div>
  );
}

function Bubble({ from, children }: { from: 'them' | 'me'; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === 'me' ? 'justify-end' : 'justify-start'}`}>
      <span
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-snug ${
          from === 'me'
            ? 'rounded-br-md bg-forest text-cream'
            : 'rounded-bl-md bg-sage-mist text-forest'
        }`}
      >
        {children}
      </span>
    </div>
  );
}

/** The original looping conversation, now one screen among four. */
function ChatScreen({ reduced, active }: { reduced: boolean; active: boolean }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !active) {
      setShown(SCRIPT.length);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      setShown(0);
      SCRIPT.forEach((_, i) => {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setTyping(true);
          }, 1200 + i * 2200),
        );
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setTyping(false);
            setShown(i + 1);
          }, 2000 + i * 2200),
        );
      });
      timers.push(setTimeout(run, 2000 + SCRIPT.length * 2200 + 3600));
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced, active]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [shown, typing, reduced]);

  return (
    <div ref={scroller} className="no-bar h-full space-y-2.5 overflow-y-auto px-4 py-4">
      {SCRIPT.slice(0, shown).map((line, i) => (
        <div key={i}>
          <Bubble from={line.from}>{line.text}</Bubble>
          {line.original && (
            <p className="mt-1 flex items-center gap-1 text-[0.6rem] font-medium text-ink-muted">
              <Icon name="globe" size={11} />
              {line.original}
            </p>
          )}
        </div>
      ))}

      {typing && (
        <div className="flex justify-start">
          <div className="flex gap-1 rounded-2xl rounded-bl-md bg-sage-mist px-3.5 py-3">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-forest/50"
                style={{
                  animation: 'bh-float 1s ease-in-out infinite',
                  animationDelay: `${d * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
