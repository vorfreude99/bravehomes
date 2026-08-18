export type IconName =
  | 'profile'
  | 'chat'
  | 'search'
  | 'home'
  | 'heart'
  | 'coffee'
  | 'mail'
  | 'lock'
  | 'globe'
  | 'mic'
  | 'video'
  | 'check'
  | 'arrow-right';

/**
 * One consistent set of line icons, drawn rather than borrowed.
 *
 * These replace the emoji the interface used to run on. Emoji are drawn
 * by the operating system, so the same "icon" is a different shape,
 * weight and colour on every device — we already hit exactly that with
 * the flags, which rendered as bare letters on Windows. They also read
 * as unfinished: a product whose navigation is emoji looks like a mockup
 * of itself.
 *
 * All of them share a 24px box, a 1.6 stroke and `currentColor`, so they
 * inherit type colour and sit on the same optical weight as the text
 * beside them.
 */
const PATHS: Record<IconName, React.ReactNode> = {
  profile: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  chat: <path d="M20 14.4a2.4 2.4 0 0 1-2.4 2.4H8L4 20V6a2.4 2.4 0 0 1 2.4-2.4h11.2A2.4 2.4 0 0 1 20 6z" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m20 20-4.6-4.6" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 19z" />
      <path d="M9.6 20.4v-6h4.8v6" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.2-4.4-7.2-9.2A4 4 0 0 1 12 8.4a4 4 0 0 1 7.2 2.4C19.2 15.6 12 20 12 20z" />
  ),
  coffee: (
    <>
      <path d="M4.8 9h11.6v5.6a4.4 4.4 0 0 1-4.4 4.4H9.2a4.4 4.4 0 0 1-4.4-4.4z" />
      <path d="M16.4 10.4h1.6a2.2 2.2 0 0 1 0 4.4h-1.6" />
      <path d="M8 3.2v2.4M12 3.2v2.4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.6" y="5.2" width="16.8" height="13.6" rx="2" />
      <path d="m4 7 8 5.6L20 7" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="9.2" rx="2" />
      <path d="M8.4 10.4V7.6a3.6 3.6 0 0 1 7.2 0v2.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.4 2.2 2.4 13.8 0 16M12 4c-2.4 2.2-2.4 13.8 0 16" />
    </>
  ),
  mic: (
    <>
      <rect x="9.2" y="3.2" width="5.6" height="10.4" rx="2.8" />
      <path d="M5.6 11.6a6.4 6.4 0 0 0 12.8 0M12 18v2.8" />
    </>
  ),
  video: (
    <>
      <rect x="3.2" y="6.4" width="12" height="11.2" rx="2" />
      <path d="m15.2 12 5.6-3.2v6.4z" />
    </>
  ),
  check: <path d="m4.8 12.4 4.8 4.8L19.2 7.2" />,
  'arrow-right': <path d="M4.8 12h14.4m-5.6-5.6L19.2 12l-5.6 5.6" />,
};

export function Icon({
  name,
  size = 20,
  className = '',
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
