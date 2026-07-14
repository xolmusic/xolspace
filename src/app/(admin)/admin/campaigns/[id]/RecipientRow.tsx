"use client";

import { useState } from "react";
import { setRecipientStatus, removeRecipient } from "@/server/campaigns";
import { mergeTemplate, type MergeData } from "@/lib/merge";
import { recipientStatusLabel, RECIPIENT_STATUSES, recipientStatusBadge } from "@/lib/display";

type Recipient = {
  id: string;
  status: string;
  resultUrl: string | null;
  contact: { id: string; name: string; email: string | null; organization: string | null };
};

export default function RecipientRow({
  recipient,
  campaignId,
  subjectTpl,
  bodyTpl,
  mergeBase,
}: {
  recipient: Recipient;
  campaignId: string;
  subjectTpl: string;
  bodyTpl: string;
  mergeBase: Omit<MergeData, "contactName" | "organization">;
}) {
  const [showEmail, setShowEmail] = useState(false);

  const data: MergeData = {
    ...mergeBase,
    contactName: recipient.contact.name,
    organization: recipient.contact.organization,
  };
  const subject = mergeTemplate(subjectTpl, data);
  const body = mergeTemplate(bodyTpl, data);

  const mailto = recipient.contact.email
    ? `mailto:${recipient.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <>
      <tr>
        <td>
          <div className="t-title">{recipient.contact.name}</div>
          <div className="t-sub">{recipient.contact.organization || "—"}</div>
        </td>
        <td className="t-sub">{recipient.contact.email || <span style={{ color: "var(--xol-carmin)" }}>pas d&apos;email</span>}</td>
        <td>
          <span className={`badge ${recipientStatusBadge[recipient.status]}`}>
            {recipientStatusLabel[recipient.status]}
          </span>
        </td>
        <td>
          <div className="tbl-actions">
            <button type="button" className="btn btn-xs" onClick={() => setShowEmail(true)} disabled={!recipient.contact.email}>
              Voir l&apos;email
            </button>
            <form action={setRecipientStatus} className="row" style={{ gap: 4, alignItems: "center" }}>
              <input type="hidden" name="id" value={recipient.id} />
              <input type="hidden" name="campaignId" value={campaignId} />
              <select name="status" defaultValue={recipient.status} className="select" style={{ height: 28, fontSize: 12, padding: "0 6px" }}>
                {RECIPIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{recipientStatusLabel[s]}</option>
                ))}
              </select>
              <button className="btn btn-xs" type="submit">OK</button>
            </form>
            <form action={removeRecipient}>
              <input type="hidden" name="id" value={recipient.id} />
              <input type="hidden" name="campaignId" value={campaignId} />
              <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--text-mute)" }}>✕</button>
            </form>
          </div>
        </td>
      </tr>

      {showEmail && (
        <tr>
          <td colSpan={4} style={{ background: "var(--surface-2)" }}>
            <div style={{ padding: "6px 4px" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>Email personnalisé — {recipient.contact.name}</strong>
                <div className="row" style={{ gap: 6 }}>
                  {mailto && (
                    <a href={mailto} className="btn btn-xs btn-primary">Ouvrir dans ma messagerie</a>
                  )}
                  <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(`${subject}\n\n${body}`)}>Copier</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => setShowEmail(false)}>Fermer</button>
                </div>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Objet :</strong> {subject || <em className="muted">(vide)</em>}</div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                {body || "(corps vide — renseigne le modèle d'email ci-dessus)"}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
