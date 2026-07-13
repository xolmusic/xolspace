import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDuration, fmtDate } from "@/lib/display";
import AudioPlayer from "@/components/AudioPlayer";
import ShareButton from "@/components/ShareButton";
import { deleteDemo } from "@/server/tracks";

export default async function DemosPage() {
  const artists = await prisma.artist.findMany({
    orderBy: { stageName: "asc" },
    include: { demos: { orderBy: { createdAt: "desc" } } },
  });

  const withDemos = artists.filter((a: (typeof artists)[number]) => a.demos.length > 0);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>Demos</h1>
        <p className="muted">
          Toutes les demos du label, par artiste. Ajoute-les depuis la fiche de chaque artiste.
        </p>
      </div>

      {withDemos.length === 0 ? (
        <div className="card">
          <p className="muted">Aucune demo pour l&apos;instant.</p>
        </div>
      ) : (
        withDemos.map((a: (typeof withDemos)[number]) => (
          <section key={a.id}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 17 }}>{a.stageName}</h2>
              <Link href={`/admin/artists/${a.id}`} className="btn btn-sm">
                Dossier de l&apos;artiste
              </Link>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {a.demos.map((d: (typeof a.demos)[number]) => {
                const streamUrl = `/api/admin-stream/demo/${d.id}`;
                return (
                  <div key={d.id} className="card" style={{ padding: 14 }}>
                    <div style={{ marginBottom: 10 }}>
                      <AudioPlayer
                        src={streamUrl}
                        title={d.title}
                        subtitle={`Demo · ${fmtDuration(d.durationSec)} · ${fmtDate(d.createdAt)}`}
                      />
                    </div>
                    <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                      <ShareButton targetType="DEMO" targetId={d.id} returnTo="/admin/demos" small />
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
          </section>
        ))
      )}
    </div>
  );
}
