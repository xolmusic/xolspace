"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { putObject, deleteObject, keys } from "@/lib/storage";
import type { ProjectType, ReleaseStatus } from "@prisma/client";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createProject(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const artistId = String(formData.get("artistId") ?? "");
  if (!title) return { error: "Le nom du projet est obligatoire." };
  if (!artistId) return { error: "Choisis un artiste." };

  const project = await prisma.project.create({
    data: {
      title,
      artistId,
      type: (String(formData.get("type")) as ProjectType) || "SINGLE",
      status: (String(formData.get("status")) as ReleaseStatus) || "UNRELEASED",
      genre: String(formData.get("genre") ?? "").trim() || null,
      catalogRef: String(formData.get("catalogRef") ?? "").trim() || null,
      upc: String(formData.get("upc") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      releaseDate: parseDate(formData.get("releaseDate")),
    },
  });

  const cover = formData.get("cover") as File | null;
  if (cover && cover.size > 0) {
    const ext = (cover.name.split(".").pop() || "jpg").toLowerCase();
    const key = keys.projectCover(project.id, ext);
    await putObject(
      key,
      Buffer.from(await cover.arrayBuffer()),
      cover.type || "image/jpeg"
    );
    await prisma.project.update({ where: { id: project.id }, data: { coverKey: key } });
  }

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le nom du projet est obligatoire." };

  const data: Record<string, unknown> = {
    title,
    type: String(formData.get("type")) as ProjectType,
    status: String(formData.get("status")) as ReleaseStatus,
    genre: String(formData.get("genre") ?? "").trim() || null,
    catalogRef: String(formData.get("catalogRef") ?? "").trim() || null,
    upc: String(formData.get("upc") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    releaseDate: parseDate(formData.get("releaseDate")),
  };

  const cover = formData.get("cover") as File | null;
  if (cover && cover.size > 0) {
    const ext = (cover.name.split(".").pop() || "jpg").toLowerCase();
    const key = keys.projectCover(id, ext);
    await putObject(
      key,
      Buffer.from(await cover.arrayBuffer()),
      cover.type || "image/jpeg"
    );
    data.coverKey = key;
  }

  await prisma.project.update({ where: { id }, data });
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true };
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tracks: true },
  });
  if (project?.coverKey) await deleteObject(project.coverKey);
  for (const t of project?.tracks ?? []) {
    await deleteObject(keys.trackMaster(t.id));
    await deleteObject(keys.trackStream(t.id));
  }
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
