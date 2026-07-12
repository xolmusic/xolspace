"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string; // URL de streaming (MP3 320 servi par notre API)
  title: string;
  subtitle?: string;
  waveform?: number[] | null;
  downloadUrl?: string | null; // present uniquement si le partage l'autorise
  onPlay?: () => void;
};

function fmt(sec: number) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  title,
  subtitle,
  waveform,
  downloadUrl,
  onPlay,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
      if (!played.current) {
        played.current = true;
        onPlay?.();
      }
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * dur;
  }

  const progress = dur ? cur / dur : 0;
  const bars = waveform && waveform.length ? waveform : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Lire"}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          flexShrink: 0,
          border: "none",
          cursor: "pointer",
          background: "var(--xol-yellow)",
          color: "var(--xol-indigo-deep)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              fontWeight: 500,
              fontSize: 14,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-soft)", flexShrink: 0 }}>
            {fmt(cur)} / {fmt(dur)}
          </span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 4 }}>
            {subtitle}
          </div>
        )}

        <div
          onClick={seek}
          style={{
            marginTop: 6,
            height: 34,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
          }}
        >
          {bars ? (
            bars.map((v, i) => {
              const active = i / bars.length <= progress;
              return (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(8, v * 100)}%`,
                    borderRadius: 1,
                    background: active
                      ? "var(--xol-indigo)"
                      : "var(--border-strong)",
                  }}
                />
              );
            })
          ) : (
            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 2,
                background: "var(--border-strong)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${progress * 100}%`,
                  background: "var(--xol-indigo)",
                  borderRadius: 2,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {downloadUrl && (
        <a
          href={downloadUrl}
          className="btn btn-sm"
          style={{ flexShrink: 0 }}
          aria-label="Télécharger"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
        </a>
      )}
    </div>
  );
}
