"use client";

import { useActionState, useState } from "react";
import { createShareLink } from "@/server/links";

type Props = {
  targetType: "PROJECT" | "TRACK" | "ARTIST";
  targetId: string;
  returnTo: string;
  small?: boolean;
};

export default function ShareButton({ targetType, targetId, returnTo, small }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createShareLink, null);

  const labels = {
    PROJECT: "ce projet",
    TRACK: "cette chanson",
    ARTIST: "cet artiste",
  };

  return (
    <>
      <button
        className={`btn ${small ? "btn-sm" : ""}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        Partager
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
            style={{ width: 460, maxWidth: "100%" }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Créer un lien de partage</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
              Un lien public d&apos;écoute pour {labels[targetType]}.
            </p>

            {state?.ok ? (
              <div>
                <p style={{ color: "#1c7a4a", marginBottom: 14 }}>
                  Lien créé. Retrouve-le dans « Liens de partage » pour le copier.
                </p>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => setOpen(false)}>
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form action={action}>
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="targetId" value={targetId} />
                <input type="hidden" name="returnTo" value={returnTo} />

                <div className="field">
                  <label htmlFor="label">Nom du lien</label>
                  <input
                    id="label"
                    name="label"
                    className="input"
                    placeholder="Envoi presse, distributeur…"
                  />
                </div>

                

                <div className="field">
                  <label htmlFor="expiresAt">Expiration (optionnel)</label>
                  <input id="expiresAt" name="expiresAt" type="date" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="password">Mot de passe (optionnel)</label>
                  <input id="password" name="password" type="text" className="input" placeholder="Laisse vide pour un accès libre" />
                </div>

                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" className="btn" onClick={() => setOpen(false)}>
                    Annuler
                  </button>
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
