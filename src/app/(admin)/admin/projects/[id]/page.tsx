import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  projectTypeLabel,
  statusLabel,
  statusBadgeClass,
  fmtDate,
  fmtDuration,
} from "@/lib/display";
import AudioPlayer from "@/components/AudioPlayer";
import TrackUploader from "@/components/TrackUploader";
import ShareButton from "@/components/ShareButton";
import { deleteTrack } from "@/server/tracks";
import { deleteProject as _rm } from "@/server/projects";
import ProjectEditPanel from "./ProjectEditPanel";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      artist: true,
      tracks: { orderBy: { position: "asc" } },
    },
  });
  if (!project) notFound();

  const returnTo = `/admin/projects/${project.id}`;

  return (
    <div className="stack" style={{ gap: 26 }}>
      <Link href="/admin/projects" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Projets
      </Link>

      <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
        <div style={{ width: 140, height: 140, borderRadius: 12, background: "var(--surface-3)", flexShrink: 0, overflow: "hidden" }}>
          {project.coverKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/img/${project.coverKey}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <span className="badge">{projectTypeLabel[project.type]}</span>
            <span className={`badge ${statusBadgeClass[project.status]}`}>
              {statusLabel[project.status]}
            </span>
          </div>
          <h1 style={{ fontSize: 28 }}>{project.title}</h1>
          <Link href={`/admin/artists/${project.artistId}`} className="muted" style={{ fontSize: 15 }}>
            {project.artist.stageName}
          </Link>
          <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 8 }}>
            {project.genre && <>{project.genre} · </>}
            {project.catalogRef && <>{project.catalogRef} · </>}
            Sortie : {fmtDate(project.releaseDate)}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <ShareButton targetType="PROJECT" targetId={project.id} returnTo={returnTo} />
          <ProjectEditPanel
            project={{
              id: project.id,
              title: project.title,
              type: project.type,
              status: project.status,
              genre: project.genre,
              catalogRef: project.catalogRef,
              upc: project.upc,
              notes: project.notes,
              releaseDate: project.releaseDate
                ? new Date(project.releaseDate).toISOString().slice(0, 10)
                : null,
            }}
          />
        </div>
      </div>

      {project.notes && (
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-soft)", marginBottom: 4 }}>
            Notes internes
          </div>
          <p style={{ fontSize: 14 }}>{project.notes}</p>
        </div>
      )}

      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18 }}>
            Titres <span className="muted" style={{ fontWeight: 400 }}>({project.tracks.length})</span>
          </h2>
          <TrackUploader projectId={project.id} />
        </div>

        {project.tracks.length === 0 ? (
          <div className="card">
            <p className="muted">
              Aucun titre. Ajoute des fichiers WAV — ils seront convertis pour l&apos;écoute automatiquement.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {project.tracks.map((t: (typeof project.tracks)[number]) => {
              const streamUrl = t.streamKey ? `/api/admin-stream/track/${t.id}` : "";
              return (
                <div key={t.id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                    <span
                      style={{
                        width: 24,
                        textAlign: "center",
                        fontFamily: "var(--font-title)",
                        color: "var(--text-mute)",
                        fontWeight: 600,
                      }}
                    >
                      {t.position}
                    </span>
                    <div style={{ flex: 1 }}>
                      {streamUrl ? (
                        <AudioPlayer
                          src={streamUrl}
                          title={t.title}
                          subtitle={[
                            fmtDuration(t.durationSec),
                            t.bpm ? `${t.bpm} BPM` : null,
                            t.songKey,
                            t.isrc,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          waveform={t.waveformJson ? JSON.parse(t.waveformJson) : null}
                        />
                      ) : (
                        <div className="muted" style={{ fontSize: 14 }}>
                          {t.title} — conversion en cours…
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                    <ShareButton targetType="TRACK" targetId={t.id} returnTo={returnTo} small />
                    <form action={deleteTrack}>
                      <input type="hidden" name="id" value={t.id} />
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

      <section>
        <form action={_rm}>
          <input type="hidden" name="id" value={project.id} />
          <button
            className="btn btn-sm"
            style={{ color: "var(--xol-carmin)" }}
            type="submit"
          >
            Supprimer le projet
          </button>
        </form>
      </section>
    </div>
  );
}
