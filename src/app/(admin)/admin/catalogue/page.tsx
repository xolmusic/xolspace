import { prisma } from "@/lib/prisma";
import { fmtDuration } from "@/lib/display";
import AudioPlayer from "@/components/AudioPlayer";
import ShareButton from "@/components/ShareButton";
import TrackEditForm from "@/components/TrackEditForm";
import CatalogueUpload from "./CatalogueUpload";
import { deleteTrack } from "@/server/tracks";

export default async function CataloguePage() {
  const [tracks, artists, projects] = await Promise.all([
    prisma.track.findMany({
      orderBy: { createdAt: "desc" },
      include: { artist: true, project: true },
    }),
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);

  const artistOpts = artists.map((a: (typeof artists)[number]) => ({ id: a.id, stageName: a.stageName }));
  const projectOpts = projects.map((p: (typeof projects)[number]) => ({
    id: p.id,
    title: p.title,
    artistId: p.artistId,
  }));

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Catalogue</h1>
          <p className="muted">
            Tous les titres du label. Un titre peut vivre seul ou dans un projet.
          </p>
        </div>
        <CatalogueUpload artists={artistOpts} />
      </div>

      {tracks.length === 0 ? (
        <div className="card">
          <p className="muted">
            Aucun titre pour l&apos;instant. Ajoute-en un avec le bouton ci-dessus, ou depuis un projet.
          </p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {tracks.map((t: (typeof tracks)[number]) => (
            <div key={t.id} className="card" style={{ padding: 14 }}>
              <AudioPlayer
                src={`/api/admin-stream/track/${t.id}`}
                title={t.title}
                subtitle={[
                  t.artist.stageName,
                  t.project ? t.project.title : "Titre libre",
                  t.genre,
                  fmtDuration(t.durationSec),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <ShareButton targetType="TRACK" targetId={t.id} returnTo="/admin/catalogue" small />
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
    </div>
  );
}
