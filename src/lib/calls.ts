'use client';

import { createClient } from './supabase/client';

/**
 * 1:1 video calling over WebRTC.
 *
 * The media never touches a server: the two browsers talk directly. All
 * that travels through Supabase is signalling — a handful of small JSON
 * messages over the realtime channel the app already uses for chat, so
 * there is no signalling server to run.
 *
 * STUN alone can't connect two people who are both behind a restrictive
 * ("symmetric") NAT — common on mobile data, which matters here because
 * older users are disproportionately on it. `/api/turn` mints short-lived
 * Cloudflare TURN credentials (a relay, which is why they cost bandwidth
 * and aren't a static key baked into the bundle) when that's configured;
 * this falls back to Google's free public STUN otherwise, which still
 * connects most call pairs.
 */
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export type SignalKind = 'offer' | 'answer' | 'ice' | 'hangup' | 'decline';

export type Signal = {
  kind: SignalKind;
  from: string;
  fromName?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

/**
 * Listens for calls addressed to this user.
 *
 * Each person subscribes to a channel named for their own id, so a
 * signal is sent by broadcasting to the *recipient's* channel.
 */
export function subscribeToSignals(userId: string, onSignal: (s: Signal) => void) {
  const supabase = createClient();
  const channel = supabase
    .channel(`calls:${userId}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'signal' }, ({ payload }: { payload: Signal }) =>
      onSignal(payload),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Sends one signal to a specific person.
 *
 * A fresh channel per send rather than a long-lived one: subscribing is
 * cheap, and holding an open channel per correspondent would leak them
 * as the user moves around the portal.
 */
export async function sendSignal(toUserId: string, signal: Signal) {
  const supabase = createClient();
  const channel = supabase.channel(`calls:${toUserId}`);

  await new Promise<void>((resolve) => {
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') resolve();
    });
    // Never hang the UI on a channel that will not come up.
    setTimeout(resolve, 3000);
  });

  await channel.send({ type: 'broadcast', event: 'signal', payload: signal });
  await supabase.removeChannel(channel);
}

/**
 * Logs a call that went unanswered.
 *
 * Written by the caller, not the person who missed it: if they were
 * offline, their browser never ran to see the call happen at all, so
 * the only client guaranteed to witness the outcome is the one that
 * placed it. Best-effort — a stale schema (0008 not yet run) should
 * never break the call itself, so failures are swallowed.
 */
export async function logCallOutcome(
  callerId: string,
  calleeId: string,
  status: 'missed' | 'declined',
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('calls')
    .insert({ caller_id: callerId, callee_id: calleeId, status });
  // Never break the call over this, but a silent failure here means the
  // whole point of the feature — someone finding out they were called —
  // just stops working with nothing to notice by. Worth a trace.
  if (error) console.error('logCallOutcome failed:', error.message);
}

/**
 * A fresh set of ICE servers for one call. Fetched per call rather than
 * cached across them — calls are infrequent enough here that the extra
 * request is not worth the complexity of tracking credential expiry.
 *
 * Bounded to a few seconds: without this, a slow `/api/turn` (which
 * itself calls out to Cloudflare's analytics API before minting
 * anything) would leave `call()`/`accept()` hanging indefinitely on
 * "Ringing…", which — before this — could leave the app's re-entrancy
 * lock stuck permanently true, silently disabling calling until reload.
 */
async function iceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch('/api/turn', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return FALLBACK_ICE_SERVERS;
    const data = (await res.json()) as {
      configured: boolean;
      iceServers: RTCIceServer[] | null;
    };
    return data.configured && data.iceServers ? data.iceServers : FALLBACK_ICE_SERVERS;
  } catch {
    return FALLBACK_ICE_SERVERS;
  }
}

export async function createPeer(): Promise<RTCPeerConnection> {
  return new RTCPeerConnection({ iceServers: await iceServers() });
}

/** Camera and microphone. Throws if permission is refused. */
export function getLocalStream() {
  return navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
}
