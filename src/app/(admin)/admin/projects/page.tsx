import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { projectTypeLabel, statusLabel, statusBadgeClass, fmtDate } from "@/lib/display";
import Cover from "@/components/Cover";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { artist: true, _count: { select: { tracks: true } } },
  });

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Projets</h1>
          <p className="muted" style={{ fontSize: 14 }}>Singles, EP et albums du catalogue.</p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary">
          + Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <p className="muted">Aucun projet. Crée-en un pour commencer à y ajouter des titres.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap"><table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }}></th>
                <th>Projet</th>
                <th>Artiste</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Titres</th>
                <th>Statut</th>
                <th>Sortie</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p: (typeof projects)[number]) => (
                <tr
                  key={p.id}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <Cover src={p.coverKey ? `/api/img/${p.coverKey}` : null} size={34} radius={6} />
                  </td>
                  <td>
                    <Link href={`/admin/projects/${p.id}`} className="t-title" style={{ color: "var(--xol-indigo)" }}>
                      {p.title}
                    </Link>
                  </td>
                  <td className="t-sub">
                    <Link href={`/admin/artists/${p.artistId}`} style={{ color: "var(--xol-indigo)" }}>
                      {p.artist.stageName}
                    </Link>
                  </td>
                  <td className="t-sub">{projectTypeLabel[p.type]}</td>
                  <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {p._count.tracks}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                  </td>
                  <td className="t-sub">{fmtDate(p.releaseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
