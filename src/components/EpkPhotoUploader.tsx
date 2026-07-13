"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEpkPhoto } from "@/server/epk";

export default function EpkPhotoUploader({ epkId }: { epkId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handle(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Choisis une image.");
      return;
    }
    setBusy(true);
    for (const file of list) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const res = await fetch("/api/epk-photo-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type, ext }),
        });
        if (!res.ok) throw new Error("Autorisation refusée.");
        const { id, ext: safeExt, uploadUrl } = await res.json();
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        if (!put.ok) throw new Error("Envoi échoué.");
        const fd = new FormData();
        fd.set("epkId", epkId);
        fd.set("photoId", id);
        fd.set("ext", safeExt);
        await addEpkPhoto(null, fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec.");
      }
    }
    setBusy(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <button className="btn btn-sm btn-primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? "Envoi…" : "+ Ajouter des photos"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && handle(e.target.files)} />
      {error && <p style={{ color: "var(--xol-carmin)", fontSize: 13, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
