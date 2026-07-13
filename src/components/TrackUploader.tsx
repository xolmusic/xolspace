"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTrack } from "@/server/tracks";
import { uploadDirect } from "@/lib/upload-client";

export default function TrackUploader({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | File[]) {
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
        fd.set("projectId", projectId);
        fd.set("title", file.name.replace(/\.[^.]+$/, ""));
        fd.set("audioId", audioId);
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

  return (
    <div>
      <div className="row" style={{ gap: 10 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          type="button"
          disabled={!!busy}
        >
          + Ajouter des titres (MP3)
        </button>
        {busy && (
          <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
            Envoi : {busy}…
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
