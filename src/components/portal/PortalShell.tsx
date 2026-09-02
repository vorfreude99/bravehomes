'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CallProvider } from './CallProvider';
import { NotificationBell } from './NotificationBell';
import { createClient } from '@/lib/supabase/client';
import { Icon, type IconName } from '@/components/ui/Icon';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
};

const UserContext = createContext<SessionUser | null>(null);

export function useSessionUser(): SessionUser {
  const user = useContext(UserContext);
  if (!user) throw new Error('useSessionUser must be used inside <PortalShell>');
  return user;
}

/**
 * Lets a page ask the shell to get out of the way — the header and the
 * bottom tab bar, on mobile only. Built for an open chat conversation,
 * which wants the whole screen the way a real messaging app's thread
 * view does, not a card floating inside the portal's usual chrome.
 * Nothing calls the setter, nothing changes; it's `false` by default.
 */
const ChromeContext = createContext<(hidden: boolean) => void>(() => {});

export function useHideShellChrome(hidden: boolean) {
  const setHidden = useContext(ChromeContext);
  useEffect(() => {
    setHidden(hidden);
    return () => setHidden(false);
  }, [hidden, setHidden]);
}

/** The five tabs from the product design, in the same order. */
const TABS: { href: string; icon: IconName; label: string }[] = [
  { href: '/portal', icon: 'grid', label: 'Dashboard' },
  { href: '/portal/chat', icon: 'chat', label: 'Chat' },
  { href: '/portal/find', icon: 'search', label: 'Find' },
  { href: '/portal/donate', icon: 'heart', label: 'Donate' },
  { href: '/portal/profile', icon: 'profile', label: 'Profile' },
];

function isActive(pathname: string, href: string) {
  if (href === '/portal') return pathname === '/portal';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The initial-letter circle in the top bar.
 *
 * It used to sign you out the instant you tapped it — one mis-click and
 * the whole session was gone, no way back. It now opens a small menu
 * instead, the way every other app's account avatar does, and Sign out
 * is one deliberate choice inside it rather than the button's only job.
 */
function AccountMenu({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        title="Your account"
        className="flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border border-[#1a1a1a]/15 font-bold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-[#f5f3ef]"
      >
        {user.name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="pop-in absolute right-0 top-[calc(100%+0.625rem)] z-50 w-72 origin-top-right rounded-[1.5rem] border border-[#1a1a1a]/[0.06] bg-white p-2 shadow-[0_28px_60px_-20px_rgba(26,26,26,0.35)]"
        >
          {/* One surface throughout, the way the rest of the product's
              cards read — the identity row is set apart by weight and
              space, not by dropping onto a slab of a different colour. */}
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[#1a1a1a]"
              style={{ background: '#f5d64e' }}
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-[#1a1a1a]">{user.name}</span>
              <span className="block truncate text-sm text-[#1a1a1a]/50">{user.email}</span>
            </span>
          </div>

          <div className="h-px bg-[#1a1a1a]/[0.07]" />

          {user.isAdmin && (
            <Link
              href="/portal/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-[var(--bh-tap)] w-full items-center gap-3 rounded-xl px-3 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/[0.05]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M10 2.5 3.5 5v4.5c0 4 2.7 6.9 6.5 8 3.8-1.1 6.5-4 6.5-8V5L10 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 10 9 11.5 12.5 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
Admin
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="mt-2 flex min-h-[var(--bh-tap)] w-full items-center gap-3 rounded-xl px-3 font-semibold text-[#b3402f] transition-colors hover:bg-[#b3402f]/[0.08]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M7.5 17.5h-3a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 4.5 2.5h3M13.5 14l4-4-4-4M17 10H7.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function PortalShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Mobile-only: an open chat conversation asks for this via
  // `useHideShellChrome`, so it can fill the screen the way a real
  // messaging app's thread view does. `lg:` ignores it entirely — the
  // two-panel chat layout already sits comfortably inside the normal
  // chrome on a wider screen.
  const [chromeHidden, setChromeHidden] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <UserContext.Provider value={user}>
      {/* Wrapping the whole portal, not just chat: a call has to be
          answerable wherever the person happens to be. */}
      <CallProvider meId={user.id} meName={user.name}>
        <ChromeContext.Provider value={setChromeHidden}>
        {/* The portal is one card floating on a muted ground, with the
            navigation as pills along its top — the reference layout,
            rather than a rail down the side. The ground is deliberately
            not a brand colour: it is there to make the card lift. */}
        <div className="min-h-svh bg-[#f5f3ef]">
          <div
            className="ground-drift relative min-h-svh w-full overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 55% 50% at 95% 0%, #f7dd7a 0%, rgba(247,221,122,0) 55%), radial-gradient(ellipse 50% 45% at 3% 100%, #f6de84 0%, rgba(246,222,132,0) 55%), #f5f3ef',
            }}
          >
            {/* ---------------------------- Top bar ---------------------------- */}
            <header
              className={`relative flex-wrap items-center gap-3 px-5 py-5 sm:px-8 lg:flex ${
                chromeHidden ? 'hidden' : 'flex'
              }`}
            >
              <nav
                aria-label="Portal"
                className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-[#1a1a1a]/[0.04] p-1 lg:flex"
              >
                {TABS.map((tab) => {
                  const active = isActive(pathname, tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? 'page' : undefined}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-[#1a1a1a] text-[#f5f3ef]'
                          : 'text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <NotificationBell />
                <AccountMenu user={user} onSignOut={signOut} />
              </div>
            </header>

            <main id="main" className={chromeHidden ? 'pb-0 lg:pb-6' : 'pb-28 lg:pb-6'}>
              {children}
            </main>

            {/* Mobile tab bar — the pills do not fit a phone. */}
            <nav
              aria-label="Portal"
              className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#1a1a1a]/10 bg-[#f5f3ef]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden ${
                chromeHidden ? 'max-lg:hidden' : ''
              }`}
            >
              {TABS.map((tab) => {
                const active = isActive(pathname, tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className="flex min-h-[var(--bh-tap)] items-center justify-center px-0.5"
                  >
                    {/* The link fills the whole grid cell so the tap
                        target stays full-width; the pill sits on an
                        inner span so the highlight itself stays a
                        snug badge instead of one edge-to-edge block. */}
                    <span
                      className="flex flex-col items-center gap-0.5 rounded-2xl px-3.5 py-1.5 transition-colors"
                      style={active ? { background: '#f5d64e' } : undefined}
                    >
                      <Icon
                        name={tab.icon}
                        size={22}
                        strokeWidth={active ? 2.1 : 1.6}
                        className={active ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/45'}
                      />
                      <span
                        className={`text-[0.62rem] font-bold ${
                          active ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/55'
                        }`}
                      >
                        {tab.label}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        </ChromeContext.Provider>
      </CallProvider>
    </UserContext.Provider>
  );
}

export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 pt-1 sm:px-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-[#1a1a1a] sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[#1a1a1a]/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
