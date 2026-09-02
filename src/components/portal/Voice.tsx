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
      <p className="text-sm font-semibold text-[#b3402f]">
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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]/[0.05] text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
      >
        <Icon name="mic" size={22} />
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-3 rounded-3xl bg-[#1a1a1a]/[0.04] px-4 py-2">
      <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
        <span
          className="decorative absolute inline-flex h-full w-full rounded-full bg-[#b3402f]"
          style={{ animation: 'bh-pulse-ring 1.4s ease-out infinite' }}
        />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#b3402f]" />
      </span>

      <span className="font-semibold tabular-nums text-[#1a1a1a]" role="timer">
        {clock(elapsed)}
      </span>
      <span className="flex-1 text-sm text-[#1a1a1a]/60">Recording…</span>

      <button
        type="button"
        onClick={cancel}
        className="min-h-[var(--bh-tap)] rounded-full px-4 font-semibold text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={finish}
        className="min-h-[var(--bh-tap)] rounded-full bg-[#f5d64e] px-5 font-semibold text-[#1a1a1a] transition-transform hover:scale-[1.03]"
      >
        Send
      </button>
    </div>
  );
}

/**
 * Playback for one voice note.
 *
 * Two things happen the moment this mounts, not on click:
 *
 * 1. The signed URL is fetched ahead of time — iOS Safari only allows
 *    `.play()` when it runs synchronously inside the tap that triggered
 *    it, and awaiting the URL first was exactly enough to lose that:
 *    the play call landed a tick late, Safari silently refused it, and
 *    tapping "play" did nothing.
 * 2. The file itself is downloaded into a blob and played from an
 *    object URL, not streamed straight from the signed URL. Safari's
 *    own `MediaRecorder` output is a fragmented MP4 with the duration
 *    metadata spread through it rather than sitting up front, and
 *    Safari can fail to make sense of that while range-requesting it
 *    over the network — the exact same bytes play back fine once
 *    they're a local blob it can inspect in full before decoding.
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
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    void voiceUrl(path)
      .then((src) => (src ? fetch(src) : null))
      .then((res) => (res?.ok ? res.blob() : null))
      .then((blob) => {
        if (alive && blob) objectUrlRef.current = URL.createObjectURL(blob);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path]);

  const play = (src: string) => {
    if (!audio.current) {
      audio.current = new Audio(src);
      audio.current.onended = () => setPlaying(false);
      audio.current.onpause = () => setPlaying(false);
      audio.current.onplay = () => {
        setFailed(false);
        setPlaying(true);
      };
      audio.current.onerror = () => {
        setPlaying(false);
        setBusy(false);
        setFailed(true);
      };
    }
    audio.current.play().catch(() => {
      setPlaying(false);
      setBusy(false);
      setFailed(true);
    });
  };

  const toggle = () => {
    if (playing) {
      audio.current?.pause();
      return;
    }

    // The common case: the blob was already downloaded, so this runs
    // `.play()` synchronously in the click itself.
    if (objectUrlRef.current) {
      play(objectUrlRef.current);
      return;
    }

    // Prefetch hasn't landed yet — best effort, may still lose the
    // gesture on iOS, but this is a rare race rather than the norm.
    setBusy(true);
    void voiceUrl(path)
      .then((src) => (src ? fetch(src) : null))
      .then((res) => (res?.ok ? res.blob() : null))
      .then((blob) => {
        setBusy(false);
        if (!blob) {
          setFailed(true);
          return;
        }
        objectUrlRef.current = URL.createObjectURL(blob);
        play(objectUrlRef.current);
      })
      .catch(() => {
        setBusy(false);
        setFailed(true);
      });
  };

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Stop voice message' : 'Play voice message'}
      className={`flex min-h-[var(--bh-tap)] items-center gap-3 rounded-3xl px-4 py-3 text-left ${
        mine
          ? 'rounded-br-lg bg-[#f5d64e] text-[#1a1a1a]'
          : 'rounded-bl-lg border border-[#1a1a1a]/[0.06] bg-white text-[#1a1a1a] shadow-[0_1px_2px_rgba(26,26,26,0.05)]'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          mine ? 'bg-white/55 text-[#1a1a1a]' : 'bg-[#f5d64e] text-[#1a1a1a]'
        }`}
        aria-hidden="true"
      >
        {busy ? '…' : <Icon name={playing ? 'pause' : 'play'} size={20} />}
      </span>
      <span>
        <span className="block font-semibold">
          {failed ? "Couldn't play — tap to retry" : playing ? 'Playing…' : 'Voice message'}
        </span>
        {durationMs ? (
          <span className={`block text-sm ${mine ? 'text-[#1a1a1a]/60' : 'text-[#1a1a1a]/60'}`}>
            {clock(durationMs)}
          </span>
        ) : null}
      </span>
    </button>
  );
}
