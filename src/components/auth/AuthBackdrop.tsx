/**
 * Ground for the form side.
 *
 * Sage rather than cream, so the sign-in reads as part of the same
 * chapter as the homes section instead of as a blank page, and so the
 * white form card has something to sit on. Three soft washes plus the
 * shared grain give it depth — everything here stays well below the
 * contrast of any text on top of it.
 */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-40 -top-48 h-[42rem] w-[42rem] rounded-full opacity-90 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 72%)',
        }}
      />
      <div
        className="absolute -bottom-56 -right-40 h-[46rem] w-[46rem] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(201,154,63,0.62) 0%, rgba(201,154,63,0) 72%)',
        }}
      />
      <div
        className="absolute left-1/4 top-1/2 h-[34rem] w-[34rem] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(127,144,104,0.60) 0%, rgba(127,144,104,0) 72%)',
        }}
      />

      {/* Paper grain, so the gradients don't band on wide screens. */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
