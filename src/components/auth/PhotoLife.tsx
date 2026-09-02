'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * The living layer over the sign-in photograph: rising hearts, floating
 * product chips, and a whisper of pointer parallax — the chips lean a
 * few pixels toward the mouse, the hearts lean away, which is what makes
 * the scene read as deep instead of flat.
 *
 * All of it is decorative and all of it sits still for reduced motion.
 */
const HEARTS = [
  { left: '12%', size: 22, dur: '13s', delay: '-2s', sway: '30px', o: 0.4 },
  { left: '30%', size: 14, dur: '17s', delay: '-9s', sway: '-24px', o: 0.32 },
  { left: '55%', size: 26, dur: '11s', delay: '-5s', sway: '20px', o: 0.45 },
  { left: '74%', size: 16, dur: '15s', delay: '-12s', sway: '-30px', o: 0.35 },
  { left: '88%', size: 20, dur: '19s', delay: '-1s', sway: '18px', o: 0.4 },
];

export function PhotoLife() {
  const stage = useRef<HTMLDivElement>(null);
  const near = useRef<HTMLDivElement>(null);
  const far = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stage.current?.parentElement;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const tick = () => {
      // Ease toward the pointer rather than snapping to it.
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (near.current)
        near.current.style.transform = `translate3d(${cx * 10}px, ${cy * 8}px, 0)`;
      if (far.current)
        far.current.style.transform = `translate3d(${cx * -6}px, ${cy * -5}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={stage} className="absolute inset-0" aria-hidden="true">
      {/* Hearts drift up through the photograph, leaning away from the
          pointer — the far plane. */}
      <div ref={far} className="decorative pointer-events-none absolute inset-0">
        {HEARTS.map((h, i) => (
          <span
            key={i}
            className="heart-float text-gold"
            style={
              {
                left: h.left,
                fontSize: h.size,
                '--dur': h.dur,
                '--delay': h.delay,
                '--sw': h.sway,
                '--o': h.o,
              } as CSSProperties
            }
          >
            ♥
          </span>
        ))}
      </div>

      {/* The chips lean toward the pointer — the near plane. */}
      <div ref={near} className="pointer-events-none absolute inset-0">
        {/* A feature, not a testimonial — nobody real said this, so it
            doesn't wear a name or a quote mark. */}
        <div className="pop-in absolute left-8 top-12" style={{ animationDelay: '1150ms' }}>
          <div
            className="bob flex items-center gap-3 rounded-2xl bg-white/85 py-3 pl-3 pr-5 shadow-[0_18px_40px_-22px_rgba(47,58,35,0.5)] backdrop-blur-sm"
            style={{ '--dur': '5.5s', '--tilt': '-1.5deg' } as CSSProperties}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-mist text-forest">
              <Icon name="chat" size={17} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-forest">Real conversation</span>
              <span className="block text-xs text-olive">Text, voice, or a video call</span>
            </span>
          </div>
        </div>

        <div className="pop-in absolute bottom-16 right-8" style={{ animationDelay: '1450ms' }}>
          <div
            className="bob flex items-center gap-2.5 rounded-full bg-white/85 px-5 py-3 shadow-[0_18px_40px_-22px_rgba(47,58,35,0.5)] backdrop-blur-sm"
            style={{ '--dur': '6.5s', '--delay': '-2s', '--tilt': '1.5deg' } as CSSProperties}
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-sage" />
            <span className="text-sm font-semibold text-forest">A new hello every day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
