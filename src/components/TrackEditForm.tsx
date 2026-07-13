"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTrack, replaceTrackAudio } from "@/server/tracks";
import { uploadDirect } from "@/lib/upload-client";
import GenreSelect from "./GenreSelect";

type Track = {
  id: string;
  title: string;
  artistId: string;
  projectId: string | null;
  genre: string | null;
  bpm: number | null;
  songKey: string | null;
  isrc: string | null;
};

type Artist = { id: string; stageName: string };
type Project = { id: string; title: string; artistId: string };

export default function TrackEditForm({
  track,
  artists,
  projects,
}: {
  track: Track;
  artists: Artist[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateTrack, null);
  const [projectId, setProjectId] = useState(track.projectId ?? "");
  const router = useRouter();

  if (state?.ok && open) {
    setOpen(false);
    router.refresh();
  }

  // Si un projet est choisi, l'artiste est impose par le projet.
  const lockedArtist = projectId
    ? projects.find((p) => p.id === projectId)?.artistId
    : null;

  return (
    <>
      <button className="btn btn-xs" onClick={() => setOpen(true)} type="button">
        Modifier
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(33,30,66,0.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: 480, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 18 }}>Modifier le titre</h2>
            <form action={action}>
              <input type="hidden" name="id" value={track.id} />

              <div className="field">
                <label htmlFor="title">Titre *</label>
                <input id="title" name="title" className="input" defaultValue={track.title} required />
              </div>

              <div className="field">
                <label htmlFor="projectId">Projet</label>
                <select
                  id="projectId"
                  name="projectId"
                  className="select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">— Aucun projet (titre libre) —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="artistId">Artiste *</label>
                <select
                  id="artistId"
                  name="artistId"
                  className="select"
                  defaultValue={track.artistId}
                  disabled={!!lockedArtist}
                  key={lockedArtist ?? "free"}
                  {...(lockedArtist ? { value: lockedArtist } : {})}
                >
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stageName}
                    </option>
                  ))}
                </select>
                {lockedArtist && (
                  <span style={{ fontSize: 12, color: "var(--text-mute)" }}>
                    L&apos;artiste suit le projet choisi.
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="genre">Genre</label>
                <GenreSelect id="genre" defaultValue={track.genre} />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="bpm">BPM</label>
                  <input id="bpm" name="bpm" type="number" className="input" defaultValue={track.bpm ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="songKey">Tonalité</label>
                  <input id="songKey" name="songKey" className="input" defaultValue={track.songKey ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="isrc">ISRC</label>
                  <input id="isrc" name="isrc" className="input" defaultValue={track.isrc ?? ""} />
                </div>
              </div>

              {state?.error && (
                <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>
              )}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>

            <ReplaceAudio trackId={track.id} onDone={() => { setOpen(false); router.refresh(); }} />
          </div>
        </div>
      )}
    </>
  );
}

function ReplaceAudio({ trackId, onDone }: { trackId: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handle(file: File) {
    setError(null);
    if (!/\.mp3$/i.test(file.name) && file.type !== "audio/mpeg") {
      setError("Seuls les fichiers MP3 sont acceptés.");
      return;
    }
    setBusy(true);
    try {
      const { audioId, durationSec } = await uploadDirect("track", file);
      const fd = new FormData();
      fd.set("id", trackId);
      fd.set("audioId", audioId);
      if (durationSec) fd.set("durationSec", String(durationSec));
      const r = await replaceTrackAudio(null, fd);
      if (r && "error" in r && r.error) {
        setError(r.error);
      } else {
        setDone(true);
        setTimeout(onDone, 900);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    }
    setBusy(false);
  }

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        Fichier audio
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
        Remplace le MP3 par une meilleure version (nouveau mix, master corrigé).
        Les liens de partage et le placement du titre sont conservés.
      </p>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Envoi…" : done ? "Fichier remplacé ✓" : "Remplacer le fichier"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        hidden
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      {error && (
        <p style={{ color: "var(--xol-carmin)", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}
