import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArtistCreateForm from "./ArtistCreateForm";
import { relationTypeLabel, relationTypeBadge } from "@/lib/display";

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ relation?: string }>;
}) {
  const { relation } = await searchParams;
  const where =
    relation === "LABEL" || relation === "EXTERNAL" ? { relationType: relation } : {};

  const artists = await prisma.artist.findMany({
    where: where as never,
    orderBy: { stageName: "asc" },
    include: { _count: { select: { projects: true, tracks: true } } },
  });

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Artistes</h1>
          <p className="muted" style={{ fontSize: 14 }}>Les artistes du label et leurs catalogues.</p>
        </div>
        <ArtistCreateForm />
      </div>

      <div className="row" style={{ gap: 6 }}>
        <FilterTab label="Tous" href="/admin/artists" active={!relation} />
        <FilterTab label="Label" href="/admin/artists?relation=LABEL" active={relation === "LABEL"} />
        <FilterTab label="Externes" href="/admin/artists?relation=EXTERNAL" active={relation === "EXTERNAL"} />
      </div>

      {artists.length === 0 ? (
        <div className="card">
          <p className="muted">Aucun artiste. Ajoute le premier avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap"><table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Nom d&apos;artiste</th>
                <th>Relation</th>
                <th>Pays</th>
                <th style={{ textAlign: "right" }}>Projets</th>
                <th style={{ textAlign: "right" }}>Titres</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((a: (typeof artists)[number]) => (
                <tr key={a.id}>
                  <td>
                    <Avatar photoKey={a.photoKey} name={a.stageName} />
                  </td>
                  <td>
                    <Link href={`/admin/artists/${a.id}`} className="t-title" style={{ color: "var(--xol-indigo)" }}>
                      {a.stageName}
                    </Link>
                  </td>
                  <td className="t-sub">{a.country || "—"}</td>
                  <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {a._count.projects}
                  </td>
                  <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {a._count.tracks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

function Avatar({ photoKey, name }: { photoKey: string | null; name: string }) {
  const size = 34;
  if (photoKey)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`/api/img/${photoKey}`}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--xol-indigo)",
        color: "#fff7e6",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FilterTab({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a href={href} className={`btn btn-xs ${active ? "btn-primary" : ""}`}>
      {label}
    </a>
  );
}
