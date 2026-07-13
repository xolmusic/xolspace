import { prisma } from "@/lib/prisma";
import { fmtDate, appUrl } from "@/lib/display";
import CopyLink from "@/components/CopyLink";
import { revokeLink, restoreLink, deleteLink } from "@/server/links";

const targetLabel: Record<string, string> = {
  PROJECT: "Projet",
  TRACK: "Titre",
  ARTIST: "Artiste",
  EPK: "EPK",
};

export default async function LinksPage() {
  const links = await prisma.shareLink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: true,
      track: true,
      artist: true,
      epk: { include: { artist: true } },
    },
  });

  const playRows = await prisma.playEvent.groupBy({
    by: ["shareLinkId"],
    where: { kind: "play" },
    _count: { _all: true },
  });
  const playsByLink = new Map<string, number>(
    playRows.map((r: { shareLinkId: string; _count: { _all: number } }) => [
      r.shareLinkId,
      r._count._all,
    ])
  );

  function targetName(l: (typeof links)[number]) {
    return (
      l.project?.title ??
      l.track?.title ??
      l.artist?.stageName ??
      (l.epk ? `EPK — ${l.epk.artist.stageName}` : null) ??
      "—"
    );
  }

  const base = appUrl();

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24 }}>Liens de partage</h1>
        <p className="muted" style={{ fontSize: 14 }}>
          Chaque lien est révocable, peut expirer, et suit ses ouvertures et écoutes.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="card">
          <p className="muted">
            Aucun lien. Crée-en depuis un projet, un titre ou un artiste.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap"><table className="tbl">
            <thead>
              <tr>
                <th>Cible</th>
                <th>Type</th>
                <th>État</th>
                <th style={{ textAlign: "right" }}>Ouvertures</th>
                <th style={{ textAlign: "right" }}>Écoutes</th>
                <th>Créé le</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l: (typeof links)[number]) => {
                const url = `${base}/s/${l.token}`;
                const expired = l.expiresAt && l.expiresAt < new Date();
                const state = l.revoked
                  ? { text: "Révoqué", cls: "badge-carmin" }
                  : expired
                  ? { text: "Expiré", cls: "badge-carmin" }
                  : { text: "Actif", cls: "badge-green" };
                const plays = playsByLink.get(l.id) ?? 0;

                return (
                  <tr key={l.id}>
                    <td>
                      <div className="t-title">{targetName(l)}</div>
                      {l.label && <div className="t-sub">{l.label}</div>}
                    </td>
                    <td>
                      <span className="badge">{targetLabel[l.targetType]}</span>
                      {l.passwordHash && (
                        <span className="badge" style={{ marginLeft: 4 }}>
                          🔒
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${state.cls}`}>{state.text}</span>
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {l.viewCount}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {plays}
                    </td>
                    <td className="t-sub">
                      {fmtDate(l.createdAt)}
                      {l.expiresAt && (
                        <div style={{ color: "var(--text-mute)" }}>
                          exp. {fmtDate(l.expiresAt)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <CopyLink url={url} />
                        {l.revoked ? (
                          <form action={restoreLink}>
                            <input type="hidden" name="id" value={l.id} />
                            <button className="btn btn-xs" type="submit">
                              Réactiver
                            </button>
                          </form>
                        ) : (
                          <form action={revokeLink}>
                            <input type="hidden" name="id" value={l.id} />
                            <button className="btn btn-xs" type="submit" style={{ color: "var(--xol-carmin)" }}>
                              Révoquer
                            </button>
                          </form>
                        )}
                        <form action={deleteLink}>
                          <input type="hidden" name="id" value={l.id} />
                          <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--text-mute)" }}>
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
