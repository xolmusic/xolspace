"use client";

import { useState } from "react";
import { addRecipients } from "@/server/campaigns";
import { contactTypeLabel, CONTACT_TYPES } from "@/lib/display";

export default function RecipientTargeting({
  campaignId,
  countries,
}: {
  campaignId: string;
  countries: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
        + Cibler des contacts
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 440, maxWidth: "100%" }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Cibler des contacts</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Ajoute à la campagne tous les contacts (avec email) correspondant aux critères.
              Les doublons sont ignorés automatiquement.
            </p>
            <form action={addRecipients} onSubmit={() => setTimeout(() => setOpen(false), 150)}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <div className="field">
                <label htmlFor="type">Type de média</label>
                <select id="type" name="type" className="select" defaultValue="">
                  <option value="">Tous les types</option>
                  {CONTACT_TYPES.map((t) => (
                    <option key={t} value={t}>{contactTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="country">Pays</label>
                <select id="country" name="country" className="select" defaultValue="">
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter à la campagne</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
