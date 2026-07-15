import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { fmtDate } from "@/lib/display";
import { deleteUser } from "@/server/users";
import UserCreateForm from "./UserCreateForm";
import UserEditForm from "./UserEditForm";

export default async function UsersPage() {
  const me = await getCurrentAdmin();
  const users = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const superCount = users.filter((u: (typeof users)[number]) => u.role === "SUPER_ADMIN").length;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Utilisateurs</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Gère les accès à la plateforme. Cette page n&apos;est visible que par les super admins.
          </p>
        </div>
        <UserCreateForm />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: (typeof users)[number]) => {
                const isMe = me?.id === u.id;
                const lastSuper = u.role === "SUPER_ADMIN" && superCount <= 1;
                return (
                  <tr key={u.id}>
                    <td className="t-title">
                      {u.name || "—"}
                      {isMe && <span className="badge" style={{ marginLeft: 6 }}>Moi</span>}
                    </td>
                    <td className="t-sub">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === "SUPER_ADMIN" ? "badge-green" : "badge-yellow"}`}>
                        {u.role === "SUPER_ADMIN" ? "Super admin" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="t-sub">{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="tbl-actions">
                        <UserEditForm
                          user={{ id: u.id, email: u.email, name: u.name, role: u.role }}
                          isMe={isMe}
                        />
                        {!isMe && !lastSuper && (
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button
                              className="btn btn-xs btn-ghost"
                              type="submit"
                              style={{ color: "var(--xol-carmin)" }}
                            >
                              Supprimer
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="card"
        style={{ background: "#fff8f0", borderLeft: "3px solid var(--xol-yellow-deep)" }}
      >
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          <strong>Deux niveaux d&apos;accès.</strong> Un <em>utilisateur</em> accède à tout le
          back-office — catalogue, artistes, projets, EPK, liens, CRM, campagnes — mais ne voit
          pas cette page et ne peut pas gérer les comptes. Un <em>super admin</em> a l&apos;accès
          total, y compris ici.
        </p>
      </div>
    </div>
  );
}
