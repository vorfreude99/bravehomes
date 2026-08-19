'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { CallProvider } from './CallProvider';
import { BrandLock } from '@/components/ui/Brand';
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
      <div className="min-h-[100svh] lg:grid lg:grid-cols-[17rem_1fr]">
        {/* --------------------------- Desktop rail --------------------------- */}
        <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-sage/25 bg-cream-deep/30 p-6 lg:flex">
          <BrandLock href="/portal" size={40} showTagline={false} />

          <nav aria-label="Portal" className="mt-10 flex flex-1 flex-col gap-1">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[var(--bh-tap)] items-center gap-3 rounded-2xl px-4 text-lg font-semibold transition ${
                    active
                      ? 'bg-forest text-cream'
                      : 'text-olive hover:bg-sage-mist/60 hover:text-forest'
                  }`}
                >
                  <Icon name={tab.icon} size={22} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-sage/25 pt-5">
            <SimpleModeToggle className="w-full justify-center" />
            <div className="flex items-center gap-3 px-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-mist font-bold text-forest">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-forest">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-sm text-ink-muted underline underline-offset-2 hover:text-forest"
                >
                  Sign out
                </button>
              </span>
            </div>
          </div>
        </aside>

        {/* ------------------------------ Content ----------------------------- */}
        <div className="flex min-w-0 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sage/25 bg-cream/90 px-5 py-3 backdrop-blur-xl lg:hidden">
            <BrandLock href="/portal" size={34} showTagline={false} />
            <SimpleModeToggle />
          </header>

          <main id="main" className="flex-1 pb-28 lg:pb-0">
            {children}
          </main>

          {/* Mobile tab bar — mirrors the phone design exactly. */}
          <nav
            aria-label="Portal"
            className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sage/25 bg-cream/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
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
                      active ? 'text-forest' : 'text-ink-muted'
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

/** Consistent page header inside the portal. */
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
