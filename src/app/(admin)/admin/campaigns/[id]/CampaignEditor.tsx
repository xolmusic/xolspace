"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateCampaign } from "@/server/campaigns";
import { MERGE_VARIABLES } from "@/lib/merge";
import { campaignStatusLabel } from "@/lib/display";

type Campaign = {
  id: string;
  name: string;
  status: string;
  pitch: string | null;
  shareToken: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  signature: string | null;
  projectId: string | null;
};

type ShareOption = { token: string; label: string };
type Project = { id: string; title: string };

export default function CampaignEditor({
  campaign,
  shareOptions,
  projects,
}: {
  campaign: Campaign;
  shareOptions: ShareOption[];
  projects: Project[];
}) {
  const [state, action, pending] = useActionState(updateCampaign, null);
  const router = useRouter();
  if (state?.ok) router.refresh();

  return (
    <form action={action} className="card">
      <input type="hidden" name="id" value={campaign.id} />

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
        <div className="field">
          <label htmlFor="name">Nom</label>
          <input id="name" name="name" className="input" defaultValue={campaign.name} required />
        </div>
        <div className="field">
          <label htmlFor="status">Statut</label>
          <select id="status" name="status" className="select" defaultValue={campaign.status}>
            {["DRAFT", "ACTIVE", "CLOSED"].map((s) => (
              <option key={s} value={s}>{campaignStatusLabel[s]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="projectId">Projet</label>
          <select id="projectId" name="projectId" className="select" defaultValue={campaign.projectId ?? ""}>
            <option value="">— Aucun —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pitch">Pitch</label>
        <textarea id="pitch" name="pitch" className="textarea" defaultValue={campaign.pitch ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="shareToken">Lien d&apos;écoute privé (rattaché)</label>
        <select id="shareToken" name="shareToken" className="select" defaultValue={campaign.shareToken ?? ""}>
          <option value="">— Aucun —</option>
          {shareOptions.map((s) => (
            <option key={s.token} value={s.token}>{s.label}</option>
          ))}
        </select>
      </div>

      <h3 style={{ fontSize: 15, margin: "10px 0 4px" }}>Modèle d&apos;email</h3>
      <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
        Variables disponibles :{" "}
        {MERGE_VARIABLES.map((v) => (
          <code key={v.token} style={{ background: "var(--surface-3)", padding: "1px 5px", borderRadius: 4, marginRight: 4, fontSize: 12 }}>
            {v.token}
          </code>
        ))}
      </p>

      <div className="field">
        <label htmlFor="emailSubject">Objet</label>
        <input id="emailSubject" name="emailSubject" className="input" defaultValue={campaign.emailSubject ?? ""} placeholder="Nouveau single de {{artiste}}" />
      </div>
      <div className="field">
        <label htmlFor="emailBody">Corps du message</label>
        <textarea
          id="emailBody"
          name="emailBody"
          className="textarea"
          style={{ minHeight: 200 }}
          defaultValue={campaign.emailBody ?? ""}
          placeholder={"Bonjour {{prenom}},\n\nJe voulais vous présenter le nouveau single de {{artiste}}, {{projet}}.\n{{pitch}}\n\nÉcoute privée : {{lien}}\n\n{{signature}}"}
        />
      </div>
      <div className="field">
        <label htmlFor="signature">Signature</label>
        <textarea id="signature" name="signature" className="textarea" defaultValue={campaign.signature ?? ""} placeholder="Gwen Thomas — XOL Music" />
      </div>

      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        {state?.ok && <span style={{ color: "#1c7a4a", fontSize: 14 }}>Enregistré</span>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le modèle"}
        </button>
      </div>
    </form>
  );
}
