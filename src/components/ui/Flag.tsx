export type Region = 'uk' | 'global';

/**
 * Drawn, not emoji.
 *
 * Windows has no colour font for regional-indicator pairs, so 🇱🇹
 * renders as the bare letters "LT" for a large share of our visitors.
 * These always look the same everywhere.
 */
export function Flag({ region, size = 28 }: { region: Region; size?: number }) {
  const label = region === 'uk' ? 'United Kingdom' : 'Overseas';

  return (
    <svg
      width={size}
      height={size * 0.66}
      viewBox="0 0 30 20"
      role="img"
      aria-label={label}
      className="shrink-0 rounded-[3px]"
    >
      {region === 'uk' ? (
        // Union Flag, simplified: blue field, white saltire, red saltire,
        // then the white-fimbriated cross of St George over the top.
        <>
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="2" />
          <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6.5" />
          <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.5" />
        </>
      ) : (
        <>
          <rect width="30" height="20" rx="2" fill="#7f9068" />
          <circle cx="15" cy="10" r="7" fill="#dde4d3" />
          <path
            d="M8 10h14M15 3v14M10 5.5c2.5 2 2.5 7 0 9M20 5.5c-2.5 2-2.5 7 0 9"
            stroke="#2f3a23"
            strokeWidth="0.9"
            fill="none"
          />
        </>
      )}
      <rect
        width="30"
        height="20"
        rx="2"
        fill="none"
        stroke="rgba(47,58,35,0.25)"
        strokeWidth="1"
      />
    </svg>
  );
}
