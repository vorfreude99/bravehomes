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
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  createPeer,
  getLocalStream,
  sendSignal,
  subscribeToSignals,
  type Signal,
} from '@/lib/calls';

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

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const teardown = useCallback(() => {
    pc.current?.close();
    pc.current = null;
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = null;
    peerId.current = null;
    pendingOffer.current = null;
    earlyIce.current = [];
    setPhase('idle');
    setPeerName('');
    setMuted(false);
    setCameraOff(false);
  }, []);

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

      const conn = createPeer();
      pc.current = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));

      conn.ontrack = (e) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
        setPhase('live');
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
          setPhase('failed');
        }
        if (conn.connectionState === 'disconnected') teardown();
      };

      return conn;
    },
    [meId, teardown],
  );

  /* --------------------------- outgoing call --------------------------- */
  const call = useCallback(
    (otherId: string, otherName: string) => {
      if (phase !== 'idle') return;
      setError(null);
      setPeerName(otherName);
      peerId.current = otherId;
      setPhase('ringing-out');

      void (async () => {
        try {
          const conn = await preparePeer(otherId);
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          await sendSignal(otherId, {
            kind: 'offer',
            from: meId,
            fromName: meName,
            sdp: offer,
          });
        } catch {
          setError('No camera or microphone. Check your browser’s permission.');
          setPhase('failed');
        }
      })();
    },
    [meId, meName, phase, preparePeer],
  );

  /* --------------------------- incoming call --------------------------- */
  const accept = useCallback(() => {
    const otherId = peerId.current;
    const offer = pendingOffer.current;
    if (!otherId || !offer) return;

    setPhase('connecting');
    void (async () => {
      try {
        const conn = await preparePeer(otherId);
        await conn.setRemoteDescription(offer);
        for (const c of earlyIce.current) await conn.addIceCandidate(c);
        earlyIce.current = [];

        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        await sendSignal(otherId, { kind: 'answer', from: meId, sdp: answer });
      } catch {
        setError('No camera or microphone. Check your browser’s permission.');
        setPhase('failed');
      }
    })();
  }, [meId, preparePeer]);

  const decline = useCallback(() => {
    if (peerId.current) {
      void sendSignal(peerId.current, { kind: 'decline', from: meId });
    }
    teardown();
  }, [meId, teardown]);

  /* ------------------------------ signals ------------------------------ */
  useEffect(() => {
    return subscribeToSignals(meId, (s: Signal) => {
      void (async () => {
        if (s.kind === 'offer') {
          // One call at a time: anything arriving mid-call is declined
          // rather than silently dropped.
          if (pc.current || phase !== 'idle') {
            await sendSignal(s.from, { kind: 'decline', from: meId });
            return;
          }
          peerId.current = s.from;
          pendingOffer.current = s.sdp ?? null;
          setPeerName(s.fromName || 'Someone');
          setPhase('ringing-in');
          return;
        }

        if (s.kind === 'answer' && pc.current && s.sdp) {
          await pc.current.setRemoteDescription(s.sdp);
          for (const c of earlyIce.current) await pc.current.addIceCandidate(c);
          earlyIce.current = [];
          setPhase('connecting');
          return;
        }

        if (s.kind === 'ice' && s.candidate) {
          if (pc.current?.remoteDescription) {
            await pc.current.addIceCandidate(s.candidate);
          } else {
            earlyIce.current.push(s.candidate);
          }
          return;
        }

        if (s.kind === 'hangup' || s.kind === 'decline') {
          if (s.kind === 'decline') setError(`${peerName || 'They'} could not take the call.`);
          teardown();
        }
      })();
    });
  }, [meId, phase, peerName, teardown]);

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night/80 p-5 backdrop-blur">
          <div className="w-full max-w-sm rounded-[var(--bh-radius)] bg-cream p-8 text-center shadow-2xl">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-mist text-forest">
              <Icon name="video" size={28} />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-medium text-forest">
              {peerName} is calling
            </h2>
            <p className="mt-2 text-olive">Video call</p>

            <div className="mt-7 grid gap-3">
              <Button onClick={accept} size="lg" className="w-full">
                Answer
              </Button>
              <Button onClick={decline} variant="secondary" size="lg" className="w-full">
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- Outgoing / live ------------------------ */}
      {(phase === 'ringing-out' || inCall || phase === 'failed') && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-night">
          <div className="relative flex-1">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="h-full w-full bg-forest-deep object-cover"
            />

            {phase !== 'live' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="font-serif text-3xl font-medium text-cream">{peerName}</p>
                <p className="text-sage-soft">
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
              className="absolute bottom-4 right-4 h-40 w-28 rounded-2xl border-2 border-cream/25 object-cover shadow-xl sm:h-52 sm:w-36"
            />
          </div>

          <div className="flex items-center justify-center gap-4 bg-night px-5 py-6">
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className={`flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border-2 ${
                muted ? 'border-clay bg-clay/20 text-clay' : 'border-cream/30 text-cream'
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
                cameraOff ? 'border-clay bg-clay/20 text-clay' : 'border-cream/30 text-cream'
              }`}
            >
              <Icon name="video" size={22} />
            </button>

            <Button onClick={hangUp} variant="gold" size="lg" className="px-8">
              {phase === 'failed' ? 'Close' : 'End call'}
            </Button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
