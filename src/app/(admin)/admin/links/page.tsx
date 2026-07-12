import { prisma } from "@/lib/prisma";
import { fmtDate, appUrl } from "@/lib/display";
import CopyLink from "@/components/CopyLink";
import { toggleDownload, revokeLink, restoreLink, deleteLink } from "@/server/links";

const targetLabel: Record<string, string> = {
  PROJECT: "Projet",
  TRACK: "Chanson",
  DEMO: "Demo",
  ARTIST: "Artiste",
};

export default async function LinksPage() {
  const links = await prisma.shareLink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: true,
      track: true,
      demo: true,
      artist: true,
    },
  });

  function targetName(l: (typeof links)[number]) {
    return (
      l.project?.title ??
      l.track?.title ??
      l.demo?.title ??
      l.artist?.stageName ??
      "—"
    );
  }

  const base = appUrl();

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>Liens de partage</h1>
        <p className="muted">
          Chaque lien est révocable, peut expirer, et n&apos;autorise le téléchargement que si tu l&apos;actives.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="card">
          <p className="muted">
            Aucun lien. Crée-en depuis un projet, une chanson, une demo ou un artiste.
          </p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {links.map((l: (typeof links)[number]) => {
            const url = `${base}/s/${l.token}`;
            const expired = l.expiresAt && l.expiresAt < new Date();
            const state = l.revoked
              ? { text: "Révoqué", cls: "badge-carmin" }
              : expired
              ? { text: "Expiré", cls: "badge-carmin" }
              : { text: "Actif", cls: "badge-green" };

            return (
              <div key={l.id} className="card" style={{ padding: 16 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                      <span className="badge">{targetLabel[l.targetType]}</span>
                      <span className={`badge ${state.cls}`}>{state.text}</span>
                      {l.allowDownload && <span className="badge badge-yellow">Téléchargement OK</span>}
                      {l.passwordHash && <span className="badge">Protégé</span>}
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {targetName(l)}
                      {l.label && <span className="muted" style={{ fontWeight: 400 }}> — {l.label}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
                      {l.viewCount} vue{l.viewCount > 1 ? "s" : ""} · créé le {fmtDate(l.createdAt)}
                      {l.expiresAt && <> · expire le {fmtDate(l.expiresAt)}</>}
                    </div>
                    <code
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--xol-indigo)",
                        background: "var(--surface-2)",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {url}
                    </code>
                  </div>
                </div>

                <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <CopyLink url={url} />
                  <form action={toggleDownload}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-sm" type="submit">
                      {l.allowDownload ? "Bloquer le téléchargement" : "Autoriser le téléchargement"}
                    </button>
                  </form>
                  {l.revoked ? (
                    <form action={restoreLink}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="btn btn-sm" type="submit">
                        Réactiver
                      </button>
                    </form>
                  ) : (
                    <form action={revokeLink}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="btn btn-sm" type="submit" style={{ color: "var(--xol-carmin)" }}>
                        Révoquer
                      </button>
                    </form>
                  )}
                  <form action={deleteLink}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-sm btn-ghost" type="submit" style={{ color: "var(--text-mute)" }}>
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
