"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateContact } from "@/server/crm";
import { contactTypeLabel, CONTACT_TYPES } from "@/lib/display";
import CountrySelect from "@/components/CountrySelect";

type Contact = {
  id: string;
  name: string;
  type: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  genres: string | null;
  followedArtists: string | null;
  socials: string | null;
  notes: string | null;
};

export default function ContactEditForm({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateContact, null);
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
      <button className="btn btn-sm" onClick={() => setOpen(true)}>Modifier</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 480, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Modifier le contact</h2>
            <form action={action}>
              <input type="hidden" name="id" value={contact.id} />
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="name">Nom *</label>
                  <input id="name" name="name" className="input" defaultValue={contact.name} required />
                </div>
                <div className="field">
                  <label htmlFor="type">Type *</label>
                  <select id="type" name="type" className="select" defaultValue={contact.type} required>
                    {CONTACT_TYPES.map((t) => (
                      <option key={t} value={t}>{contactTypeLabel[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="organization">Organisation</label>
                <input id="organization" name="organization" className="input" defaultValue={contact.organization ?? ""} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" className="input" defaultValue={contact.email ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Téléphone</label>
                  <input id="phone" name="phone" className="input" defaultValue={contact.phone ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="country">Pays</label>
                  <CountrySelect id="country" defaultValue={contact.country} />
                </div>
                <div className="field">
                  <label htmlFor="city">Ville</label>
                  <input id="city" name="city" className="input" defaultValue={contact.city ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="language">Langue</label>
                  <input id="language" name="language" className="input" placeholder="Français, Anglais…" defaultValue={contact.language ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="socials">Réseaux / site</label>
                  <input id="socials" name="socials" className="input" defaultValue={contact.socials ?? ""} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="genres">Genres couverts</label>
                <input id="genres" name="genres" className="input" placeholder="Afrobeats, Gospel, Jazz…" defaultValue={contact.genres ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="followedArtists">Artistes suivis</label>
                <input id="followedArtists" name="followedArtists" className="input" defaultValue={contact.followedArtists ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" className="textarea" defaultValue={contact.notes ?? ""} />
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
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
