"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateArtist, deleteArtist } from "@/server/artists";
import CountrySelect from "@/components/CountrySelect";

type Artist = {
  id: string;
  stageName: string;
  country: string | null;
  bio: string | null;
  relationType: string;
  mandateNotes: string | null;
};

export default function ArtistEditForm({ artist }: { artist: Artist }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateArtist, null);
  const router = useRouter();

  // Ne se declenche qu'a l'arrivee d'un NOUVEAU resultat d'action.
  // (Fermer pendant le rendu rendait le formulaire irrouvrable :
  //  state.ok restait vrai, la fenetre se refermait aussitot.)
  useEffect(() => {
    if (!state?.ok) return;
    setOpen(false);
    router.refresh();
  }, [state, router]);

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)} type="button">
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
            style={{ width: 460, maxWidth: "100%", maxHeight: "90vh", overflow: "auto" }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 18 }}>Modifier l&apos;artiste</h2>
            <form action={action}>
              <input type="hidden" name="id" value={artist.id} />
              <div className="field">
                <label htmlFor="stageName">Nom d&apos;artiste *</label>
                <input id="stageName" name="stageName" className="input" defaultValue={artist.stageName} required />
              </div>
              <div className="field">
                <label htmlFor="relationType">Type de relation *</label>
                <select id="relationType" name="relationType" className="select" defaultValue={artist.relationType}>
                  <option value="LABEL">Label (artiste signé)</option>
                  <option value="EXTERNAL">Externe (mandat de réalisation)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="country">Pays de résidence</label>
                <CountrySelect id="country" defaultValue={artist.country} />
              </div>
              <div className="field">
                <label htmlFor="photo">Changer la photo</label>
                <input id="photo" name="photo" type="file" accept="image/*" className="input" style={{ paddingTop: 8 }} />
              </div>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea id="bio" name="bio" className="textarea" defaultValue={artist.bio ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="mandateNotes">Cadre du mandat (artistes externes)</label>
                <textarea id="mandateNotes" name="mandateNotes" className="textarea" defaultValue={artist.mandateNotes ?? ""} placeholder="Nature de la prestation, périmètre, échéances…" />
              </div>

              {state?.error && (
                <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>
              )}

              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <button
                  type="submit"
                  formAction={deleteArtist}
                  className="btn btn-sm"
                  style={{ color: "var(--xol-carmin)" }}
                  onClick={(e) => {
                    if (!confirm("Supprimer cet artiste et tout son contenu ?")) e.preventDefault();
                  }}
                >
                  Supprimer
                </button>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn" onClick={() => setOpen(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
