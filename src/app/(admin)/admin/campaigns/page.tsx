import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate, campaignStatusLabel, campaignStatusBadge } from "@/lib/display";
import CampaignCreateForm from "./CampaignCreateForm";

export default async function CampaignsPage() {
  const [campaigns, artists, projects] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { artist: true, project: true, _count: { select: { recipients: true } } },
    }),
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" }, include: { artist: true } }),
  ]);

  const artistOpts = artists.map((a: (typeof artists)[number]) => ({ id: a.id, stageName: a.stageName }));
  const projectOpts = projects.map((p: (typeof projects)[number]) => ({ id: p.id, title: p.title, artistId: p.artistId }));

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Campagnes média</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Promotion des sorties : ciblage, emails personnalisés, suivi des retombées.
          </p>
        </div>
        <CampaignCreateForm artists={artistOpts} projects={projectOpts} />
      </div>

      {campaigns.length === 0 ? (
        <div className="card">
          <p className="muted">Aucune campagne. Crée-en une pour une sortie à promouvoir.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campagne</th>
                  <th>Artiste</th>
                  <th>Projet</th>
                  <th>Statut</th>
                  <th style={{ textAlign: "right" }}>Destinataires</th>
                  <th>Créée le</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: (typeof campaigns)[number]) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/campaigns/${c.id}`} className="t-title" style={{ color: "var(--xol-indigo)" }}>
                        {c.name}
                      </Link>
                    </td>
                    <td className="t-sub">{c.artist.stageName}</td>
                    <td className="t-sub">{c.project?.title ?? "—"}</td>
                    <td><span className={`badge ${campaignStatusBadge[c.status]}`}>{campaignStatusLabel[c.status]}</span></td>
                    <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {c._count.recipients}
                    </td>
                    <td className="t-sub">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
