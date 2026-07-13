"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { putObject, deleteObject, keys } from "@/lib/storage";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function createArtist(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const stageName = String(formData.get("stageName") ?? "").trim();
  if (!stageName) return { error: "Le nom d'artiste est obligatoire." };

  const country = String(formData.get("country") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  const artist = await prisma.artist.create({
    data: { stageName, country, bio },
  });

  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
    const key = keys.artistPhoto(artist.id, ext);
    await putObject(
      key,
      Buffer.from(await photo.arrayBuffer()),
      photo.type || "image/jpeg"
    );
    await prisma.artist.update({ where: { id: artist.id }, data: { photoKey: key } });
  }

  revalidatePath("/admin/artists");
  redirect(`/admin/artists/${artist.id}`);
}

export async function updateArtist(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const stageName = String(formData.get("stageName") ?? "").trim();
  if (!stageName) return { error: "Le nom d'artiste est obligatoire." };

  const data: Record<string, unknown> = {
    stageName,
    country: String(formData.get("country") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
  };

  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
    const key = keys.artistPhoto(id, ext);
    await putObject(
      key,
      Buffer.from(await photo.arrayBuffer()),
      photo.type || "image/jpeg"
    );
    data.photoKey = key;
  }

  await prisma.artist.update({ where: { id }, data });
  revalidatePath(`/admin/artists/${id}`);
  return { ok: true };
}

export async function deleteArtist(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: { tracks: true, demos: true },
  });
  if (artist?.photoKey) await deleteObject(artist.photoKey);
  // Les masters/streams des tracks et demos sont nettoyes par leurs cascades DB ;
  // pour R2 on supprime les objets connus.
  for (const t of artist?.tracks ?? []) {
    await deleteObject(keys.trackAudio(t.id));
  }
  for (const d of artist?.demos ?? []) {
    await deleteObject(keys.demoAudio(d.id));
  }
  await prisma.artist.delete({ where: { id } });
  revalidatePath("/admin/artists");
  redirect("/admin/artists");
}
