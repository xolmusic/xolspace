"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTrack } from "@/server/tracks";
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
          </div>
        </div>
      )}
    </>
  );
}
