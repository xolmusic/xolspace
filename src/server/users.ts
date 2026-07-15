"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, hash } from "@/lib/auth";

type ActionResult = { ok?: boolean; error?: string };

// Garde : seules les personnes super admin peuvent gerer les utilisateurs.
// La verification se fait en base, pas sur le jeton de session.
async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");
  return admin;
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function createUser(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "USER");

  if (!email || !validEmail(email)) return { error: "Adresse email invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };

  const exists = await prisma.admin.findUnique({ where: { email } });
  if (exists) return { error: "Un compte existe déjà avec cet email." };

  await prisma.admin.create({
    data: {
      email,
      name,
      passwordHash: await hash(password),
      // Role explicite : on ne se repose jamais sur la valeur par defaut.
      role: (role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER") as never,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUser(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireSuperAdmin();

  const id = String(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "USER") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";
  const password = String(formData.get("password") ?? "");

  if (!email || !validEmail(email)) return { error: "Adresse email invalide." };

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) return { error: "Utilisateur introuvable." };

  // Email deja pris par quelqu'un d'autre ?
  const clash = await prisma.admin.findUnique({ where: { email } });
  if (clash && clash.id !== id) return { error: "Cet email est déjà utilisé." };

  // Garde-fou : on ne peut pas se retirer ses propres droits de super admin.
  if (me.id === id && role !== "SUPER_ADMIN") {
    return { error: "Tu ne peux pas retirer tes propres droits de super admin." };
  }

  // Garde-fou : ne jamais laisser la plateforme sans super admin.
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const supers = await prisma.admin.count({ where: { role: "SUPER_ADMIN" } });
    if (supers <= 1) return { error: "Il doit rester au moins un super admin." };
  }

  const data: Record<string, unknown> = { email, name, role };
  if (password) {
    if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };
    data.passwordHash = await hash(password);
  }

  await prisma.admin.update({ where: { id }, data });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(formData: FormData) {
  const me = await requireSuperAdmin();
  const id = String(formData.get("id"));

  // Garde-fou : pas d'auto-suppression (evite de perdre son propre acces).
  if (me.id === id) return;

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) return;

  // Garde-fou : ne jamais supprimer le dernier super admin.
  if (target.role === "SUPER_ADMIN") {
    const supers = await prisma.admin.count({ where: { role: "SUPER_ADMIN" } });
    if (supers <= 1) return;
  }

  await prisma.admin.delete({ where: { id } });
  revalidatePath("/admin/users");
}
