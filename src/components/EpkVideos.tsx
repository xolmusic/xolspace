"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addEpkVideo, deleteEpkVideo } from "@/server/epk";
import { youtubeId } from "@/lib/youtube";

type Video = { id: string; url: string; title: string | null };

export default function EpkVideos({ epkId, videos }: { epkId: string; videos: Video[] }) {
  const [state, action, pending] = useActionState(addEpkVideo, null);
  const router = useRouter();
  if (state?.ok) router.refresh();

  return (
    <div>
      <form action={action} className="row" style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input type="hidden" name="epkId" value={epkId} />
        <input name="url" className="input" style={{ flex: 2, minWidth: 220 }} placeholder="Lien YouTube (clip, live…)" required />
        <input name="title" className="input" style={{ flex: 1, minWidth: 140 }} placeholder="Titre (optionnel)" />
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </button>
      </form>
      {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 13, marginBottom: 10 }}>{state.error}</p>}

      {videos.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {videos.map((v) => {
            const id = youtubeId(v.url);
            return (
              <div key={v.id} className="card" style={{ padding: 10 }}>
                {id ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 8, overflow: "hidden" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${id}`}
                      title={v.title ?? "Vidéo"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                    />
                  </div>
                ) : (
                  <p className="muted" style={{ fontSize: 13 }}>Lien non reconnu : {v.url}</p>
                )}
                <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 13 }}>{v.title || "Vidéo"}</span>
                  <form action={deleteEpkVideo}>
                    <input type="hidden" name="id" value={v.id} />
                    <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--xol-carmin)" }}>✕</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
