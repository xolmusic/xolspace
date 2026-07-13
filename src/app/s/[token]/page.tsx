import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { resolveShare } from "@/lib/share";
import { projectTypeLabel, fmtDuration } from "@/lib/display";
import PublicPlayer from "@/components/PublicPlayer";
import PasswordGate from "./PasswordGate";
import { signedGetUrl } from "@/lib/storage";

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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 80px" }}>
        {children}
      </div>
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
          <div style={{ width: 150, height: 150, borderRadius: 14, background: "var(--surface-3)", flexShrink: 0, overflow: "hidden" }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
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
    const cover = t.project.coverKey ? await signedGetUrl(t.project.coverKey, 3600) : null;
    return (
      <Shell>
        <div className="row" style={{ gap: 20, alignItems: "flex-start", marginBottom: 28 }}>
          <div style={{ width: 120, height: 120, borderRadius: 14, background: "var(--surface-3)", flexShrink: 0, overflow: "hidden" }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 26 }}>{t.title}</h1>
            <p className="muted">{t.artist.stageName} · {t.project.title}</p>
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

  if (link.targetType === "DEMO" && link.demo) {
    const d = link.demo;
    return (
      <Shell>
        <div style={{ marginBottom: 28 }}>
          <span className="badge">Demo</span>
          <h1 style={{ fontSize: 26, marginTop: 8 }}>{d.title}</h1>
          <p className="muted">{d.artist.stageName}</p>
        </div>
        <PublicPlayer
          token={token}
          password={pw}
          items={[
            {
              id: d.id,
              title: d.title,
              subtitle: fmtDuration(d.durationSec),
            },
          ]}
        />
      </Shell>
    );
  }

  if (link.targetType === "ARTIST" && link.artist) {
    const a = link.artist;
    const demos = a.demos;
    return (
      <Shell>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30 }}>{a.stageName}</h1>
          <p className="muted">{a.country || ""}</p>
          {a.bio && <p style={{ marginTop: 10, maxWidth: 560 }}>{a.bio}</p>}
        </div>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Demos</h2>
        <PublicPlayer
          token={token}
          password={pw}
          items={demos.map((d: (typeof demos)[number]) => ({
            id: d.id,
            title: d.title,
            subtitle: fmtDuration(d.durationSec),
          }))}
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
