"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteObject, keys } from "@/lib/storage";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

// --- Tracks ---
// Le fichier a deja ete envoye directement dans R2 par le navigateur.
// Ici on ne recoit que des metadonnees legeres : on cree l'enregistrement.
export async function addTrack(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId"));
  const title = String(formData.get("title") ?? "").trim();
  const audioId = String(formData.get("audioId") ?? "").trim();

  if (!title) return { error: "Donne un titre à la chanson." };
  if (!audioId) return { error: "Le fichier n'a pas été envoyé." };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Projet introuvable." };

  const count = await prisma.track.count({ where: { projectId } });
  await prisma.track.create({
    data: {
      title,
      projectId,
      artistId: project.artistId,
      position: count + 1,
      audioKey: keys.trackAudio(audioId),
      durationSec: formData.get("durationSec")
        ? Math.round(Number(formData.get("durationSec")))
        : null,
      isrc: String(formData.get("isrc") ?? "").trim() || null,
      bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
      songKey: String(formData.get("songKey") ?? "").trim() || null,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}

export async function deleteTrack(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const track = await prisma.track.findUnique({ where: { id } });
  if (track) {
    await deleteObject(track.audioKey);
    await prisma.track.delete({ where: { id } });
    revalidatePath(`/admin/projects/${track.projectId}`);
  }
}

// --- Demos ---
export async function addDemo(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const artistId = String(formData.get("artistId"));
  const audioId = String(formData.get("audioId") ?? "").trim();
  const title =
    String(formData.get("title") ?? "").trim() || "Demo";

  if (!audioId) return { error: "Le fichier n'a pas été envoyé." };

  await prisma.demo.create({
    data: {
      title,
      artistId,
      audioKey: keys.demoAudio(audioId),
      durationSec: formData.get("durationSec")
        ? Math.round(Number(formData.get("durationSec")))
        : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath(`/admin/artists/${artistId}`);
  return { ok: true };
}

export async function deleteDemo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const demo = await prisma.demo.findUnique({ where: { id } });
  if (demo) {
    await deleteObject(demo.audioKey);
    await prisma.demo.delete({ where: { id } });
    revalidatePath(`/admin/artists/${demo.artistId}`);
  }
}
