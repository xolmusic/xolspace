"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  title: string;
  subtitle?: string;
  onPlay?: () => void;
};

function fmt(sec: number) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, title, subtitle, onPlay }: Props) {
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
            marginTop: 8,
            height: 6,
            cursor: "pointer",
            borderRadius: 3,
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
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </div>
  );
}
