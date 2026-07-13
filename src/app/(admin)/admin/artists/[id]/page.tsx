import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectTypeLabel, fmtDuration } from "@/lib/display";
import DemoDropzone from "@/components/DemoDropzone";
import AudioPlayer from "@/components/AudioPlayer";
import ShareButton from "@/components/ShareButton";
import { deleteDemo } from "@/server/tracks";
import ArtistEditForm from "./ArtistEditForm";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { tracks: true } } },
      },
      demos: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!artist) notFound();

  return (
    <div className="stack" style={{ gap: 28 }}>
      <Link href="/admin/artists" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Artistes
      </Link>

      <div className="row" style={{ gap: 18, alignItems: "flex-start" }}>
        {artist.photoKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/img/${artist.photoKey}`}
            alt=""
            style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "var(--xol-indigo)",
              color: "#fff7e6",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-title)",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {artist.stageName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28 }}>{artist.stageName}</h1>
          <p className="muted">{artist.country || "Pays non renseigné"}</p>
          {artist.bio && <p style={{ marginTop: 8, maxWidth: 620 }}>{artist.bio}</p>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <ShareButton
            targetType="ARTIST"
            targetId={artist.id}
            returnTo={`/admin/artists/${artist.id}`}
          />
          <ArtistEditForm artist={{
            id: artist.id,
            stageName: artist.stageName,
            country: artist.country,
            bio: artist.bio,
          }} />
        </div>
      </div>

      {/* Projets */}
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>Projets</h2>
          <Link href={`/admin/projects/new?artist=${artist.id}`} className="btn btn-sm">
            + Nouveau projet
          </Link>
        </div>
        {artist.projects.length === 0 ? (
          <div className="card">
            <p className="muted">Aucun projet pour cet artiste.</p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {artist.projects.map((p: (typeof artist.projects)[number]) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: 12 }}
              >
                {p.coverKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/img/${p.coverKey}`} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--surface-3)" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                    {projectTypeLabel[p.type]} · {p._count.tracks} titre{p._count.tracks > 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Dossier demos */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Dossier de demos</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
          Fichiers de travail bruts, sans projet. Chaque demo a son propre lien de partage.
        </p>
        <DemoDropzone artistId={artist.id} />

        {artist.demos.length > 0 && (
          <div className="stack" style={{ gap: 10, marginTop: 16 }}>
            {artist.demos.map((d: (typeof artist.demos)[number]) => {
              const streamUrl = `/api/admin-stream/demo/${d.id}`;
              return (
                <div key={d.id} className="card" style={{ padding: 14 }}>
                  <div style={{ marginBottom: 10 }}>
                    <AudioPlayer
                      src={streamUrl}
                      title={d.title}
                      subtitle={`Demo · ${fmtDuration(d.durationSec)}`}
                    />
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                    <ShareButton
                      targetType="DEMO"
                      targetId={d.id}
                      returnTo={`/admin/artists/${artist.id}`}
                      small
                    />
                    <form action={deleteDemo}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn btn-sm" type="submit" style={{ color: "var(--xol-carmin)" }}>
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
