"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { deleteObject, keys } from "@/lib/storage";
import { parseMoney } from "@/lib/money";

type ActionResult = { ok?: boolean; error?: string };

// Les finances sont reservees au super admin : chaque action le reverifie
// en base, car une action serveur peut etre appelee sans passer par la page.
async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// --- Categories par defaut ---
// Creees une seule fois, puis entierement modifiables depuis l'interface.
const DEFAULT_EXPENSE = [
  "Studio", "Beat", "Mix", "Mastering", "Musiciens", "Shooting photo",
  "Clip", "Artwork", "Publicité", "Relations presse", "Distribution",
  "Déplacements", "Hébergement", "Restauration", "Cachets",
  "Administration", "Juridique", "Frais généraux", "Divers",
];

const DEFAULT_INCOME = [
  "Spotify", "Apple Music", "Deezer", "YouTube", "TikTok",
  "Concert", "Showcase", "Booking", "Vente CD", "Vente digitale",
  "Merchandising", "Sponsoring", "Royalties", "Édition",
  "Synchronisation", "Avance distributeur", "Subvention",
  "Investisseur", "Prestation", "Autre",
];

export async function ensureDefaultCategories() {
  const count = await prisma.txCategory.count();
  if (count > 0) return;

  await prisma.txCategory.createMany({
    data: [
      ...DEFAULT_EXPENSE.map((name, i) => ({ name, type: "EXPENSE" as const, position: i })),
      ...DEFAULT_INCOME.map((name, i) => ({ name, type: "INCOME" as const, position: i })),
    ],
  });
}

export async function createCategory(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "EXPENSE") === "INCOME" ? "INCOME" : "EXPENSE";
  if (!name) return { error: "Donne un nom à la catégorie." };

  const exists = await prisma.txCategory.findFirst({ where: { name, type } });
  if (exists) return { error: "Cette catégorie existe déjà." };

  const count = await prisma.txCategory.count({ where: { type } });
  await prisma.txCategory.create({ data: { name, type: type as never, position: count } });
  revalidatePath("/admin/finances/categories");
  revalidatePath("/admin/finances");
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const cat = await prisma.txCategory.findUnique({ where: { id } });
  if (!cat) return;

  // On ne supprime pas une categorie encore utilisee : les ecritures
  // deviendraient orphelines et les analyses fausses.
  const used = await prisma.transaction.count({ where: { category: cat.name, type: cat.type } });
  if (used > 0) return;

  await prisma.txCategory.delete({ where: { id } });
  revalidatePath("/admin/finances/categories");
}

// --- Transactions ---
export async function createTransaction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const type = String(formData.get("type") ?? "EXPENSE") === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = parseMoney(formData.get("amount"));
  const date = parseDate(formData.get("date")) ?? new Date();
  const category = String(formData.get("category") ?? "").trim();

  if (!amount || amount <= 0) return { error: "Renseigne un montant valide." };
  if (!category) return { error: "Choisis une catégorie." };

  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const receiptId = String(formData.get("receiptId") ?? "").trim();
  const receiptExt = String(formData.get("receiptExt") ?? "").trim();

  await prisma.transaction.create({
    data: {
      type: type as never,
      amount,
      date,
      category,
      label: clean("label"),
      counterparty: clean("counterparty"),
      notes: clean("notes"),
      artistId: clean("artistId"),
      projectId: clean("projectId"),
      receiptKey: receiptId ? keys.receipt(receiptId, receiptExt || "pdf") : null,
    },
  });

  revalidatePath("/admin/finances");
  return { ok: true };
}

export async function updateTransaction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const amount = parseMoney(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim();
  if (!amount || amount <= 0) return { error: "Renseigne un montant valide." };
  if (!category) return { error: "Choisis une catégorie." };

  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const receiptId = String(formData.get("receiptId") ?? "").trim();
  const receiptExt = String(formData.get("receiptExt") ?? "").trim();

  const data: Record<string, unknown> = {
    amount,
    date: parseDate(formData.get("date")) ?? new Date(),
    category,
    label: clean("label"),
    counterparty: clean("counterparty"),
    notes: clean("notes"),
    artistId: clean("artistId"),
    projectId: clean("projectId"),
  };
  // Nouveau justificatif fourni : on remplace (et on supprime l'ancien).
  if (receiptId) {
    const old = await prisma.transaction.findUnique({ where: { id } });
    data.receiptKey = keys.receipt(receiptId, receiptExt || "pdf");
    if (old?.receiptKey) await deleteObject(old.receiptKey).catch(() => {});
  }

  await prisma.transaction.update({ where: { id }, data });
  revalidatePath("/admin/finances");
  return { ok: true };
}

export async function deleteTransaction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return;
  if (tx.receiptKey) await deleteObject(tx.receiptKey).catch(() => {});
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/admin/finances");
}

// Duplique une ecriture (pratique pour les charges qui reviennent :
// loyer, abonnements...). La copie est datee d'aujourd'hui, sans justificatif.
export async function duplicateTransaction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return;

  await prisma.transaction.create({
    data: {
      type: tx.type,
      amount: tx.amount,
      date: new Date(),
      category: tx.category,
      label: tx.label,
      counterparty: tx.counterparty,
      notes: tx.notes,
      artistId: tx.artistId,
      projectId: tx.projectId,
      receiptKey: null,
    },
  });
  revalidatePath("/admin/finances");
}

// --- Budget projet ---
export async function setProjectBudget(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const raw = String(formData.get("budget") ?? "").trim();
  const budget = raw ? parseMoney(raw) : null;

  await prisma.project.update({ where: { id }, data: { budget } });
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true };
}
