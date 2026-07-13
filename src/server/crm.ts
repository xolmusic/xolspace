"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { ContactType, InteractionStatus } from "@prisma/client";

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
}

type ActionResult = { ok?: boolean; error?: string };

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// --- Contacts ---
export async function createContact(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  if (!name) return { error: "Le nom est obligatoire." };
  if (!type) return { error: "Choisis un type de contact." };

  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;

  const contact = await prisma.contact.create({
    data: {
      name,
      type: type as ContactType,
      organization: clean("organization"),
      email: clean("email"),
      phone: clean("phone"),
      country: clean("country"),
      socials: clean("socials"),
      notes: clean("notes"),
    },
  });

  revalidatePath("/admin/crm");
  redirect(`/admin/crm/${contact.id}`);
}

export async function updateContact(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom est obligatoire." };

  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;

  await prisma.contact.update({
    where: { id },
    data: {
      name,
      type: String(formData.get("type")) as ContactType,
      organization: clean("organization"),
      email: clean("email"),
      phone: clean("phone"),
      country: clean("country"),
      socials: clean("socials"),
      notes: clean("notes"),
    },
  });

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
  return { ok: true };
}

export async function deleteContact(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/admin/crm");
  redirect("/admin/crm");
}

// --- Interactions ---
export async function createInteraction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const contactId = String(formData.get("contactId"));
  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;

  await prisma.interaction.create({
    data: {
      contactId,
      subject: clean("subject"),
      status: (String(formData.get("status")) as InteractionStatus) || "TO_CONTACT",
      shareToken: clean("shareToken"),
      externalUrl: clean("externalUrl"),
      sentAt: parseDate(formData.get("sentAt")),
      repliedAt: parseDate(formData.get("repliedAt")),
      followUpAt: parseDate(formData.get("followUpAt")),
      notes: clean("notes"),
    },
  });

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${contactId}`);
  return { ok: true };
}

export async function updateInteraction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const contactId = String(formData.get("contactId"));
  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;

  await prisma.interaction.update({
    where: { id },
    data: {
      subject: clean("subject"),
      status: String(formData.get("status")) as InteractionStatus,
      shareToken: clean("shareToken"),
      externalUrl: clean("externalUrl"),
      sentAt: parseDate(formData.get("sentAt")),
      repliedAt: parseDate(formData.get("repliedAt")),
      followUpAt: parseDate(formData.get("followUpAt")),
      notes: clean("notes"),
    },
  });

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${contactId}`);
  return { ok: true };
}

// Changement rapide de statut depuis la liste (ex: marquer "Relancé").
export async function setInteractionStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as InteractionStatus;
  const contactId = String(formData.get("contactId"));
  await prisma.interaction.update({ where: { id }, data: { status } });
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${contactId}`);
}

export async function deleteInteraction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const contactId = String(formData.get("contactId"));
  await prisma.interaction.delete({ where: { id } });
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${contactId}`);
}
