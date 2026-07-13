"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, hash } from "@/lib/auth";
import { deleteObject, keys } from "@/lib/storage";
import { newShareToken } from "@/lib/share";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

// Recupere l'EPK d'un artiste, en le creant s'il n'existe pas encore.
export async function ensureEpk(artistId: string) {
  const existing = await prisma.epk.findUnique({ where: { artistId } });
  if (existing) return existing;
  return prisma.epk.create({ data: { artistId } });
}

// Enregistre les infos texte de l'EPK (bio, accroche, reseaux, contact).
export async function saveEpkInfo(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const epkId = String(formData.get("epkId"));

  const clean = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  await prisma.epk.update({
    where: { id: epkId },
    data: {
      bio: clean("bio"),
      tagline: clean("tagline"),
      facebook: clean("facebook"),
      tiktok: clean("tiktok"),
      instagram: clean("instagram"),
      spotify: clean("spotify"),
      appleMusic: clean("appleMusic"),
      bookingEmail: clean("bookingEmail"),
    },
  });

  revalidatePath(`/admin/epk/${epkId}`);
  return { ok: true };
}

// --- Photos ---
export async function addEpkPhoto(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const epkId = String(formData.get("epkId"));
  const photoId = String(formData.get("photoId") ?? "").trim();
  const ext = String(formData.get("ext") ?? "jpg").trim();
  if (!photoId) return { error: "Image manquante." };

  const count = await prisma.epkPhoto.count({ where: { epkId } });
  await prisma.epkPhoto.create({
    data: { epkId, imageKey: keys.epkPhoto(photoId, ext), position: count },
  });
  revalidatePath(`/admin/epk/${epkId}`);
  return { ok: true };
}

export async function deleteEpkPhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const photo = await prisma.epkPhoto.findUnique({ where: { id } });
  if (photo) {
    await deleteObject(photo.imageKey);
    await prisma.epkPhoto.delete({ where: { id } });
    revalidatePath(`/admin/epk/${photo.epkId}`);
  }
}

// --- Videos YouTube ---
export async function addEpkVideo(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const epkId = String(formData.get("epkId"));
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  if (!url) return { error: "Ajoute un lien YouTube." };

  const count = await prisma.epkVideo.count({ where: { epkId } });
  await prisma.epkVideo.create({ data: { epkId, url, title, position: count } });
  revalidatePath(`/admin/epk/${epkId}`);
  return { ok: true };
}

export async function deleteEpkVideo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const v = await prisma.epkVideo.findUnique({ where: { id } });
  if (v) {
    await prisma.epkVideo.delete({ where: { id } });
    revalidatePath(`/admin/epk/${v.epkId}`);
  }
}

// --- Elements musicaux (titres / projets) ---
export async function addEpkItem(formData: FormData) {
  await requireAdmin();
  const epkId = String(formData.get("epkId"));
  const kind = String(formData.get("kind")); // "track" | "project"
  const refId = String(formData.get("refId"));

  const count = await prisma.epkItem.count({ where: { epkId } });
  await prisma.epkItem.create({
    data: {
      epkId,
      position: count,
      trackId: kind === "track" ? refId : null,
      projectId: kind === "project" ? refId : null,
    },
  });
  revalidatePath(`/admin/epk/${epkId}`);
}

export async function deleteEpkItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const item = await prisma.epkItem.findUnique({ where: { id } });
  if (item) {
    await prisma.epkItem.delete({ where: { id } });
    revalidatePath(`/admin/epk/${item.epkId}`);
  }
}

// --- Lien de partage EPK ---
export async function createEpkShareLink(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const epkId = String(formData.get("epkId"));
  const label = String(formData.get("label") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

  await prisma.shareLink.create({
    data: {
      token: newShareToken(),
      targetType: "EPK",
      epkId,
      label,
      expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
      passwordHash: password ? await hash(password) : null,
    },
  });
  revalidatePath(`/admin/epk/${epkId}`);
  revalidatePath("/admin/links");
  return { ok: true };
}
