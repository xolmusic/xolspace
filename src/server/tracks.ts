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

// Ajoute un titre. Le fichier MP3 est deja dans R2 (upload direct navigateur).
// Le titre est rattache a un artiste, et facultativement a un projet.
export async function addTrack(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const audioId = String(formData.get("audioId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  let artistId = String(formData.get("artistId") ?? "").trim() || null;

  if (!title) return { error: "Donne un titre à la chanson." };
  if (!audioId) return { error: "Le fichier n'a pas été envoyé." };

  let position = 0;
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Projet introuvable." };
    artistId = project.artistId; // dans un projet, l'artiste suit le projet
    position = await prisma.track.count({ where: { projectId } });
  }

  if (!artistId) return { error: "Choisis un artiste." };

  await prisma.track.create({
    data: {
      title,
      artistId,
      projectId,
      position,
      audioKey: keys.trackAudio(audioId),
      genre: String(formData.get("genre") ?? "").trim() || null,
      durationSec: formData.get("durationSec")
        ? Math.round(Number(formData.get("durationSec")))
        : null,
    },
  });

  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  if (artistId) revalidatePath(`/admin/artists/${artistId}`);
  revalidatePath("/admin/catalogue");
  return { ok: true };
}

// Modifie un titre : nom, artiste, projet (ou aucun), genre, et metadonnees.
export async function updateTrack(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le titre est obligatoire." };

  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  let artistId = String(formData.get("artistId") ?? "").trim() || null;

  // Si un projet est choisi, l'artiste suit le projet (coherence).
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Projet introuvable." };
    artistId = project.artistId;
  }
  if (!artistId) return { error: "Choisis un artiste." };

  await prisma.track.update({
    where: { id },
    data: {
      title,
      artistId,
      projectId,
      genre: String(formData.get("genre") ?? "").trim() || null,
      bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
      songKey: String(formData.get("songKey") ?? "").trim() || null,
      isrc: String(formData.get("isrc") ?? "").trim() || null,
    },
  });

  revalidatePath("/admin/catalogue");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/artists/${artistId}`);
  return { ok: true };
}

export async function deleteTrack(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const track = await prisma.track.findUnique({ where: { id } });
  if (track) {
    await deleteObject(track.audioKey);
    await prisma.track.delete({ where: { id } });
    if (track.projectId) revalidatePath(`/admin/projects/${track.projectId}`);
    revalidatePath(`/admin/artists/${track.artistId}`);
    revalidatePath("/admin/catalogue");
  }
}
