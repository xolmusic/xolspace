import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";
import Cover from "@/components/Cover";
import {
  projectTypeLabel,
  statusLabel,
  statusBadgeClass,
  fmtDate,
  fmtDuration,
} from "@/lib/display";
import FinanceSummary from "@/components/FinanceSummary";
import TransactionForm from "../../finances/TransactionForm";
import BudgetForm from "./BudgetForm";
import AudioPlayer from "@/components/AudioPlayer";
import SongUploader from "@/components/SongUploader";
import TrackEditForm from "@/components/TrackEditForm";
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
      transactions: { orderBy: { date: "desc" } },
    },
  });
  if (!project) notFound();

  // --- Finances du projet (super admin uniquement) ---
  const canSeeFinances = await isSuperAdmin();
  const financeCategories = await prisma.txCategory.findMany({
    orderBy: [{ type: "asc" }, { position: "asc" }],
  });
  const catOpts = financeCategories.map((c: (typeof financeCategories)[number]) => ({
    name: c.name,
    type: c.type,
  }));
  const [allArtistsFin, allProjectsFin] = await Promise.all([
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);
  const finArtistOpts = allArtistsFin.map((a: (typeof allArtistsFin)[number]) => ({
    id: a.id,
    stageName: a.stageName,
  }));
  const finProjectOpts = allProjectsFin.map((p: (typeof allProjectsFin)[number]) => ({
    id: p.id,
    title: p.title,
    artistId: p.artistId,
  }));

  const ptxs = project.transactions;
  const projectIncome = ptxs
    .filter((t: (typeof ptxs)[number]) => t.type === "INCOME")
    .reduce((s: number, t: (typeof ptxs)[number]) => s + t.amount, 0);
  const projectExpense = ptxs
    .filter((t: (typeof ptxs)[number]) => t.type === "EXPENSE")
    .reduce((s: number, t: (typeof ptxs)[number]) => s + t.amount, 0);

  const [allArtists, allProjects] = await Promise.all([
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);
  const artistOpts = allArtists.map((a: (typeof allArtists)[number]) => ({ id: a.id, stageName: a.stageName }));
  const projectOpts = allProjects.map((p: (typeof allProjects)[number]) => ({ id: p.id, title: p.title, artistId: p.artistId }));

  const returnTo = `/admin/projects/${project.id}`;

  return (
    <div className="stack" style={{ gap: 26 }}>
      <Link href="/admin/projects" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Projets
      </Link>

      <div className="row" style={{ gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Cover src={project.coverKey ? `/api/img/${project.coverKey}` : null} size={140} radius={12} />
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
          <SongUploader projectId={project.id} />
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
              const streamUrl = `/api/admin-stream/track/${t.id}`;
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
                      />
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                    <ShareButton targetType="TRACK" targetId={t.id} returnTo={returnTo} small />
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

      {canSeeFinances && (
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 18 }}>Finances du projet</h2>
          <div className="row" style={{ gap: 8 }}>
            <BudgetForm projectId={project.id} budget={project.budget} />
            <TransactionForm
              artists={finArtistOpts}
              projects={finProjectOpts}
              categories={catOpts}
              fixedArtistId={project.artistId}
              fixedProjectId={project.id}
              trigger={<button type="button" className="btn btn-sm">+ Écriture</button>}
            />
          </div>
        </div>

        <FinanceSummary income={projectIncome} expense={projectExpense} budget={project.budget} />

        {ptxs.length > 0 && (
          <p style={{ marginTop: 12 }}>
            <Link href={`/admin/finances?projectId=${project.id}`} style={{ fontSize: 13, color: "var(--xol-indigo)" }}>
              Voir le détail des {ptxs.length} écritures →
            </Link>
          </p>
        )}
      </section>
      )}
    </div>
  );
}