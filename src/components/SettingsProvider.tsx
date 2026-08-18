'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Settings = {
  /** Larger type, bigger targets, no decorative motion. */
  simple: boolean;
  toggleSimple: () => void;
};

const SettingsContext = createContext<Settings | null>(null);
const STORAGE_KEY = 'bh:simple-mode';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [simple, setSimple] = useState(false);

  // Restore the preference before first paint of interactive content.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') setSimple(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.simple = String(simple);
    window.localStorage.setItem(STORAGE_KEY, String(simple));
  }, [simple]);

  const toggleSimple = useCallback(() => setSimple((s) => !s), []);

  const value = useMemo(() => ({ simple, toggleSimple }), [simple, toggleSimple]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/** Floating control so the accessibility switch is reachable everywhere. */
export function SimpleModeToggle({ className = '' }: { className?: string }) {
  const { simple, toggleSimple } = useSettings();

  return (
    <button
      type="button"
      onClick={toggleSimple}
      aria-pressed={simple}
      className={`inline-flex min-h-[var(--bh-tap)] items-center gap-2 whitespace-nowrap rounded-full border border-sage/40 bg-parchment/90 px-4 py-2 text-sm font-semibold text-forest shadow-sm transition hover:border-forest hover:bg-parchment ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.7-4.7" />
        {simple && <path d="M10.5 7.5v6M7.5 10.5h6" />}
      </svg>
      {simple ? 'Easy view is on' : 'Easy view'}
    </button>
  );
}
