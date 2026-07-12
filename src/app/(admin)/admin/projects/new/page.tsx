import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProjectForm from "../ProjectForm";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const { artist } = await searchParams;
  const artists = await prisma.artist.findMany({ orderBy: { stageName: "asc" } });

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 640 }}>
      <Link href="/admin/projects" style={{ fontSize: 14, color: "var(--text-soft)" }}>
        ← Projets
      </Link>
      <h1 style={{ fontSize: 26 }}>Nouveau projet</h1>

      {artists.length === 0 ? (
        <div className="card">
          <p className="muted">
            Crée d&apos;abord un artiste — un projet doit être rattaché à un artiste.
          </p>
          <Link href="/admin/artists" className="btn btn-primary" style={{ marginTop: 12 }}>
            Aller aux artistes
          </Link>
        </div>
      ) : (
        <ProjectForm
          artists={artists.map((a: (typeof artists)[number]) => ({ id: a.id, stageName: a.stageName }))}
          defaultArtistId={artist}
        />
      )}
    </div>
  );
}
