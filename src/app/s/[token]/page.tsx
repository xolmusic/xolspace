import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { resolveShare } from "@/lib/share";
import { projectTypeLabel, fmtDuration } from "@/lib/display";
import PublicPlayer from "@/components/PublicPlayer";
import EpkPublic, { buildEpkMusic } from "@/components/EpkPublic";
import PasswordGate from "./PasswordGate";
import { signedGetUrl } from "@/lib/storage";
import Cover from "@/components/Cover";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Image
          src="/brand/xol-logo.png"
          alt="XOL Music"
          width={110}
          height={48}
          style={{ height: "auto", width: 110 }}
          priority
        />
      </header>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 40px" }}>
        {children}
      </div>
      <footer
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 24px 56px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            fontSize: 11.5,
            lineHeight: 1.6,
            color: "var(--text-mute)",
            textAlign: "center",
          }}
        >
          © 2026–2028 XOL Music. Tous droits réservés.
          <br />
          Les enregistrements accessibles via ce lien sont la propriété
          intellectuelle exclusive de XOL Music et de ses ayants droit. Ils vous
          sont communiqués à titre strictement confidentiel, pour écoute privée
          uniquement. Toute reproduction, diffusion publique, distribution,
          téléchargement ou exploitation commerciale, totale ou partielle, sans
          autorisation écrite préalable de XOL Music, est strictement interdite
          et expose son auteur à des poursuites.
        </p>
      </footer>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "50vh", textAlign: "center" }}>
      <div>{children}</div>
    </div>
  );
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pw?: string }>;
}) {
  const { token } = await params;
  const { pw } = await searchParams;

  const access = await resolveShare(token, pw);

  if (!access.ok) {
    if (access.reason === "password") {
      return (
        <Shell>
          <Centered>
            <PasswordGate wrong={!!pw} />
          </Centered>
        </Shell>
      );
    }
    const messages: Record<string, string> = {
      not_found: "Ce lien n'existe pas ou a été supprimé.",
      revoked: "Ce lien a été désactivé par XOL Music.",
      expired: "Ce lien a expiré.",
    };
    return (
      <Shell>
        <Centered>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Lien indisponible</h1>
          <p className="muted">{messages[access.reason] ?? "Accès impossible."}</p>
        </Centered>
      </Shell>
    );
  }

  const link = access.link!;

  // Incrementer le compteur de vues (best effort).
  prisma.shareLink
    .update({ where: { id: link.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // --- Rendu selon le type de cible ---
  if (link.targetType === "PROJECT" && link.project) {
    const p = link.project;
    const cover = p.coverKey ? await signedGetUrl(p.coverKey, 3600) : null;
    return (
      <Shell>
        <div className="row" style={{ gap: 20, alignItems: "flex-start", marginBottom: 28 }}>
          <Cover src={cover} size={150} radius={14} />
          <div>
            <span className="badge">{projectTypeLabel[p.type]}</span>
            <h1 style={{ fontSize: 30, marginTop: 8 }}>{p.title}</h1>
            <p className="muted" style={{ fontSize: 16 }}>{p.artist.stageName}</p>
            {p.genre && <p style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 6 }}>{p.genre}</p>}
          </div>
        </div>
        <PublicPlayer
          token={token}
          password={pw}
          items={p.tracks.map((t: (typeof p.tracks)[number]) => ({
            id: t.id,
            title: `${t.position}. ${t.title}`,
            subtitle: fmtDuration(t.durationSec),
          }))}
        />
      </Shell>
    );
  }

  if (link.targetType === "TRACK" && link.track) {
    const t = link.track;
    const cover = t.project?.coverKey
      ? await signedGetUrl(t.project.coverKey, 3600)
      : null;
    return (
      <Shell>
        <div className="row" style={{ gap: 20, alignItems: "flex-start", marginBottom: 28 }}>
          <Cover src={cover} size={120} radius={14} />
          <div>
            <h1 style={{ fontSize: 26 }}>{t.title}</h1>
            <p className="muted">
              {t.artist.stageName}
              {t.project ? ` · ${t.project.title}` : ""}
            </p>
          </div>
        </div>
        <PublicPlayer
          token={token}
          password={pw}
          items={[
            {
              id: t.id,
              title: t.title,
              subtitle: fmtDuration(t.durationSec),
            },
          ]}
        />
      </Shell>
    );
  }

  if (link.targetType === "ARTIST" && link.artist) {
    const a = link.artist;
    const tracks = a.tracks;
    return (
      <Shell>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30 }}>{a.stageName}</h1>
          <p className="muted">{a.country || ""}</p>
          {a.bio && <p style={{ marginTop: 10, maxWidth: 560 }}>{a.bio}</p>}
        </div>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Titres</h2>
        <PublicPlayer
          token={token}
          password={pw}
          items={tracks.map((t: (typeof tracks)[number]) => ({
            id: t.id,
            title: t.title,
            subtitle: fmtDuration(t.durationSec),
          }))}
        />
      </Shell>
    );
  }

  if (link.targetType === "EPK" && link.epk) {
    const epk = link.epk;
    // Charger les titres et projets references par l'EPK pour la musique.
    const trackIds = epk.items.map((i: { trackId: string | null }) => i.trackId).filter(Boolean) as string[];
    const projectIds = epk.items.map((i: { projectId: string | null }) => i.projectId).filter(Boolean) as string[];

    const [tracks, projects] = await Promise.all([
      trackIds.length
        ? prisma.track.findMany({ where: { id: { in: trackIds } } })
        : Promise.resolve([]),
      projectIds.length
        ? prisma.project.findMany({
            where: { id: { in: projectIds } },
            include: { tracks: { orderBy: { position: "asc" } } },
          })
        : Promise.resolve([]),
    ]);

    const tracksById = new Map(
      tracks.map((t: { id: string; title: string; durationSec: number | null }) => [t.id, t])
    );
    const projectsById = new Map(
      projects.map((p: { id: string; tracks: { id: string; title: string; durationSec: number | null; position: number }[] }) => [p.id, p])
    );
    const music = buildEpkMusic(epk.items, tracksById as never, projectsById as never);

    return (
      <Shell>
        <EpkPublic
          token={token}
          password={pw}
          epk={{
            tagline: epk.tagline,
            bio: epk.bio,
            facebook: epk.facebook,
            tiktok: epk.tiktok,
            instagram: epk.instagram,
            spotify: epk.spotify,
            appleMusic: epk.appleMusic,
            bookingEmail: epk.bookingEmail,
            artist: { stageName: epk.artist.stageName, country: epk.artist.country },
            photos: epk.photos,
            videos: epk.videos,
          }}
          music={music}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Centered>
        <p className="muted">Contenu indisponible.</p>
      </Centered>
    </Shell>
  );
}
