"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendCampaign } from "@/server/campaigns";

export default function SendCampaignButton({
  campaignId,
  toSendCount,
  configured,
}: {
  campaignId: string;
  toSendCount: number;
  configured: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function doSend() {
    const fd = new FormData();
    fd.set("campaignId", campaignId);
    startTransition(async () => {
      const r = await sendCampaign(fd);
      if ("error" in r) setResult(`Erreur : ${r.error}`);
      else setResult(`Envoyés : ${r.sent} · Échecs : ${r.failed} · Ignorés (sans email) : ${r.skipped}`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        className="btn btn-sm btn-primary"
        onClick={() => { setResult(null); setOpen(true); }}
        disabled={toSendCount === 0}
        title={toSendCount === 0 ? "Aucun destinataire à envoyer" : ""}
      >
        Envoyer ({toSendCount})
      </button>

      {open && (
        <div onClick={() => !pending && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 440, maxWidth: "100%" }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Envoyer la campagne</h2>

            {!configured && (
              <div style={{ background: "#fff8f0", border: "1px solid var(--xol-yellow-deep)", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13 }}>
                Le service d&apos;envoi n&apos;est pas encore configuré (clé Resend et domaine).
                L&apos;envoi échouera tant que ce n&apos;est pas en place.
              </div>
            )}

            {result ? (
              <>
                <p style={{ fontSize: 14, marginBottom: 16 }}>{result}</p>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => setOpen(false)}>Fermer</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, marginBottom: 6 }}>
                  {toSendCount} email{toSendCount > 1 ? "s" : ""} personnalisé{toSendCount > 1 ? "s" : ""} vont être envoyés
                  aux destinataires « à envoyer » ayant un email et non désinscrits.
                </p>
                <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                  Chaque message contient un lien de suivi et une désinscription. Si les relances
                  automatiques sont activées, elles seront programmées.
                </p>
                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn" onClick={() => setOpen(false)} disabled={pending}>Annuler</button>
                  <button className="btn btn-primary" onClick={doSend} disabled={pending}>
                    {pending ? "Envoi en cours…" : "Confirmer l'envoi"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
