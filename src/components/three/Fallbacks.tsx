/**
 * Static stand-ins for each 3D scene.
 *
 * These are not error states — they are the design for anyone on
 * reduced-motion, an old device, or no WebGL. They carry the same
 * meaning as the scene they replace.
 */

export function HeroFallback() {
  return (
    <div className="h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 800 560" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="bh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#edf1e8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <radialGradient id="bh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ddbc7c" />
            <stop offset="100%" stopColor="#ddbc7c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="560" fill="url(#bh-sky)" />
        <circle cx="620" cy="130" r="150" fill="url(#bh-sun)" />
        <circle cx="620" cy="130" r="46" fill="#c99a3f" />

        {/* Island */}
        <ellipse cx="400" cy="410" rx="250" ry="52" fill="#7f9068" />
        <path d="M150 410 L400 560 L650 410 Z" fill="#6b7a4a" />

        {/* House */}
        <rect x="330" y="290" width="140" height="100" rx="4" fill="#fffdf8" />
        <path d="M320 292 L400 222 L480 292 Z" fill="#2f3a23" />
        <rect x="378" y="336" width="34" height="54" rx="3" fill="#2f3a23" />
        <rect x="344" y="310" width="28" height="24" rx="3" fill="#c99a3f" />
        <rect x="428" y="310" width="28" height="24" rx="3" fill="#c99a3f" />
        <rect x="446" y="238" width="18" height="40" fill="#c9704f" />

        {/* Trees */}
        {[
          [232, 396, 1],
          [560, 392, 0.9],
          [286, 376, 0.7],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x="-5" y="-30" width="10" height="34" fill="#7a5a3a" />
            <circle cy="-48" r="34" fill="#2f3a23" />
          </g>
        ))}

        {/* Two people, either side of the home */}
        <g fill="#4a5337">
          <circle cx="268" cy="330" r="15" fill="#a2b28e" />
          <rect x="257" y="346" width="22" height="42" rx="10" fill="#7f9068" />
          <circle cx="536" cy="336" r="15" fill="#ddbc7c" />
          <rect x="525" y="352" width="22" height="38" rx="10" fill="#c9704f" />
        </g>

        {/* Pollen */}
        {[
          [200, 200],
          [300, 150],
          [520, 210],
          [610, 300],
          [180, 300],
          [420, 140],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#c99a3f" opacity="0.55" />
        ))}
      </svg>
    </div>
  );
}

/**
 * Ambient stand-in for the island-less hero: the same warm sky and
 * scattered pollen the canvas draws, minus the motion.
 */
export function HeroAmbientFallback() {
  const pollen = [
    [120, 180],
    [260, 96],
    [420, 240],
    [560, 130],
    [690, 300],
    [780, 170],
    [180, 400],
    [330, 470],
    [620, 440],
    [740, 60],
  ];

  return (
    <div className="h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 800 520" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="bh-amb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#edf1e8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <radialGradient id="bh-amb-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ddbc7c" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ddbc7c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="520" fill="url(#bh-amb-sky)" />
        <circle cx="640" cy="110" r="200" fill="url(#bh-amb-sun)" />

        {pollen.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5 : 3} fill="#c99a3f" opacity="0.5" />
        ))}
      </svg>
    </div>
  );
}

/**
 * Pollen alone, on a transparent ground — for the full-bleed photo hero,
 * where anything opaque would cover the photograph.
 */
export function HeroPollenFallback() {
  const pollen = [
    [90, 140],
    [220, 320],
    [340, 90],
    [470, 260],
    [560, 400],
    [640, 150],
    [720, 330],
    [150, 440],
    [400, 480],
    [760, 60],
  ];

  return (
    <div className="h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 800 520" className="h-full w-full" role="presentation">
        {pollen.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.5} fill="#ddbc7c" opacity="0.55" />
        ))}
      </svg>
    </div>
  );
}

export function ConstellationFallback() {
  const young = [
    [560, 150],
    [620, 210],
    [590, 280],
    [660, 160],
    [640, 300],
  ];
  const elder = [
    [240, 160],
    [180, 220],
    [220, 290],
    [140, 170],
    [160, 300],
  ];

  return (
    <div className="h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 800 440" className="h-full w-full" role="presentation">
        {young.map(([x1, y1], i) => {
          const [x2, y2] = elder[i];
          return (
            <path
              key={i}
              d={`M${x1} ${y1} Q400 ${60 + i * 24} ${x2} ${y2}`}
              fill="none"
              stroke="#a2b28e"
              strokeWidth="1.5"
              opacity="0.5"
            />
          );
        })}
        {young.map(([x, y], i) => (
          <circle key={`y${i}`} cx={x} cy={y} r="7" fill="#c99a3f" />
        ))}
        {elder.map(([x, y], i) => (
          <circle key={`e${i}`} cx={x} cy={y} r="7" fill="#7f9068" />
        ))}
      </svg>
    </div>
  );
}

export function GlobeFallback() {
  return (
    <div className="h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="h-full w-full" role="presentation">
        <circle cx="200" cy="200" r="140" fill="#2f3a23" />
        {[-90, -60, -30, 0, 30, 60, 90].map((lat) => {
          const ry = Math.abs(Math.cos((lat * Math.PI) / 180)) * 140;
          return (
            <ellipse
              key={lat}
              cx="200"
              cy={200 - Math.sin((lat * Math.PI) / 180) * 140}
              rx={ry}
              ry={ry * 0.22}
              fill="none"
              stroke="#7f9068"
              strokeWidth="1"
              opacity="0.45"
            />
          );
        })}
        <ellipse
          cx="200"
          cy="200"
          rx="52"
          ry="140"
          fill="none"
          stroke="#7f9068"
          strokeWidth="1"
          opacity="0.4"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="105"
          ry="140"
          fill="none"
          stroke="#7f9068"
          strokeWidth="1"
          opacity="0.3"
        />
        {[
          [232, 118],
          [186, 132],
          [214, 250],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="16" fill="#c99a3f" opacity="0.2" />
            <circle cx={x} cy={y} r="6" fill="#c99a3f" />
          </g>
        ))}
      </svg>
    </div>
  );
}

