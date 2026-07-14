"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult = { ok?: boolean; error?: string };

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

// --- Campagne ---
export async function createCampaign(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const artistId = String(formData.get("artistId") ?? "").trim();
  if (!name) return { error: "Donne un nom à la campagne." };
  if (!artistId) return { error: "Choisis un artiste." };

  const campaign = await prisma.campaign.create({
    data: {
      name,
      artistId,
      projectId: String(formData.get("projectId") ?? "").trim() || null,
      pitch: String(formData.get("pitch") ?? "").trim() || null,
      shareToken: String(formData.get("shareToken") ?? "").trim() || null,
    },
  });
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${campaign.id}`);
}

export async function updateCampaign(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom est obligatoire." };

  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;
  await prisma.campaign.update({
    where: { id },
    data: {
      name,
      status: (String(formData.get("status") ?? "DRAFT")) as never,
      projectId: clean("projectId"),
      pitch: clean("pitch"),
      shareToken: clean("shareToken"),
      emailSubject: clean("emailSubject"),
      emailBody: clean("emailBody"),
      signature: clean("signature"),
    },
  });
  revalidatePath(`/admin/campaigns/${id}`);
  return { ok: true };
}

export async function deleteCampaign(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

// --- Ciblage : ajoute des destinataires selon des criteres ---
export async function addRecipients(formData: FormData) {
  await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  const type = String(formData.get("type") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  const where: Record<string, unknown> = { email: { not: null } };
  if (type) where.type = type;
  if (country) where.country = country;

  const contacts = await prisma.contact.findMany({ where: where as never, select: { id: true } });

  // Creer les destinataires manquants (ignore les doublons via unique).
  for (const c of contacts) {
    await prisma.campaignRecipient
      .create({ data: { campaignId, contactId: c.id } })
      .catch(() => {}); // doublon (deja destinataire) => ignore
  }
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function addSingleRecipient(formData: FormData) {
  await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  const contactId = String(formData.get("contactId"));
  await prisma.campaignRecipient
    .create({ data: { campaignId, contactId } })
    .catch(() => {});
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function removeRecipient(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const campaignId = String(formData.get("campaignId"));
  await prisma.campaignRecipient.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

// --- Suivi : changer le statut d'un destinataire ---
export async function setRecipientStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const campaignId = String(formData.get("campaignId"));
  const status = String(formData.get("status"));

  const data: Record<string, unknown> = { status };
  // Horodatage automatique selon le statut atteint.
  if (status === "SENT") data.sentAt = new Date();
  if (status === "REPLIED") data.repliedAt = new Date();
  if (status === "PUBLISHED") data.publishedAt = new Date();

  const resultUrl = String(formData.get("resultUrl") ?? "").trim();
  if (resultUrl) data.resultUrl = resultUrl;

  await prisma.campaignRecipient.update({ where: { id }, data });
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

// Marque tous les "a envoyer" comme envoyes (apres un envoi groupe manuel).
export async function markAllSent(formData: FormData) {
  await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  await prisma.campaignRecipient.updateMany({
    where: { campaignId, status: "TO_SEND" },
    data: { status: "SENT", sentAt: new Date() },
  });
  revalidatePath(`/admin/campaigns/${campaignId}`);
}
