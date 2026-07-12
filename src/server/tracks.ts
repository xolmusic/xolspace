"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { putObject, deleteObject, keys } from "@/lib/storage";
import {
  transcodeToMp3,
  extractDurationSec,
  computeWaveform,
} from "@/lib/audio";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

// Pipeline commun : recoit un WAV, stocke le master, genere le MP3 320,
// calcule duree + waveform. Le master n'est jamais rendu public.
async function ingestWav(
  file: File,
  masterKey: string,
  streamKey: string
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  await putObject(masterKey, buffer, "audio/wav");

  const durationSec = await extractDurationSec(buffer);
  const waveform = await computeWaveform(buffer);

  let hasStream = false;
  try {
    const mp3 = await transcodeToMp3(buffer);
    await putObject(streamKey, mp3, "audio/mpeg");
    hasStream = true;
  } catch (e) {
    console.error("Transcodage MP3 echoue :", e);
  }

  return {
    durationSec,
    waveformJson: waveform ? JSON.stringify(waveform) : null,
    streamKey: hasStream ? streamKey : null,
  };
}

// --- Tracks (rattachees a un projet) ---
export async function addTrack(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId"));
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Donne un titre à la chanson." };
  if (!file || file.size === 0) return { error: "Ajoute un fichier WAV." };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Projet introuvable." };

  const count = await prisma.track.count({ where: { projectId } });
  const track = await prisma.track.create({
    data: {
      title,
      projectId,
      artistId: project.artistId,
      position: count + 1,
      masterKey: "pending",
      isrc: String(formData.get("isrc") ?? "").trim() || null,
      bpm: formData.get("bpm") ? Number(formData.get("bpm")) : null,
      songKey: String(formData.get("songKey") ?? "").trim() || null,
    },
  });

  const masterKey = keys.trackMaster(track.id);
  const streamKey = keys.trackStream(track.id);
  const ingested = await ingestWav(file, masterKey, streamKey);

  await prisma.track.update({
    where: { id: track.id },
    data: { masterKey, ...ingested },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}

export async function deleteTrack(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const track = await prisma.track.findUnique({ where: { id } });
  if (track) {
    await deleteObject(track.masterKey);
    if (track.streamKey) await deleteObject(track.streamKey);
    await prisma.track.delete({ where: { id } });
    revalidatePath(`/admin/projects/${track.projectId}`);
  }
}

// --- Demos (dossier artiste, hors projet) ---
export async function addDemo(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const artistId = String(formData.get("artistId"));
  const file = formData.get("file") as File | null;
  const title =
    String(formData.get("title") ?? "").trim() ||
    (file?.name?.replace(/\.[^.]+$/, "") ?? "Demo");

  if (!file || file.size === 0) return { error: "Ajoute un fichier WAV." };

  const demo = await prisma.demo.create({
    data: {
      title,
      artistId,
      masterKey: "pending",
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  const masterKey = keys.demoMaster(demo.id);
  const streamKey = keys.demoStream(demo.id);
  const ingested = await ingestWav(file, masterKey, streamKey);

  await prisma.demo.update({
    where: { id: demo.id },
    data: { masterKey, ...ingested },
  });

  revalidatePath(`/admin/artists/${artistId}`);
  return { ok: true };
}

export async function deleteDemo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const demo = await prisma.demo.findUnique({ where: { id } });
  if (demo) {
    await deleteObject(demo.masterKey);
    if (demo.streamKey) await deleteObject(demo.streamKey);
    await prisma.demo.delete({ where: { id } });
    revalidatePath(`/admin/artists/${demo.artistId}`);
  }
}
