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
