import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArtistCreateForm from "./ArtistCreateForm";

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: { stageName: "asc" },
    include: { _count: { select: { projects: true, demos: true } } },
  });

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Artistes</h1>
          <p className="muted">Les artistes du label et leurs dossiers.</p>
        </div>
        <ArtistCreateForm />
      </div>

      {artists.length === 0 ? (
        <div className="card">
          <p className="muted">Aucun artiste. Ajoute le premier avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {artists.map((a: (typeof artists)[number]) => (
            <Link key={a.id} href={`/admin/artists/${a.id}`} className="card">
              <div className="row" style={{ gap: 14 }}>
                <Avatar photoKey={a.photoKey} name={a.stageName} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-title)" }}>
                    {a.stageName}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                    {a.country || "—"}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 14 }}>
                {a._count.projects} projet{a._count.projects > 1 ? "s" : ""} ·{" "}
                {a._count.demos} demo{a._count.demos > 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ photoKey, name }: { photoKey: string | null; name: string }) {
  const size = 52;
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
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
