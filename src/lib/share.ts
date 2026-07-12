import { customAlphabet } from "nanoid";
import { prisma } from "./prisma";

// Token public : lisible, sans caracteres ambigus, difficile a deviner.
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
      demo: { include: { artist: true } },
      artist: { include: { demos: { orderBy: { createdAt: "desc" } } } },
    },
  });
}

// Verifie l'etat d'un lien AVANT de servir quoi que ce soit.
// Centralise ici pour qu'aucune page ni route API ne puisse l'oublier.
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

// REGLE D'OR, cote serveur : le telechargement n'est autorise que si le
// lien porte explicitement allowDownload = true. Cette fonction est appelee
// par la route de download AVANT de servir le moindre octet de master.
export function downloadAllowed(link: { allowDownload: boolean }) {
  return link.allowDownload === true;
}
