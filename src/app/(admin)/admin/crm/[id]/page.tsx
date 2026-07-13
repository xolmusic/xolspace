import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate, appUrl } from "@/lib/display";
import {
  contactTypeLabel,
  interactionStatusLabel,
  interactionStatusBadge,
  INTERACTION_STATUSES,
} from "@/lib/display";
import { setInteractionStatus, deleteInteraction, deleteContact } from "@/server/crm";
import InteractionForm from "../InteractionForm";
import ContactEditForm from "./ContactEditForm";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { interactions: { orderBy: { createdAt: "desc" } } },
  });
  if (!contact) notFound();

  // Liens de partage existants, pour proposer un lien interne dans un echange.
  const links = await prisma.shareLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: true, track: true, artist: true, epk: { include: { artist: true } } },
  });
  const shareOptions = links.map((l: (typeof links)[number]) => {
    const name =
      l.project?.title ??
      l.track?.title ??
      l.artist?.stageName ??
      (l.epk ? `EPK — ${l.epk.artist.stageName}` : "Lien");
    return { token: l.token, label: `${name}${l.label ? ` · ${l.label}` : ""}` };
  });

  const base = appUrl();

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link href="/admin/crm" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← CRM
      </Link>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 style={{ fontSize: 24 }}>{contact.name}</h1>
            <span className="badge">{contactTypeLabel[contact.type]}</span>
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {[contact.organization, contact.country].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <ContactEditForm contact={{
            id: contact.id, name: contact.name, type: contact.type,
            organization: contact.organization, email: contact.email, phone: contact.phone,
            country: contact.country, socials: contact.socials, notes: contact.notes,
          }} />
          <form action={deleteContact}>
            <input type="hidden" name="id" value={contact.id} />
            <button className="btn btn-sm" type="submit" style={{ color: "var(--xol-carmin)" }}>Supprimer</button>
          </form>
        </div>
      </div>

      {/* Coordonnees */}
      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field label="Email" value={contact.email} link={contact.email ? `mailto:${contact.email}` : null} />
          <Field label="Téléphone" value={contact.phone} />
          <Field label="Réseaux / site" value={contact.socials} link={contact.socials} />
        </div>
        {contact.notes && (
          <p style={{ marginTop: 12, fontSize: 14, whiteSpace: "pre-line", color: "var(--text-soft)" }}>{contact.notes}</p>
        )}
      </div>

      {/* Interactions */}
      <div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 17 }}>Échanges</h2>
          <InteractionForm contactId={contact.id} shareOptions={shareOptions} />
        </div>

        {contact.interactions.length === 0 ? (
          <div className="card"><p className="muted" style={{ fontSize: 14 }}>Aucun échange enregistré.</p></div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {contact.interactions.map((i: (typeof contact.interactions)[number]) => {
              const linkUrl = i.shareToken ? `${base}/s/${i.shareToken}` : i.externalUrl;
              return (
                <div key={i.id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontWeight: 500 }}>{i.subject || "Échange"}</div>
                    <span className={`badge ${interactionStatusBadge[i.status]}`}>
                      {interactionStatusLabel[i.status]}
                    </span>
                  </div>

                  <div className="row" style={{ gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: 13, color: "var(--text-soft)" }}>
                    {i.sentAt && <span>Envoyé : {fmtDate(i.sentAt)}</span>}
                    {i.repliedAt && <span>Réponse : {fmtDate(i.repliedAt)}</span>}
                    {i.followUpAt && (
                      <span style={{ color: "var(--xol-carmin)", fontWeight: 500 }}>
                        Relance : {fmtDate(i.followUpAt)}
                      </span>
                    )}
                    {linkUrl && (
                      <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--xol-indigo)" }}>
                        Voir le lien envoyé ↗
                      </a>
                    )}
                  </div>

                  {i.notes && <p style={{ marginTop: 8, fontSize: 14, whiteSpace: "pre-line" }}>{i.notes}</p>}

                  <div className="row" style={{ gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <form action={setInteractionStatus} className="row" style={{ gap: 6, alignItems: "center" }}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="contactId" value={contact.id} />
                      <select name="status" defaultValue={i.status} className="select" style={{ height: 30, fontSize: 13, padding: "0 8px" }}>
                        {INTERACTION_STATUSES.map((s) => (
                          <option key={s} value={s}>{interactionStatusLabel[s]}</option>
                        ))}
                      </select>
                      <button className="btn btn-xs" type="submit">Mettre à jour</button>
                    </form>
                    <form action={deleteInteraction}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="contactId" value={contact.id} />
                      <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--text-mute)" }}>Supprimer</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, link }: { label: string; value: string | null; link?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-mute)", marginBottom: 2 }}>
        {label}
      </div>
      {value ? (
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--xol-indigo)" }}>{value}</a>
        ) : (
          <span style={{ fontSize: 14 }}>{value}</span>
        )
      ) : (
        <span style={{ fontSize: 14, color: "var(--text-mute)" }}>—</span>
      )}
    </div>
  );
}
