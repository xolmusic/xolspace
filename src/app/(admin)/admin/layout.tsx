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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface-2)" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "24px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
