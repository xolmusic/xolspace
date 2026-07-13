"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, hash } from "@/lib/auth";
import { newShareToken } from "@/lib/share";
import type { ShareTargetType } from "@prisma/client";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

// Cree un lien de partage (ecoute seule) pour n'importe quelle cible.
export async function createShareLink(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const targetType = String(formData.get("targetType")) as ShareTargetType;
  const targetId = String(formData.get("targetId"));
  const label = String(formData.get("label") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "").trim();

  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

  const data: Record<string, unknown> = {
    token: newShareToken(),
    targetType,
    label,
    expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
    passwordHash: password ? await hash(password) : null,
  };

  if (targetType === "PROJECT") data.projectId = targetId;
  else if (targetType === "TRACK") data.trackId = targetId;
  else if (targetType === "ARTIST") data.artistId = targetId;

  await prisma.shareLink.create({ data: data as never });

  revalidatePath("/admin/links");
  const back = String(formData.get("returnTo") ?? "/admin/links");
  revalidatePath(back);
  return { ok: true };
}

export async function revokeLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.shareLink.update({ where: { id }, data: { revoked: true } });
  revalidatePath("/admin/links");
}

export async function restoreLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.shareLink.update({ where: { id }, data: { revoked: false } });
  revalidatePath("/admin/links");
}

export async function deleteLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.shareLink.delete({ where: { id } });
  revalidatePath("/admin/links");
}
