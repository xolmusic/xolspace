import { customAlphabet } from "nanoid";
import { prisma } from "./prisma";

const nano = customAlphabet(
  "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ",
  12
);

export function newShareToken() {
  return nano();
}

export type ShareAccess =
  | { ok: false; reason: "not_found" | "revoked" | "expired" | "password" }
  | { ok: true; link: Awaited<ReturnType<typeof loadLink>> };

async function loadLink(token: string) {
  return prisma.shareLink.findUnique({
    where: { token },
    include: {
      project: { include: { tracks: { orderBy: { position: "asc" } }, artist: true } },
      track: { include: { artist: true, project: true } },
      artist: { include: { tracks: { orderBy: { createdAt: "desc" } } } },
      epk: {
        include: {
          artist: true,
          photos: { orderBy: { position: "asc" } },
          videos: { orderBy: { position: "asc" } },
          items: { orderBy: { position: "asc" } },
        },
      },
    },
  });
}

// Verifie l'etat d'un lien avant de servir quoi que ce soit.
export async function resolveShare(
  token: string,
  providedPassword?: string
): Promise<ShareAccess> {
  const link = await loadLink(token);
  if (!link) return { ok: false, reason: "not_found" };
  if (link.revoked) return { ok: false, reason: "revoked" };
  if (link.expiresAt && link.expiresAt < new Date())
    return { ok: false, reason: "expired" };

  if (link.passwordHash) {
    if (!providedPassword) return { ok: false, reason: "password" };
    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(providedPassword, link.passwordHash);
    if (!ok) return { ok: false, reason: "password" };
  }

  return { ok: true, link };
}

// Determine la cle R2 de l'image d'apercu (link preview) pour un lien donne.
// Priorite : pochette (projet/titre), sinon photo d'artiste ou 1re photo EPK.
export async function previewImageKey(token: string): Promise<string | null> {
  const link = await loadLink(token);
  if (!link) return null;

  if (link.targetType === "PROJECT" && link.project) {
    return link.project.coverKey ?? null;
  }
  if (link.targetType === "TRACK" && link.track) {
    return link.track.project?.coverKey ?? null;
  }
  if (link.targetType === "ARTIST" && link.artist) {
    return link.artist.photoKey ?? null;
  }
  if (link.targetType === "EPK" && link.epk) {
    // 1re photo presse de l'EPK, sinon la photo de profil de l'artiste.
    if (link.epk.photos && link.epk.photos.length > 0) {
      return link.epk.photos[0].imageKey;
    }
    return link.epk.artist?.photoKey ?? null;
  }
  return null;
}

// Titre lisible pour l'apercu de lien.
export async function previewTitle(token: string): Promise<string> {
  const link = await loadLink(token);
  if (!link) return "XOL Music";
  if (link.targetType === "PROJECT" && link.project) return link.project.title;
  if (link.targetType === "TRACK" && link.track) return link.track.title;
  if (link.targetType === "ARTIST" && link.artist) return link.artist.stageName;
  if (link.targetType === "EPK" && link.epk) return `${link.epk.artist?.stageName ?? "Artiste"} — Presskit`;
  return "XOL Music";
}
