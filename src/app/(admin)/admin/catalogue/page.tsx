import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDuration } from "@/lib/display";
import Cover from "@/components/Cover";
import MiniPlayer from "@/components/MiniPlayer";
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
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Catalogue</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {tracks.length} titre{tracks.length > 1 ? "s" : ""} · un titre peut vivre seul ou dans un projet.
          </p>
        </div>
        <CatalogueUpload artists={artistOpts} />
      </div>

      {tracks.length === 0 ? (
        <div className="card">
          <p className="muted">
            Aucun titre. Ajoute-en un avec le bouton ci-dessus, ou depuis un projet.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap"><table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }}></th>
                <th>Titre</th>
                <th>Projet</th>
                <th>Artiste</th>
                <th>Genre</th>
                <th style={{ textAlign: "right" }}>Durée</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t: (typeof tracks)[number]) => (
                <tr key={t.id}>
                  <td>
                    <div className="miniplay">
                      <Cover
                        src={t.project?.coverKey ? `/api/img/${t.project.coverKey}` : null}
                        size={34}
                        radius={6}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <MiniPlayer src={`/api/admin-stream/track/${t.id}`} />
                      <span className="t-title">{t.title}</span>
                    </div>
                  </td>
                  <td className="t-sub">
                    {t.project ? (
                      <Link href={`/admin/projects/${t.project.id}`} style={{ color: "var(--xol-indigo)" }}>
                        {t.project.title}
                      </Link>
                    ) : (
                      <span className="badge">Titre libre</span>
                    )}
                  </td>
                  <td className="t-sub">
                    <Link href={`/admin/artists/${t.artistId}`} style={{ color: "var(--xol-indigo)" }}>
                      {t.artist.stageName}
                    </Link>
                  </td>
                  <td className="t-sub">{t.genre || "—"}</td>
                  <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtDuration(t.durationSec)}
                  </td>
                  <td>
                    <div className="tbl-actions">
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
                        <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--text-mute)" }}>
                          ✕
                        </button>
                      </form>
                    </div>
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
