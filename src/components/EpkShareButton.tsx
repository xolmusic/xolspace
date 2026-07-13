"use client";

import { useActionState, useState } from "react";
import { createEpkShareLink } from "@/server/epk";

export default function EpkShareButton({ epkId }: { epkId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createEpkShareLink, null);

  return (
    <>
      <button className="btn btn-sm" type="button" onClick={() => setOpen(true)}>
        Partager l&apos;EPK
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 440, maxWidth: "100%" }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Partager l&apos;EPK</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>Un lien public vers le dossier de presse.</p>

            {state?.ok ? (
              <div>
                <p style={{ color: "#1c7a4a", marginBottom: 14 }}>Lien créé. Retrouve-le dans « Liens de partage ».</p>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => setOpen(false)}>Fermer</button>
                </div>
              </div>
            ) : (
              <form action={action}>
                <input type="hidden" name="epkId" value={epkId} />
                <div className="field">
                  <label htmlFor="label">Nom du lien</label>
                  <input id="label" name="label" className="input" placeholder="Envoi booking, presse…" />
                </div>
                <div className="field">
                  <label htmlFor="expiresAt">Expiration (optionnel)</label>
                  <input id="expiresAt" name="expiresAt" type="date" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="password">Mot de passe (optionnel)</label>
                  <input id="password" name="password" className="input" />
                </div>
                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? "Création…" : "Créer le lien"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
