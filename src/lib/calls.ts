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
 * STUN is Google's public server, which is free. What is missing is
 * TURN: when both people sit behind NAT that blocks a direct connection
 * — common on mobile networks, which matters here because older users
 * are disproportionately on them — the call cannot connect at all. That
 * needs a relay, and a relay costs bandwidth. `ICE_SERVERS` is where a
 * TURN entry goes when that day comes.
 */
const ICE_SERVERS: RTCIceServer[] = [
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

export function createPeer(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
}

/** Camera and microphone. Throws if permission is refused. */
export function getLocalStream() {
  return navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
}
