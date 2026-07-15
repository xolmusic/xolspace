import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

// Protection reelle de la section : masquer le lien dans le menu ne suffit
// pas, quelqu'un pourrait saisir l'adresse directement. Toute page sous
// /admin/users passe par ici.
export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");

  return <>{children}</>;
}
