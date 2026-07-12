"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTrack } from "@/server/tracks";

export default function TrackUploader({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files).filter(
      (f) => /\.wav$/i.test(f.name) || f.type.includes("wav")
    );
    if (list.length === 0) {
      setError("Seuls les fichiers WAV sont acceptés.");
      return;
    }
    for (const file of list) {
      setBusy(file.name);
      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("title", file.name.replace(/\.[^.]+$/, ""));
      fd.set("file", file);
      const res = await addTrack(null, fd);
      if (res && "error" in res && res.error) setError(res.error);
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
          + Ajouter des titres (WAV)
        </button>
        {busy && (
          <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
            Import et conversion : {busy}…
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".wav,audio/wav"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
