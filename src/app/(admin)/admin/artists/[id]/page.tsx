import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Cover from "@/components/Cover";
import { projectTypeLabel, fmtDuration, fmtDate, relationTypeLabel, relationTypeBadge } from "@/lib/display";
import { fmtMoney } from "@/lib/money";
import FinanceSummary from "@/components/FinanceSummary";
import TransactionForm from "../../finances/TransactionForm";
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
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: { project: true, recipients: { select: { status: true } } },
      },
      transactions: {
        orderBy: { date: "desc" },
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

  // --- Finances de l'artiste ---
  const financeCategories = await prisma.txCategory.findMany({
    orderBy: [{ type: "asc" }, { position: "asc" }],
  });
  const catOpts = financeCategories.map((c: (typeof financeCategories)[number]) => ({
    name: c.name,
    type: c.type,
  }));

  const txs = artist.transactions;
  const artistIncome = txs
    .filter((t: (typeof txs)[number]) => t.type === "INCOME")
    .reduce((s: number, t: (typeof txs)[number]) => s + t.amount, 0);
  const artistExpense = txs
    .filter((t: (typeof txs)[number]) => t.type === "EXPENSE")
    .reduce((s: number, t: (typeof txs)[number]) => s + t.amount, 0);
  // Les ecritures sont deja triees par date decroissante : la premiere de
  // chaque type est la plus recente.
  const lastExpense = txs.find((t: (typeof txs)[number]) => t.type === "EXPENSE") ?? null;
  const lastIncome = txs.find((t: (typeof txs)[number]) => t.type === "INCOME") ?? null;
  const isExternal = artist.relationType === "EXTERNAL";

  return (
    <div className="stack" style={{ gap: 28 }}>
      <Link href="/admin/artists" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Artistes
      </Link>

      <div className="row" style={{ gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
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
          <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 28 }}>{artist.stageName}</h1>
            <span className={`badge ${relationTypeBadge[artist.relationType]}`}>
              {relationTypeLabel[artist.relationType]}
            </span>
          </div>
          <p className="muted">{artist.country || "Pays non renseigné"}</p>
          {artist.bio && <p style={{ marginTop: 8, maxWidth: 620 }}>{artist.bio}</p>}
          {artist.relationType === "EXTERNAL" && artist.mandateNotes && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "#fff8f0",
                borderLeft: "3px solid var(--xol-yellow-deep)",
                borderRadius: 8,
                maxWidth: 620,
              }}
            >
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-mute)", marginBottom: 3 }}>
                Cadre du mandat
              </div>
              <p style={{ fontSize: 14, whiteSpace: "pre-line" }}>{artist.mandateNotes}</p>
            </div>
          )}
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
              relationType: artist.relationType,
              mandateNotes: artist.mandateNotes,
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
                <Cover src={p.coverKey ? `/api/img/${p.coverKey}` : null} size={44} radius={8} />
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

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Campagnes média</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
          Historique des campagnes de promotion et leurs retombées.
        </p>
        {artist.campaigns.length === 0 ? (
          <div className="card"><p className="muted" style={{ fontSize: 14 }}>Aucune campagne pour cet artiste.</p></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Campagne</th>
                    <th>Projet</th>
                    <th style={{ textAlign: "right" }}>Contactés</th>
                    <th style={{ textAlign: "right" }}>Réponses</th>
                    <th style={{ textAlign: "right" }}>Publications</th>
                  </tr>
                </thead>
                <tbody>
                  {artist.campaigns.map((c: (typeof artist.campaigns)[number]) => {
                    const recs = c.recipients;
                    const replied = recs.filter((x: { status: string }) => ["REPLIED", "PUBLISHED"].includes(x.status)).length;
                    const published = recs.filter((x: { status: string }) => x.status === "PUBLISHED").length;
                    return (
                      <tr key={c.id}>
                        <td>
                          <Link href={`/admin/campaigns/${c.id}`} className="t-title" style={{ color: "var(--xol-indigo)" }}>
                            {c.name}
                          </Link>
                        </td>
                        <td className="t-sub">{c.project?.title ?? "—"}</td>
                        <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{recs.length}</td>
                        <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{replied}</td>
                        <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: published > 0 ? "var(--xol-indigo)" : undefined }}>{published}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 18 }}>Finances</h2>
          <TransactionForm
            artists={artistOpts}
            projects={projectOpts}
            categories={catOpts}
            fixedArtistId={artist.id}
            trigger={<button type="button" className="btn btn-sm">+ Écriture</button>}
          />
        </div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
          {isExternal
            ? "Artiste externe : les entrées correspondent à ce que le label facture pour la prestation."
            : "Artiste du label : ce qui est investi sur l'artiste et ce qu'il génère."}
        </p>

        <FinanceSummary income={artistIncome} expense={artistExpense} />

        {(lastExpense || lastIncome) && (
          <div className="row" style={{ gap: 20, flexWrap: "wrap", marginTop: 12, fontSize: 13, color: "var(--text-soft)" }}>
            {lastExpense && (
              <span>
                Dernière dépense : <strong>{fmtMoney(lastExpense.amount)}</strong> ({lastExpense.category}, {fmtDate(lastExpense.date)})
              </span>
            )}
            {lastIncome && (
              <span>
                Dernier revenu : <strong>{fmtMoney(lastIncome.amount)}</strong> ({lastIncome.category}, {fmtDate(lastIncome.date)})
              </span>
            )}
          </div>
        )}

        {artist.transactions.length > 0 && (
          <p style={{ marginTop: 12 }}>
            <Link href={`/admin/finances?artistId=${artist.id}`} style={{ fontSize: 13, color: "var(--xol-indigo)" }}>
              Voir le détail des {artist.transactions.length} écritures →
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}