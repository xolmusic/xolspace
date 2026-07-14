"use client";

import { useActionState, useState } from "react";
import { createCampaign } from "@/server/campaigns";

type Artist = { id: string; stageName: string };
type Project = { id: string; title: string; artistId: string };

export default function CampaignCreateForm({
  artists,
  projects,
}: {
  artists: Artist[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [state, action, pending] = useActionState(createCampaign, null);

  const artistProjects = projects.filter((p) => p.artistId === artistId);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Nouvelle campagne
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 480, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Nouvelle campagne</h2>
            <form action={action}>
              <div className="field">
                <label htmlFor="name">Nom de la campagne *</label>
                <input id="name" name="name" className="input" placeholder="Nouveau single — Artiste X" required />
              </div>
              <div className="field">
                <label htmlFor="artistId">Artiste *</label>
                <select id="artistId" name="artistId" className="select" value={artistId} onChange={(e) => setArtistId(e.target.value)} required>
                  <option value="">Choisir un artiste</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.stageName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="projectId">Projet (optionnel)</label>
                <select id="projectId" name="projectId" className="select" defaultValue="" disabled={!artistId}>
                  <option value="">— Aucun projet —</option>
                  {artistProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pitch">Pitch (angle du morceau)</label>
                <textarea id="pitch" name="pitch" className="textarea" placeholder="En quelques lignes, l'histoire et l'angle presse du morceau." />
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Création…" : "Créer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
