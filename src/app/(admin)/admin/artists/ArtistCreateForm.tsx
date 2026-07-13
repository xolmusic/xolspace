"use client";

import { useActionState, useState } from "react";
import { createArtist } from "@/server/artists";
import CountrySelect from "@/components/CountrySelect";

export default function ArtistCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createArtist, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Nouvel artiste
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
            style={{ width: 460, maxWidth: "100%", maxHeight: "90vh", overflow: "auto" }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 18 }}>Nouvel artiste</h2>
            <form action={action}>
              <div className="field">
                <label htmlFor="stageName">Nom d&apos;artiste *</label>
                <input id="stageName" name="stageName" className="input" required />
              </div>
              <div className="field">
                <label htmlFor="relationType">Type de relation *</label>
                <select id="relationType" name="relationType" className="select" defaultValue="LABEL">
                  <option value="LABEL">Label (artiste signé)</option>
                  <option value="EXTERNAL">Externe (mandat de réalisation)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="country">Pays de résidence</label>
                <CountrySelect id="country" />
              </div>
              <div className="field">
                <label htmlFor="photo">Photo de profil</label>
                <input id="photo" name="photo" type="file" accept="image/*" className="input" style={{ paddingTop: 8 }} />
              </div>
              <div className="field">
                <label htmlFor="bio">Bio (optionnel)</label>
                <textarea id="bio" name="bio" className="textarea" />
              </div>
              <div className="field">
                <label htmlFor="mandateNotes">Cadre du mandat (artistes externes)</label>
                <textarea id="mandateNotes" name="mandateNotes" className="textarea" placeholder="Nature de la prestation, périmètre, échéances…" />
              </div>

              {state?.error && (
                <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>
                  {state.error}
                </p>
              )}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Création…" : "Créer l'artiste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
