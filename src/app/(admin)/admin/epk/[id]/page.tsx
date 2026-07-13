import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureEpk } from "@/server/epk";
import { deleteEpkPhoto, deleteEpkItem } from "@/server/epk";
import EpkInfoForm from "@/components/EpkInfoForm";
import EpkPhotoUploader from "@/components/EpkPhotoUploader";
import EpkVideos from "@/components/EpkVideos";
import EpkMusicPicker from "@/components/EpkMusicPicker";
import EpkShareButton from "@/components/EpkShareButton";

export default async function EpkEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: artistId } = await params;
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) notFound();

  // Cree l'EPK au besoin, puis recharge avec ses relations.
  await ensureEpk(artistId);
  const epk = await prisma.epk.findUnique({
    where: { artistId },
    include: {
      photos: { orderBy: { position: "asc" } },
      videos: { orderBy: { position: "asc" } },
      items: { orderBy: { position: "asc" } },
    },
  });
  if (!epk) notFound();

  // Pour le selecteur de musique et l'affichage des items.
  const [allTracks, allProjects] = await Promise.all([
    prisma.track.findMany({ orderBy: { createdAt: "desc" }, include: { artist: true } }),
    prisma.project.findMany({ orderBy: { title: "asc" }, include: { artist: true } }),
  ]);
  const trackOpts = allTracks.map((t: (typeof allTracks)[number]) => ({ id: t.id, title: t.title, artistName: t.artist.stageName }));
  const projectOpts = allProjects.map((p: (typeof allProjects)[number]) => ({ id: p.id, title: p.title, artistName: p.artist.stageName }));

  // Resoudre les items selectionnes en objets lisibles.
  const trackMap = new Map(allTracks.map((t: (typeof allTracks)[number]) => [t.id, t]));
  const projectMap = new Map(allProjects.map((p: (typeof allProjects)[number]) => [p.id, p]));

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Link href="/admin/epk" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Presskit EPK
      </Link>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>EPK — {artist.stageName}</h1>
          <p className="muted" style={{ fontSize: 14 }}>Construis le dossier de presse, puis partage-le.</p>
        </div>
        <EpkShareButton epkId={epk.id} />
      </div>

      {/* Infos + reseaux */}
      <section>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Présentation</h2>
        <EpkInfoForm
          info={{
            id: epk.id,
            bio: epk.bio,
            tagline: epk.tagline,
            facebook: epk.facebook,
            tiktok: epk.tiktok,
            instagram: epk.instagram,
            spotify: epk.spotify,
            appleMusic: epk.appleMusic,
            bookingEmail: epk.bookingEmail,
          }}
        />
      </section>

      {/* Photos */}
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 17 }}>Photos presse</h2>
          <EpkPhotoUploader epkId={epk.id} />
        </div>
        {epk.photos.length === 0 ? (
          <div className="card"><p className="muted" style={{ fontSize: 14 }}>Aucune photo pour l&apos;instant.</p></div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {epk.photos.map((ph: (typeof epk.photos)[number]) => (
              <div key={ph.id} className="card" style={{ padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/img/${ph.imageKey}`} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} />
                <form action={deleteEpkPhoto} style={{ marginTop: 6, textAlign: "right" }}>
                  <input type="hidden" name="id" value={ph.id} />
                  <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--xol-carmin)" }}>Supprimer</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Videos */}
      <section>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Vidéos YouTube</h2>
        <EpkVideos epkId={epk.id} videos={epk.videos} />
      </section>

      {/* Musique */}
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 17 }}>Musique</h2>
          <EpkMusicPicker epkId={epk.id} tracks={trackOpts} projects={projectOpts} />
        </div>
        {epk.items.length === 0 ? (
          <div className="card"><p className="muted" style={{ fontSize: 14 }}>Ajoute des titres ou projets depuis le catalogue.</p></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="tbl">
                <tbody>
                  {epk.items.map((it: (typeof epk.items)[number]) => {
                    const track = it.trackId ? trackMap.get(it.trackId) : null;
                    const project = it.projectId ? projectMap.get(it.projectId) : null;
                    const label = track?.title ?? project?.title ?? "(supprimé)";
                    const kind = track ? "Titre" : "Projet";
                    return (
                      <tr key={it.id}>
                        <td><span className="badge">{kind}</span></td>
                        <td className="t-title">{label}</td>
                        <td>
                          <div className="tbl-actions">
                            <form action={deleteEpkItem}>
                              <input type="hidden" name="id" value={it.id} />
                              <button className="btn btn-xs btn-ghost" type="submit" style={{ color: "var(--xol-carmin)" }}>Retirer</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
