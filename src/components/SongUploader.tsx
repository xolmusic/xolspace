"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTrack } from "@/server/tracks";
import { uploadDirect } from "@/lib/upload-client";

// Uploader unifie de titres MP3 (upload direct vers R2).
// - projectId fourni  -> le titre entre dans ce projet (artiste = celui du projet)
// - artistId fourni    -> titre rattache a l'artiste, hors projet
// variant "button" = bouton compact ; "drop" = zone glisser-deposer.
export default function SongUploader({
  projectId,
  artistId,
  variant = "button",
  label,
}: {
  projectId?: string;
  artistId?: string;
  variant?: "button" | "drop";
  label?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handle(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files).filter(
      (f) => /\.mp3$/i.test(f.name) || f.type === "audio/mpeg"
    );
    if (list.length === 0) {
      setError("Seuls les fichiers MP3 sont acceptés.");
      return;
    }
    for (const file of list) {
      setBusy(file.name);
      try {
        const { audioId, durationSec } = await uploadDirect("track", file);
        const fd = new FormData();
        fd.set("title", file.name.replace(/\.[^.]+$/, ""));
        fd.set("audioId", audioId);
        if (projectId) fd.set("projectId", projectId);
        if (artistId) fd.set("artistId", artistId);
        if (durationSec) fd.set("durationSec", String(durationSec));
        const r = await addTrack(null, fd);
        if (r && "error" in r && r.error) setError(r.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
    }
    setBusy(null);
    startTransition(() => router.refresh());
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".mp3,audio/mpeg"
      multiple
      hidden
      onChange={(e) => e.target.files && handle(e.target.files)}
    />
  );

  if (variant === "drop") {
    return (
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--xol-yellow-deep)" : "var(--border-strong)"}`,
            background: dragging ? "#fdf7e6" : "var(--surface-2)",
            borderRadius: 12,
            padding: "26px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.14s",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--xol-indigo)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
            <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
          </svg>
          <div style={{ fontWeight: 500 }}>{label ?? "Glisse des titres ici, ou clique pour choisir"}</div>
          <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 2 }}>Fichiers MP3</div>
          {input}
        </div>
        {busy && (
          <p style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 10 }}>Envoi : {busy}…</p>
        )}
        {error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="row" style={{ gap: 10 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          type="button"
          disabled={!!busy}
        >
          {label ?? "+ Ajouter des titres (MP3)"}
        </button>
        {busy && <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Envoi : {busy}…</span>}
      </div>
      {input}
      {error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
