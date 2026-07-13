import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="xol-admin-shell">
      <Sidebar />
      <main className="xol-main">
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
