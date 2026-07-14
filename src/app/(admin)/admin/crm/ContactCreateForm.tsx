"use client";

import { useActionState, useState } from "react";
import { createContact } from "@/server/crm";
import { contactTypeLabel, CONTACT_TYPES } from "@/lib/display";
import CountrySelect from "@/components/CountrySelect";

export default function ContactCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createContact, null);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Nouveau contact
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 480, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Nouveau contact</h2>
            <form action={action}>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="name">Nom *</label>
                  <input id="name" name="name" className="input" required />
                </div>
                <div className="field">
                  <label htmlFor="type">Type *</label>
                  <select id="type" name="type" className="select" defaultValue="JOURNALIST" required>
                    {CONTACT_TYPES.map((t) => (
                      <option key={t} value={t}>{contactTypeLabel[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="organization">Organisation</label>
                <input id="organization" name="organization" className="input" placeholder="Média, station, agence…" />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Téléphone</label>
                  <input id="phone" name="phone" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="country">Pays</label>
                  <CountrySelect id="country" />
                </div>
                <div className="field">
                  <label htmlFor="city">Ville</label>
                  <input id="city" name="city" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="language">Langue</label>
                  <input id="language" name="language" className="input" placeholder="Français, Anglais…" />
                </div>
                <div className="field">
                  <label htmlFor="socials">Réseaux / site</label>
                  <input id="socials" name="socials" className="input" placeholder="lien" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="genres">Genres couverts</label>
                <input id="genres" name="genres" className="input" placeholder="Afrobeats, Gospel, Jazz…" />
              </div>
              <div className="field">
                <label htmlFor="followedArtists">Artistes suivis</label>
                <input id="followedArtists" name="followedArtists" className="input" />
              </div>
              <div className="field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" className="textarea" />
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Création…" : "Créer le contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
