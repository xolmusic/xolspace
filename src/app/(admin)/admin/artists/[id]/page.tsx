import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectTypeLabel, fmtDuration } from "@/lib/display";
import SongUploader from "@/components/SongUploader";
import AudioPlayer from "@/components/AudioPlayer";
import ShareButton from "@/components/ShareButton";
import TrackEditForm from "@/components/TrackEditForm";
import { deleteTrack } from "@/server/tracks";
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
      tracks: {
        orderBy: { createdAt: "desc" },
        include: { project: true },
      },
    },
  });
  if (!artist) notFound();

  const [allArtists, allProjects] = await Promise.all([
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);
  const artistOpts = allArtists.map((a: (typeof allArtists)[number]) => ({ id: a.id, stageName: a.stageName }));
  const projectOpts = allProjects.map((p: (typeof allProjects)[number]) => ({
    id: p.id,
    title: p.title,
    artistId: p.artistId,
  }));

  const looseTracks = artist.tracks.filter((t: (typeof artist.tracks)[number]) => !t.projectId);

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
          <ArtistEditForm
            artist={{
              id: artist.id,
              stageName: artist.stageName,
              country: artist.country,
              bio: artist.bio,
            }}
          />
        </div>
      </div>

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

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Titres libres</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
          Titres de l&apos;artiste non rattachés à un projet — demos, inédits, work in progress.
          Chacun a son lien de partage et peut être assigné à un projet à tout moment.
        </p>
        <SongUploader artistId={artist.id} variant="drop" />

        {looseTracks.length > 0 && (
          <div className="stack" style={{ gap: 10, marginTop: 16 }}>
            {looseTracks.map((t: (typeof looseTracks)[number]) => (
              <div key={t.id} className="card" style={{ padding: 14 }}>
                <AudioPlayer
                  src={`/api/admin-stream/track/${t.id}`}
                  title={t.title}
                  subtitle={[t.genre, fmtDuration(t.durationSec)].filter(Boolean).join(" · ") || "Titre libre"}
                />
                <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <ShareButton targetType="TRACK" targetId={t.id} returnTo={`/admin/artists/${artist.id}`} small />
                  <TrackEditForm
                    track={{
                      id: t.id,
                      title: t.title,
                      artistId: t.artistId,
                      projectId: t.projectId,
                      genre: t.genre,
                      bpm: t.bpm,
                      songKey: t.songKey,
                      isrc: t.isrc,
                    }}
                    artists={artistOpts}
                    projects={projectOpts}
                  />
                  <form action={deleteTrack}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn btn-sm" type="submit" style={{ color: "var(--xol-carmin)" }}>
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
