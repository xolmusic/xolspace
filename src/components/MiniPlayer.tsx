"use client";

import { useRef, useState, useEffect } from "react";

// Version compacte du lecteur, pour les lignes de tableau.
// Un seul bouton play/pause ; la lecture se fait en place.
export default function MiniPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, []);

  function toggle() {
    // Un seul lecteur audible a la fois : on coupe les autres.
    document.querySelectorAll("audio").forEach((el) => {
      if (el !== audioRef.current) el.pause();
    });
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  }

  return (
    <span className="miniplay">
      <audio ref={audioRef} src={src} preload="none" />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Lire"}
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "var(--xol-yellow)",
          color: "var(--xol-indigo-deep)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {playing ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </span>
  );
}
