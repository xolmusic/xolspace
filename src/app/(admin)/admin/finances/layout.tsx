import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

// Protection reelle de la section : masquer le lien du menu ne suffit pas,
// l'adresse pourrait etre saisie directement. Toute page sous
// /admin/finances passe par ici.
export default async function FinancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");

  return <>{children}</>;
}
