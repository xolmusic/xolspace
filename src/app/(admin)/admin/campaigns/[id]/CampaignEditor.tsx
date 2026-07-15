"use client";

import { useActionState, useEffect } from "react";
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
  fromName: string | null;
  autoFollowUp: boolean;
  followUp1Days: number;
  followUp2Days: number;
  followUp1Body: string | null;
  followUp2Body: string | null;
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
  // Rafraichit seulement quand une action vient d'aboutir (et non a
  // chaque rendu, ce qui provoquait des rafraichissements en boucle).
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

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
      <div className="field">
        <label htmlFor="fromName">Nom d&apos;expéditeur</label>
        <input id="fromName" name="fromName" className="input" defaultValue={campaign.fromName ?? ""} placeholder="XOL Music" />
      </div>

      <h3 style={{ fontSize: 15, margin: "10px 0 4px" }}>Relances automatiques</h3>
      <label className="row" style={{ gap: 8, alignItems: "center", marginBottom: 10, cursor: "pointer" }}>
        <input type="checkbox" name="autoFollowUp" defaultChecked={campaign.autoFollowUp} value="on" />
        <span style={{ fontSize: 14 }}>Activer les relances automatiques pour les contacts sans réponse</span>
      </label>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field">
          <label htmlFor="followUp1Days">1re relance (jours après envoi)</label>
          <input id="followUp1Days" name="followUp1Days" type="number" className="input" defaultValue={campaign.followUp1Days} />
        </div>
        <div className="field">
          <label htmlFor="followUp2Days">2e relance (jours après envoi)</label>
          <input id="followUp2Days" name="followUp2Days" type="number" className="input" defaultValue={campaign.followUp2Days} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="followUp1Body">Message 1re relance</label>
        <textarea id="followUp1Body" name="followUp1Body" className="textarea" defaultValue={campaign.followUp1Body ?? ""} placeholder={"Bonjour {{prenom}}, je me permets de revenir vers vous au sujet de {{artiste}}…"} />
      </div>
      <div className="field">
        <label htmlFor="followUp2Body">Message 2e relance (dernière)</label>
        <textarea id="followUp2Body" name="followUp2Body" className="textarea" defaultValue={campaign.followUp2Body ?? ""} />
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
