"use server";

import { redirect } from "next/navigation";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = await verifyPassword(email, password);
  if (!admin) {
    return { error: "Identifiants incorrects. Réessaie." };
  }
  await createSession(admin.id, admin.email);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
