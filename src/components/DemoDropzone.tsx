"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDemo } from "@/server/tracks";
import { uploadDirect } from "@/lib/upload-client";

export default function DemoDropzone({ artistId }: { artistId: string }) {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files).filter(
      (f) => /\.mp3$/i.test(f.name) || f.type === "audio/mpeg"
    );
    if (list.length === 0) {
      setError("Seuls les fichiers MP3 sont acceptés.");
      return;
    }

    for (const file of list) {
      setQueue((q) => [...q, file.name]);
      try {
        const { audioId, durationSec } = await uploadDirect("demo", file);
        const fd = new FormData();
        fd.set("artistId", artistId);
        fd.set("title", file.name.replace(/\.[^.]+$/, ""));
        fd.set("audioId", audioId);
        if (durationSec) fd.set("durationSec", String(durationSec));
        const r = await addDemo(null, fd);
        if (r && "error" in r && r.error) setError(r.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
      setQueue((q) => q.filter((n) => n !== file.name));
    }
    startTransition(() => router.refresh());
  }

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
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--xol-yellow-deep)" : "var(--border-strong)"}`,
          background: dragging ? "#fdf7e6" : "var(--surface-2)",
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.14s",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--xol-indigo)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        </svg>
        <div style={{ fontWeight: 500 }}>
          Glisse des demos ici, ou clique pour choisir
        </div>
        <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 2 }}>
          Fichiers MP3 · rattachés à aucun projet
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {(queue.length > 0 || pending) && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-soft)" }}>
          {queue.map((n) => (
            <div key={n} className="row" style={{ gap: 8, marginTop: 4 }}>
              <Spinner /> {n} — envoi en cours…
            </div>
          ))}
          {pending && queue.length === 0 && <div>Actualisation…</div>}
        </div>
      )}

      {error && (
        <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginTop: 10 }}>{error}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--xol-indigo)" strokeWidth="2">
      <path d="M12 2a10 10 0 019 6" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
