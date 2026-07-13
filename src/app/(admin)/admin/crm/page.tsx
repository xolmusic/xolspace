import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/display";
import { contactTypeLabel, interactionStatusLabel, interactionStatusBadge } from "@/lib/display";
import ContactCreateForm from "./ContactCreateForm";

export default async function CrmPage() {
  const now = new Date();

  const [contacts, dueFollowUps] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { interactions: true } } },
    }),
    // Relances a faire : date de relance passee ou du jour, statut non clos.
    prisma.interaction.findMany({
      where: {
        followUpAt: { lte: now },
        status: { notIn: ["POSITIVE", "NEGATIVE", "NO_REPLY"] },
      },
      orderBy: { followUpAt: "asc" },
      include: { contact: true },
    }),
  ]);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24 }}>CRM</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} · journalistes, radios, curateurs, bookers…
          </p>
        </div>
        <ContactCreateForm />
      </div>

      {/* Relances a faire */}
      {dueFollowUps.length > 0 && (
        <div
          className="card"
          style={{
            borderLeft: "3px solid var(--xol-carmin)",
            background: "#fff8f0",
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 10, color: "var(--xol-carmin)" }}>
            À relancer ({dueFollowUps.length})
          </h2>
          <div className="stack" style={{ gap: 6 }}>
            {dueFollowUps.map((i: (typeof dueFollowUps)[number]) => (
              <Link
                key={i.id}
                href={`/admin/crm/${i.contactId}`}
                className="row"
                style={{ justifyContent: "space-between", padding: "6px 4px", gap: 10 }}
              >
                <span>
                  <span style={{ fontWeight: 500 }}>{i.contact.name}</span>
                  {i.subject && <span className="muted" style={{ fontSize: 13 }}> — {i.subject}</span>}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--xol-carmin)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(i.followUpAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Base de contacts */}
      {contacts.length === 0 ? (
        <div className="card">
          <p className="muted">Aucun contact. Ajoute ton premier contact avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Organisation</th>
                  <th>Pays</th>
                  <th style={{ textAlign: "right" }}>Échanges</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c: (typeof contacts)[number]) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/crm/${c.id}`} className="t-title" style={{ color: "var(--xol-indigo)" }}>
                        {c.name}
                      </Link>
                    </td>
                    <td><span className="badge">{contactTypeLabel[c.type]}</span></td>
                    <td className="t-sub">{c.organization || "—"}</td>
                    <td className="t-sub">{c.country || "—"}</td>
                    <td className="t-sub" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {c._count.interactions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
