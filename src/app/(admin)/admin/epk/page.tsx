import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function EpkListPage() {
  const artists = await prisma.artist.findMany({
    orderBy: { stageName: "asc" },
    include: { epk: true, _count: { select: { tracks: true } } },
  });

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24 }}>Presskit EPK</h1>
        <p className="muted" style={{ fontSize: 14 }}>
          Un dossier de presse par artiste : bio, photos, vidéos, musique et réseaux.
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="card">
          <p className="muted">Crée d&apos;abord un artiste pour lui construire un EPK.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Artiste</th>
                  <th>EPK</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {artists.map((a: (typeof artists)[number]) => (
                  <tr key={a.id}>
                    <td>
                      <Avatar photoKey={a.photoKey} name={a.stageName} />
                    </td>
                    <td className="t-title">{a.stageName}</td>
                    <td>
                      {a.epk ? (
                        a.epk.published ? (
                          <span className="badge badge-green">Publié</span>
                        ) : (
                          <span className="badge badge-yellow">Brouillon</span>
                        )
                      ) : (
                        <span className="badge">À créer</span>
                      )}
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <Link href={`/admin/epk/${a.id}`} className="btn btn-xs btn-primary">
                          {a.epk ? "Éditer l'EPK" : "Créer l'EPK"}
                        </Link>
                      </div>
                    </td>
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

function Avatar({ photoKey, name }: { photoKey: string | null; name: string }) {
  const size = 34;
  if (photoKey)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/img/${photoKey}`} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--xol-indigo)", color: "#fff7e6", display: "grid", placeItems: "center", fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12 }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
