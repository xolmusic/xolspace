import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/display";
import { markAllSent, deleteCampaign } from "@/server/campaigns";
import CampaignEditor from "./CampaignEditor";
import RecipientTargeting from "./RecipientTargeting";
import RecipientRow from "./RecipientRow";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      artist: true,
      project: true,
      recipients: {
        orderBy: { createdAt: "asc" },
        include: { contact: true },
      },
    },
  });
  if (!campaign) notFound();

  // Liens de partage existants (pour rattacher un lien d'ecoute).
  const links = await prisma.shareLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: true, track: true, artist: true, epk: { include: { artist: true } } },
  });
  const shareOptions = links.map((l: (typeof links)[number]) => {
    const name = l.project?.title ?? l.track?.title ?? l.artist?.stageName ?? (l.epk ? `EPK — ${l.epk.artist.stageName}` : "Lien");
    return { token: l.token, label: `${name}${l.label ? ` · ${l.label}` : ""}` };
  });

  const projects = await prisma.project.findMany({ where: { artistId: campaign.artistId }, orderBy: { title: "asc" } });
  const projectOpts = projects.map((p: (typeof projects)[number]) => ({ id: p.id, title: p.title }));

  // Pays presents dans la base contacts, pour le ciblage.
  const contactCountries = await prisma.contact.findMany({ select: { country: true } });
  const countries = Array.from(new Set(contactCountries.map((c: { country: string | null }) => c.country).filter((x: string | null): x is string => !!x))).sort();

  // Stats en entonnoir.
  const r = campaign.recipients;
  const total = r.length;
  const sent = r.filter((x: (typeof r)[number]) => x.status !== "TO_SEND").length;
  const replied = r.filter((x: (typeof r)[number]) => ["REPLIED", "PUBLISHED"].includes(x.status)).length;
  const published = r.filter((x: (typeof r)[number]) => x.status === "PUBLISHED").length;

  const base = appUrl();
  const link = campaign.shareToken ? `${base}/s/${campaign.shareToken}` : null;
  const mergeBase = {
    artistName: campaign.artist.stageName,
    projectName: campaign.project?.title ?? null,
    pitch: campaign.pitch,
    link,
    signature: campaign.signature,
  };

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link href="/admin/campaigns" style={{ fontSize: 14, color: "var(--text-soft)" }}>← Campagnes</Link>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>{campaign.name}</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {campaign.artist.stageName}{campaign.project ? ` · ${campaign.project.title}` : ""}
          </p>
        </div>
        <form action={deleteCampaign}>
          <input type="hidden" name="id" value={campaign.id} />
          <button className="btn btn-sm" type="submit" style={{ color: "var(--xol-carmin)" }}>Supprimer</button>
        </form>
      </div>

      {/* Entonnoir de resultats */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <Stat label="Destinataires" value={total} />
        <Stat label="Envoyés" value={sent} />
        <Stat label="Réponses" value={replied} />
        <Stat label="Publications" value={published} accent />
      </div>

      {/* Modele d'email */}
      <section>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Campagne &amp; modèle d&apos;email</h2>
        <CampaignEditor
          campaign={{
            id: campaign.id, name: campaign.name, status: campaign.status,
            pitch: campaign.pitch, shareToken: campaign.shareToken,
            emailSubject: campaign.emailSubject, emailBody: campaign.emailBody,
            signature: campaign.signature, projectId: campaign.projectId,
          }}
          shareOptions={shareOptions}
          projects={projectOpts}
        />
      </section>

      {/* Destinataires */}
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 17 }}>Destinataires ({total})</h2>
          <div className="row" style={{ gap: 8 }}>
            {sent < total && total > 0 && (
              <form action={markAllSent}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <button className="btn btn-sm" type="submit">Tout marquer « envoyé »</button>
              </form>
            )}
            <RecipientTargeting campaignId={campaign.id} countries={countries} />
          </div>
        </div>

        {total === 0 ? (
          <div className="card"><p className="muted" style={{ fontSize: 14 }}>Aucun destinataire. Utilise « Cibler des contacts » pour en ajouter selon des critères.</p></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {r.map((rec: (typeof r)[number]) => (
                    <RecipientRow
                      key={rec.id}
                      recipient={{
                        id: rec.id, status: rec.status, resultUrl: rec.resultUrl,
                        contact: { id: rec.contact.id, name: rec.contact.name, email: rec.contact.email, organization: rec.contact.organization },
                      }}
                      campaignId={campaign.id}
                      subjectTpl={campaign.emailSubject ?? ""}
                      bodyTpl={campaign.emailBody ?? ""}
                      mergeBase={mergeBase}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 28, fontFamily: "var(--font-title)", fontWeight: 700, color: accent ? "var(--xol-carmin)" : "var(--xol-indigo)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
