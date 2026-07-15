import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="xol-admin-shell">
      <Sidebar isSuperAdmin={admin.role === "SUPER_ADMIN"} />
      <main className="xol-main">
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
