import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  projectTypeLabel,
  statusLabel,
  statusBadgeClass,
  fmtDate,
} from "@/lib/display";

export default async function DashboardPage() {
  const [artistCount, projectCount, trackCount, looseCount, linkCount, recent] =
    await Promise.all([
      prisma.artist.count(),
      prisma.project.count(),
      prisma.track.count(),
      prisma.track.count({ where: { projectId: null } }),
      prisma.shareLink.count({ where: { revoked: false } }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { artist: true, _count: { select: { tracks: true } } },
      }),
    ]);

  const metrics = [
    { label: "Artistes", value: artistCount, href: "/admin/artists" },
    { label: "Projets", value: projectCount, href: "/admin/projects" },
    { label: "Titres", value: trackCount, href: "/admin/projects" },
    { label: "Titres libres", value: looseCount, href: "/admin/catalogue" },
    { label: "Liens actifs", value: linkCount, href: "/admin/links" },
  ];

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>Vue d&apos;ensemble</h1>
        <p className="muted">Le catalogue XOL en un coup d&apos;œil.</p>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
      >
        {metrics.map((m) => (
          <Link key={m.label} href={m.href} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{m.label}</div>
            <div style={{ fontSize: 30, fontFamily: "var(--font-title)", fontWeight: 700 }}>
              {m.value}
            </div>
          </Link>
        ))}
      </div>

      <div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18 }}>Projets récents</h2>
          <Link href="/admin/projects" className="btn btn-sm">
            Tout voir
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card">
            <p className="muted">
              Aucun projet pour l&apos;instant. Commence par créer un artiste, puis un projet.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {recent.map((p: (typeof recent)[number]) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: 14 }}
              >
                <Cover coverKey={p.coverKey} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                    {p.artist.stageName} · {projectTypeLabel[p.type]} · {p._count.tracks} titre
                    {p._count.tracks > 1 ? "s" : ""}
                  </div>
                </div>
                <span className={`badge ${statusBadgeClass[p.status]}`}>
                  {statusLabel[p.status]}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-mute)" }}>
                  {fmtDate(p.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Cover({ coverKey }: { coverKey: string | null }) {
  const style: React.CSSProperties = {
    width: 46,
    height: 46,
    borderRadius: 8,
    flexShrink: 0,
    objectFit: "cover",
    background: "var(--surface-3)",
  };
  if (!coverKey)
    return (
      <div style={{ ...style, display: "grid", placeItems: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="1.6">
          <path d="M12 3v10.55A4 4 0 1014 17V7h4V3z" />
        </svg>
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/img/${coverKey}`} alt="" style={style} />;
}
