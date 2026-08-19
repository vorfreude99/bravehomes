'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { CallProvider } from './CallProvider';
import { Wordmark } from '@/components/ui/Brand';
import { SimpleModeToggle } from '@/components/SettingsProvider';
import { createClient } from '@/lib/supabase/client';
import { Icon, type IconName } from '@/components/ui/Icon';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

const UserContext = createContext<SessionUser | null>(null);

export function useSessionUser(): SessionUser {
  const user = useContext(UserContext);
  if (!user) throw new Error('useSessionUser must be used inside <PortalShell>');
  return user;
}

/** The five tabs from the product design, in the same order. */
const TABS: { href: string; icon: IconName; label: string }[] = [
  { href: '/portal/chat', icon: 'chat', label: 'Chat' },
  { href: '/portal/find', icon: 'search', label: 'Find' },
  { href: '/portal/homes', icon: 'home', label: 'Homes' },
  { href: '/portal/donate', icon: 'heart', label: 'Donate' },
  { href: '/portal/profile', icon: 'profile', label: 'Profile' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
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
        {/* The portal is one card floating on a muted ground, with the
            navigation as pills along its top — the reference layout,
            rather than a rail down the side. The ground is deliberately
            not a brand colour: it is there to make the card lift. */}
        <div className="min-h-svh bg-[#f7f4ec]">
          <div
            className="relative min-h-svh w-full overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 62% 55% at 92% 2%, rgba(201,154,63,0.20) 0%, rgba(201,154,63,0) 58%), radial-gradient(ellipse 55% 45% at 2% 98%, rgba(127,144,104,0.18) 0%, rgba(127,144,104,0) 58%), #f7f4ec',
            }}
          >
            {/* ---------------------------- Top bar ---------------------------- */}
            <header className="flex flex-wrap items-center gap-3 px-5 py-5 sm:px-8">
              <Link
                href="/portal"
                aria-label="Brave Homes — home"
                className="inline-flex min-h-[var(--bh-tap)] items-center rounded-full border border-[#1e2617]/15 px-5"
              >
                <Wordmark className="text-lg" />
              </Link>

              <nav
                aria-label="Portal"
                className="mx-auto hidden items-center gap-1 rounded-full bg-[#1e2617]/[0.04] p-1 lg:flex"
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
                          ? 'bg-[#1e2617] text-[#f7f4ec]'
                          : 'text-[#1e2617]/70 hover:text-[#1e2617]'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <SimpleModeToggle className="!border-[#1e2617]/15 !bg-transparent !shadow-none" />
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border border-[#1e2617]/15 font-bold text-[#1e2617] transition-colors hover:bg-[#1e2617] hover:text-[#f7f4ec]"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </div>
            </header>

            <main id="main" className="pb-28 lg:pb-6">
              {children}
            </main>

            {/* Mobile tab bar — the pills do not fit a phone. */}
            <nav
              aria-label="Portal"
              className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#1e2617]/10 bg-[#f7f4ec]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
            >
              {TABS.map((tab) => {
                const active = isActive(pathname, tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className="flex min-h-[var(--bh-tap)] flex-col items-center justify-center gap-0.5 rounded-2xl"
                  >
                    <Icon name={tab.icon} size={22} />
                    <span
                      className={`text-[0.7rem] font-bold ${
                        active ? 'text-[#1e2617]' : 'text-[#1e2617]/55'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sage/25 px-5 py-7 sm:px-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-olive">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
