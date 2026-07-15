"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/server/users";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export default function UserEditForm({ user, isMe }: { user: User; isMe: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateUser, null);
  const router = useRouter();

  if (state?.ok && open) {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-xs" onClick={() => setOpen(true)}>Modifier</button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Modifier l&apos;utilisateur</h2>
            <form action={action}>
              <input type="hidden" name="id" value={user.id} />
              <div className="field">
                <label htmlFor={`name-${user.id}`}>Nom</label>
                <input id={`name-${user.id}`} name="name" className="input" defaultValue={user.name ?? ""} />
              </div>
              <div className="field">
                <label htmlFor={`email-${user.id}`}>Email *</label>
                <input id={`email-${user.id}`} name="email" type="email" className="input" defaultValue={user.email} required />
              </div>
              <div className="field">
                <label htmlFor={`password-${user.id}`}>Nouveau mot de passe</label>
                <input id={`password-${user.id}`} name="password" type="text" className="input" placeholder="Laisser vide pour ne pas changer" />
              </div>
              <div className="field">
                <label htmlFor={`role-${user.id}`}>Rôle *</label>
                <select id={`role-${user.id}`} name="role" className="select" defaultValue={user.role} disabled={isMe}>
                  <option value="USER">Utilisateur — accès à tout sauf la gestion des utilisateurs</option>
                  <option value="SUPER_ADMIN">Super admin — accès total</option>
                </select>
                {isMe && (
                  <>
                    {/* Le champ desactive n'est pas soumis : on renvoie le role actuel. */}
                    <input type="hidden" name="role" value={user.role} />
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      C&apos;est ton compte : tu ne peux pas modifier ton propre rôle.
                    </p>
                  </>
                )}
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
