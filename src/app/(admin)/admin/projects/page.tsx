import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { projectTypeLabel, statusLabel, statusBadgeClass, fmtDate } from "@/lib/display";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { artist: true, _count: { select: { tracks: true } } },
  });

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Projets</h1>
          <p className="muted">Singles, EP et albums du catalogue.</p>
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
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          {projects.map((p: (typeof projects)[number]) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ aspectRatio: "1/1", background: "var(--surface-3)" }}>
                {p.coverKey && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/img/${p.coverKey}`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="badge">{projectTypeLabel[p.type]}</span>
                  <span className={`badge ${statusBadgeClass[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontFamily: "var(--font-title)" }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{p.artist.stageName}</div>
                <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>
                  {p._count.tracks} titre{p._count.tracks > 1 ? "s" : ""} · {fmtDate(p.releaseDate)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
