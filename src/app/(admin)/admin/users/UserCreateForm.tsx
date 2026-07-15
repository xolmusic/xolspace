"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/server/users";

export default function UserCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUser, null);
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
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Nouvel utilisateur
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Nouvel utilisateur</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              La personne pourra se connecter avec cet email et ce mot de passe.
            </p>
            <form action={action}>
              <div className="field">
                <label htmlFor="name">Nom</label>
                <input id="name" name="name" className="input" placeholder="Prénom Nom" />
              </div>
              <div className="field">
                <label htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" className="input" required />
              </div>
              <div className="field">
                <label htmlFor="password">Mot de passe *</label>
                <input id="password" name="password" type="text" className="input" required minLength={8} placeholder="8 caractères minimum" />
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Transmets-le à la personne : il ne sera plus lisible ensuite.
                </p>
              </div>
              <div className="field">
                <label htmlFor="role">Rôle *</label>
                <select id="role" name="role" className="select" defaultValue="USER">
                  <option value="USER">Utilisateur — accès à tout sauf la gestion des utilisateurs</option>
                  <option value="SUPER_ADMIN">Super admin — accès total</option>
                </select>
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Création…" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
