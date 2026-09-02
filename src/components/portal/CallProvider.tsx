'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  createPeer,
  getLocalStream,
  logCallOutcome,
  sendSignal,
  subscribeToSignals,
  type Signal,
} from '@/lib/calls';

/** How long a call rings before the caller gives up and it counts as missed. */
const RING_TIMEOUT_MS = 45_000;

type Phase = 'idle' | 'ringing-out' | 'ringing-in' | 'connecting' | 'live' | 'failed';

type CallApi = { call: (id: string, name: string) => void; busy: boolean };

const Ctx = createContext<CallApi | null>(null);

/** Lets any screen start a call. Returns null outside the portal. */
export function useCalls(): CallApi | null {
  return useContext(Ctx);
}

/**
 * Owns the peer connection and the call UI.
 *
 * Mounted once around the whole portal rather than inside chat, because
 * a call has to be answerable wherever the person happens to be — if
 * this lived in the chat screen, ringing anyone not sitting on that page
 * would fail silently.
 */
export function CallProvider({
  meId,
  meName,
  children,
}: {
  meId: string;
  meName: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [peerName, setPeerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const peerId = useRef<string | null>(null);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  /* Candidates can arrive before the description they belong to. */
  const earlyIce = useRef<RTCIceCandidateInit[]>([]);
  const ringTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectGrace = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `phase`/`peerName` as refs, mirrored alongside the state. Code that
   * runs inside an async callback (a signal arriving, a timer firing)
   * needs the *current* value, not whatever it closed over at the start
   * of the render it was created in — reading the state variable there
   * is exactly the stale-closure bug that let a cancelled call's leftover
   * timer act on a totally different, later call.
   */
  const phaseRef = useRef<Phase>('idle');
  const peerNameRef = useRef('');
  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);
  const setPeerNameBoth = useCallback((n: string) => {
    peerNameRef.current = n;
    setPeerName(n);
  }, []);

  /**
   * Bumped every time the call state is reset. Anything async (an
   * in-flight `call()`, a ring timer) captures the id it started with
   * and checks it's still current before acting — so cancelling a call
   * mid-setup, or right before the ring timeout fires, can't have that
   * leftover work land on whatever call happens to be active later.
   */
  const attempt = useRef(0);
  /* Synchronous re-entrancy guard: `phase` is React state, so two clicks
     before the first `setPhase('ringing-out')` commits would both see
     'idle' and both start a call. This is checked and set immediately,
     not after a render. */
  const starting = useRef(false);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const clearRingTimeout = useCallback(() => {
    if (ringTimeout.current) {
      clearTimeout(ringTimeout.current);
      ringTimeout.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    attempt.current += 1;
    // Belt and suspenders on top of `/api/turn`'s own fetch timeout: if
    // `call()`/`accept()` is ever still stuck mid-setup when this runs
    // (hanging on "End call" is always reachable — the ringing screen
    // renders before that async work finishes), this guarantees the
    // re-entrancy lock can't survive past a manual hang-up either.
    starting.current = false;
    clearRingTimeout();
    if (disconnectGrace.current) {
      clearTimeout(disconnectGrace.current);
      disconnectGrace.current = null;
    }
    pc.current?.close();
    pc.current = null;
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = null;
    peerId.current = null;
    pendingOffer.current = null;
    earlyIce.current = [];
    setPhaseBoth('idle');
    setPeerNameBoth('');
    setMuted(false);
    setCameraOff(false);
  }, [clearRingTimeout, setPhaseBoth, setPeerNameBoth]);

  const hangUp = useCallback(() => {
    if (peerId.current) {
      void sendSignal(peerId.current, { kind: 'hangup', from: meId });
    }
    teardown();
  }, [meId, teardown]);

  /** Builds the connection and wires both directions of media. */
  const preparePeer = useCallback(
    async (otherId: string) => {
      const stream = await getLocalStream();
      local.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;

      const conn = await createPeer();
      pc.current = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));

      conn.ontrack = (e) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
        setPhaseBoth('live');
      };
      conn.onicecandidate = (e) => {
        if (e.candidate) {
          void sendSignal(otherId, {
            kind: 'ice',
            from: meId,
            candidate: e.candidate.toJSON(),
          });
        }
      };
      conn.onconnectionstatechange = () => {
        if (conn.connectionState === 'failed') {
          // Almost always NAT with no relay to fall back on.
          setError('The call could not connect. This usually means the network is blocking it.');
          setPhaseBoth('failed');
          return;
        }
        if (conn.connectionState === 'connected' && disconnectGrace.current) {
          clearTimeout(disconnectGrace.current);
          disconnectGrace.current = null;
          return;
        }
        if (conn.connectionState === 'disconnected') {
          // A brief wifi/cellular handoff often recovers on its own —
          // especially likely on the older, mobile-heavy audience this
          // is built for. Only give up if it's still down a few seconds
          // later, rather than killing a call that would have healed.
          if (disconnectGrace.current) clearTimeout(disconnectGrace.current);
          disconnectGrace.current = setTimeout(() => {
            disconnectGrace.current = null;
            if (pc.current === conn && conn.connectionState === 'disconnected') teardown();
          }, 8000);
        }
      };

      return conn;
    },
    [meId, teardown, setPhaseBoth],
  );

  /* --------------------------- outgoing call --------------------------- */
  const call = useCallback(
    (otherId: string, otherName: string) => {
      if (phaseRef.current !== 'idle' || starting.current) return;
      starting.current = true;
      const myAttempt = ++attempt.current;
      setError(null);
      setPeerNameBoth(otherName);
      peerId.current = otherId;
      setPhaseBoth('ringing-out');

      void (async () => {
        try {
          const conn = await preparePeer(otherId);
          // Cancelled (teardown, or a newer attempt) while awaiting the
          // camera/mic prompt — this attempt is dead, don't resurrect it.
          if (attempt.current !== myAttempt) {
            conn.close();
            return;
          }
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          await sendSignal(otherId, {
            kind: 'offer',
            from: meId,
            fromName: meName,
            sdp: offer,
          });
          if (attempt.current !== myAttempt) return;
          // Nobody picked up, and no decline came back either — count it
          // as missed rather than leaving the caller ringing forever.
          ringTimeout.current = setTimeout(() => {
            if (attempt.current !== myAttempt) return;
            void logCallOutcome(meId, otherId, 'missed');
            hangUp();
          }, RING_TIMEOUT_MS);
        } catch {
          if (attempt.current === myAttempt) {
            setError('No camera or microphone. Check your browser’s permission.');
            setPhaseBoth('failed');
          }
        } finally {
          starting.current = false;
        }
      })();
    },
    [hangUp, meId, meName, preparePeer, setPeerNameBoth, setPhaseBoth],
  );

  /* --------------------------- incoming call --------------------------- */
  const accept = useCallback(() => {
    if (starting.current) return;
    const otherId = peerId.current;
    const offer = pendingOffer.current;
    if (!otherId || !offer) return;

    starting.current = true;
    const myAttempt = ++attempt.current;
    setPhaseBoth('connecting');
    void (async () => {
      try {
        const conn = await preparePeer(otherId);
        if (attempt.current !== myAttempt) {
          conn.close();
          return;
        }
        await conn.setRemoteDescription(offer);
        for (const c of earlyIce.current) {
          try {
            await conn.addIceCandidate(c);
          } catch {
            // A candidate that no longer applies — safe to skip.
          }
        }
        earlyIce.current = [];

        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        await sendSignal(otherId, { kind: 'answer', from: meId, sdp: answer });
      } catch {
        if (attempt.current === myAttempt) {
          setError('No camera or microphone. Check your browser’s permission.');
          setPhaseBoth('failed');
        }
      } finally {
        starting.current = false;
      }
    })();
  }, [meId, preparePeer, setPhaseBoth]);

  const decline = useCallback(() => {
    if (peerId.current) {
      void sendSignal(peerId.current, { kind: 'decline', from: meId });
    }
    teardown();
  }, [meId, teardown]);

  /* ------------------------------ signals ------------------------------
     Deliberately depends on almost nothing that changes during a call
     (just the stable callbacks) — `phase`/`peerName` are read from the
     refs above instead. Re-subscribing this channel on every phase change
     (idle → ringing → connecting → live, four-plus times a call) briefly
     tears down and recreates the broadcast channel each time, and it
     doesn't queue — a signal from the other side arriving in that gap
     would simply be lost. */
  useEffect(() => {
    return subscribeToSignals(meId, (s: Signal) => {
      void (async () => {
        if (s.kind === 'offer') {
          // One call at a time: anything arriving mid-call is declined
          // rather than silently dropped.
          if (pc.current || phaseRef.current !== 'idle') {
            await sendSignal(s.from, { kind: 'decline', from: meId });
            return;
          }
          peerId.current = s.from;
          pendingOffer.current = s.sdp ?? null;
          setPeerNameBoth(s.fromName || 'Someone');
          setPhaseBoth('ringing-in');
          return;
        }

        // Everything past this point is about an existing call — a signal
        // naming someone other than our current peer is stale (a leftover
        // from a call that already ended) and must not touch this one.
        if (s.from !== peerId.current) return;

        if (s.kind === 'answer' && pc.current && s.sdp) {
          clearRingTimeout();
          await pc.current.setRemoteDescription(s.sdp);
          for (const c of earlyIce.current) {
            try {
              await pc.current.addIceCandidate(c);
            } catch {
              // A candidate that no longer applies — safe to skip.
            }
          }
          earlyIce.current = [];
          setPhaseBoth('connecting');
          return;
        }

        if (s.kind === 'ice' && s.candidate) {
          try {
            if (pc.current?.remoteDescription) {
              await pc.current.addIceCandidate(s.candidate);
            } else {
              earlyIce.current.push(s.candidate);
            }
          } catch {
            // Late or invalid for the current session — safe to ignore.
          }
          return;
        }

        if (s.kind === 'hangup' || s.kind === 'decline') {
          // A decline is only ever sent back to whoever placed the call.
          if (s.kind === 'decline') {
            setError(`${peerNameRef.current || 'They'} could not take the call.`);
            void logCallOutcome(meId, s.from, 'declined');
          }
          teardown();
        }
      })();
    });
  }, [meId, teardown, clearRingTimeout, setPeerNameBoth, setPhaseBoth]);

  useEffect(() => teardown, [teardown]);

  const toggleMute = () => {
    const track = local.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = local.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  };

  const inCall = phase === 'connecting' || phase === 'live';

  return (
    <Ctx.Provider value={{ call, busy: phase !== 'idle' }}>
      {children}

      {/* ---------------------------- Incoming ---------------------------- */}
      {phase === 'ringing-in' && (
        <div className="fixed inset-0 z-[60] flex h-dvh items-center justify-center bg-[#1a1a1a]/70 p-5 backdrop-blur">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[#1a1a1a]"
              style={{ background: '#f5d64e' }}
            >
              <Icon name="video" size={28} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#1a1a1a]">
              {peerName} is calling
            </h2>
            <p className="mt-2 text-[#1a1a1a]/60">Video call</p>

            <div className="mt-7 grid gap-3">
              <button
                type="button"
                onClick={accept}
                className="press flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full text-lg font-bold text-[#1a1a1a] transition-all"
                style={{ background: '#f5d64e' }}
              >
                Answer
              </button>
              <button
                type="button"
                onClick={decline}
                className="press flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full bg-[#1a1a1a]/[0.06] text-lg font-semibold text-[#1a1a1a] transition-all hover:bg-[#1a1a1a]/[0.1]"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- Outgoing / live ------------------------
          `h-dvh`, not just `inset-0`, matters here specifically: mobile
          browsers compute `inset-0` on a `fixed` element against the
          *layout* viewport (the size once the address bar auto-hides),
          not the *visual* one (what's actually on screen right now). With
          only `inset-0`, this whole panel — including the control bar at
          the bottom — silently rendered taller than the visible screen
          while the address bar was showing, which is exactly why the End
          call / mute buttons only appeared once the page was scrolled
          and the browser chrome collapsed out of the way. `dvh` is the
          unit that's defined to track the real, current visible area. */}
      {(phase === 'ringing-out' || inCall || phase === 'failed') && (
        <div className="fixed inset-0 z-[60] flex h-dvh flex-col bg-[#1a1a1a]">
          <div className="relative flex-1">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="h-full w-full bg-[#111] object-cover"
            />

            {phase !== 'live' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-3xl font-semibold tracking-tight text-white">{peerName}</p>
                <p className="text-white/60">
                  {phase === 'ringing-out' && 'Ringing…'}
                  {phase === 'connecting' && 'Connecting…'}
                  {phase === 'failed' && (error ?? 'The call ended.')}
                </p>
              </div>
            )}

            {/* Your own picture, small, out of the way. */}
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 h-40 w-28 rounded-2xl border-2 border-white/25 object-cover shadow-xl sm:h-52 sm:w-36"
            />
          </div>

          <div className="flex items-center justify-center gap-4 bg-[#1a1a1a] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className={`flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border-2 ${
                muted ? 'border-[#b3402f] bg-[#b3402f]/20 text-[#b3402f]' : 'border-white/30 text-white'
              }`}
            >
              <Icon name="mic" size={22} />
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              aria-pressed={cameraOff}
              aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
              className={`flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border-2 ${
                cameraOff ? 'border-[#b3402f] bg-[#b3402f]/20 text-[#b3402f]' : 'border-white/30 text-white'
              }`}
            >
              <Icon name="video" size={22} />
            </button>

            <button
              type="button"
              onClick={hangUp}
              className="press flex min-h-[var(--bh-tap)] items-center justify-center rounded-full px-8 text-lg font-bold text-[#1a1a1a] transition-all"
              style={{ background: '#f5d64e' }}
            >
              {phase === 'failed' ? 'Close' : 'End call'}
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
