"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createInteraction } from "@/server/crm";
import { interactionStatusLabel, INTERACTION_STATUSES } from "@/lib/display";

type ShareOption = { token: string; label: string };

export default function InteractionForm({
  contactId,
  shareOptions,
}: {
  contactId: string;
  shareOptions: ShareOption[];
}) {
  const [open, setOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"internal" | "external">("internal");
  const [state, action, pending] = useActionState(createInteraction, null);
  const router = useRouter();

  if (state?.ok && open) {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
        + Nouvel échange
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 500, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Nouvel échange</h2>
            <form action={action}>
              <input type="hidden" name="contactId" value={contactId} />

              <div className="field">
                <label htmlFor="subject">Objet</label>
                <input id="subject" name="subject" className="input" placeholder="Sortie EP Kallya, pitch playlist…" />
              </div>

              {/* Lien envoye : interne ou externe */}
              <div className="field">
                <label>Lien envoyé</label>
                <div className="row" style={{ gap: 6, marginBottom: 8 }}>
                  <button type="button" className={`btn btn-xs ${linkMode === "internal" ? "btn-primary" : ""}`} onClick={() => setLinkMode("internal")}>
                    Lien de l&apos;outil
                  </button>
                  <button type="button" className={`btn btn-xs ${linkMode === "external" ? "btn-primary" : ""}`} onClick={() => setLinkMode("external")}>
                    Lien libre
                  </button>
                </div>
                {linkMode === "internal" ? (
                  <select name="shareToken" className="select" defaultValue="">
                    <option value="">— Aucun —</option>
                    {shareOptions.map((s) => (
                      <option key={s.token} value={s.token}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <input name="externalUrl" className="input" placeholder="https://…" />
                )}
              </div>

              <div className="field">
                <label htmlFor="status">Statut</label>
                <select id="status" name="status" className="select" defaultValue="SENT">
                  {INTERACTION_STATUSES.map((s) => (
                    <option key={s} value={s}>{interactionStatusLabel[s]}</option>
                  ))}
                </select>
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="sentAt">Date d&apos;envoi</label>
                  <input id="sentAt" name="sentAt" type="date" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="repliedAt">Date de réponse</label>
                  <input id="repliedAt" name="repliedAt" type="date" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="followUpAt">Relance prévue</label>
                  <input id="followUpAt" name="followUpAt" type="date" className="input" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" className="textarea" placeholder="Retour, contexte, prochaine étape…" />
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
