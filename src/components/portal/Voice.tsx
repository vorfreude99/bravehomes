'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { voiceUrl } from '@/lib/db';

/** Longest recording we accept, so a pocket-press cannot run for ever. */
const MAX_MS = 120_000;

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Hold-free recorder: press to start, press to send.
 *
 * Deliberately not press-and-hold. Holding a button steady is exactly
 * the gesture a tremor makes difficult, and letting go early loses the
 * message — the failure lands on the person least able to recover from
 * it. Two taps, with a visible timer and a way out, is kinder.
 */
export function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (blob: Blob, durationMs: number) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [denied, setDenied] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const started = useRef(0);
  const timer = useRef<number | null>(null);
  const keep = useRef(true);

  const stopTracks = () => {
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const finish = useCallback(() => {
    keep.current = true;
    recorder.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    keep.current = false;
    recorder.current?.stop();
  }, []);

  const start = useCallback(async () => {
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorder.current = rec;
      chunks.current = [];
      keep.current = true;

      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const ms = Date.now() - started.current;
        stopTracks();
        setRecording(false);
        setElapsed(0);
        // Under a second is almost always a mis-tap, not a message.
        if (keep.current && chunks.current.length && ms >= 1000) {
          onRecorded(new Blob(chunks.current, { type: rec.mimeType }), ms);
        }
      };

      started.current = Date.now();
      rec.start();
      setRecording(true);

      timer.current = window.setInterval(() => {
        const ms = Date.now() - started.current;
        setElapsed(ms);
        if (ms >= MAX_MS) finish();
      }, 200);
    } catch {
      setDenied(true);
    }
  }, [finish, onRecorded]);

  useEffect(() => stopTracks, []);

  if (denied) {
    return (
      <p className="text-sm text-clay">
        No microphone. Check your browser’s permission and try again.
      </p>
    );
  }

  if (!recording) {
    return (
      <button
        type="button"
        onClick={() => void start()}
        disabled={disabled}
        aria-label="Record a voice message"
        className="flex h-[var(--bh-tap)] w-[var(--bh-tap)] shrink-0 items-center justify-center rounded-full border-2 border-sage/40 text-forest transition-colors hover:border-forest hover:bg-sage-mist/60 disabled:opacity-50"
      >
        <Icon name="mic" size={22} />
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-3 rounded-3xl border-2 border-clay/50 bg-clay/5 px-4 py-2">
      <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
        <span
          className="decorative absolute inline-flex h-full w-full rounded-full bg-clay"
          style={{ animation: 'bh-pulse-ring 1.4s ease-out infinite' }}
        />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-clay" />
      </span>

      <span className="font-semibold tabular-nums text-forest" role="timer">
        {clock(elapsed)}
      </span>
      <span className="flex-1 text-sm text-olive">Recording…</span>

      <button
        type="button"
        onClick={cancel}
        className="min-h-[var(--bh-tap)] rounded-full px-4 font-semibold text-olive hover:text-forest"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={finish}
        className="min-h-[var(--bh-tap)] rounded-full bg-forest px-5 font-semibold text-cream"
      >
        Send
      </button>
    </div>
  );
}

/**
 * Playback for one voice note.
 *
 * The URL is signed and short-lived, so it is fetched on first play
 * rather than for every message in the thread at once.
 */
export function VoicePlayer({
  path,
  durationMs,
  mine,
}: {
  path: string;
  durationMs?: number | null;
  mine: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const toggle = async () => {
    if (playing) {
      audio.current?.pause();
      return;
    }

    let src = url;
    if (!src) {
      setBusy(true);
      src = await voiceUrl(path);
      setBusy(false);
      if (!src) return;
      setUrl(src);
    }

    if (!audio.current) {
      audio.current = new Audio(src);
      audio.current.onended = () => setPlaying(false);
      audio.current.onpause = () => setPlaying(false);
      audio.current.onplay = () => setPlaying(true);
    }
    void audio.current.play();
  };

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      className={`flex min-h-[var(--bh-tap)] items-center gap-3 rounded-3xl px-4 py-3 text-left ${
        mine ? 'rounded-br-lg bg-forest text-cream' : 'rounded-bl-lg bg-sage-mist text-forest'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          mine ? 'bg-cream/20' : 'bg-forest/10'
        }`}
        aria-hidden="true"
      >
        {busy ? '…' : <Icon name={playing ? 'chat' : 'mic'} size={20} />}
      </span>
      <span>
        <span className="block font-semibold">
          {playing ? 'Playing…' : 'Voice message'}
        </span>
        {durationMs ? (
          <span className={`block text-sm ${mine ? 'text-cream/75' : 'text-olive'}`}>
            {clock(durationMs)}
          </span>
        ) : null}
      </span>
    </button>
  );
}
