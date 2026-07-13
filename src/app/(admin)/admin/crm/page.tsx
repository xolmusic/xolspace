import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/display";
import { contactTypeLabel, CONTACT_TYPES } from "@/lib/display";
import ContactCreateForm from "./ContactCreateForm";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; country?: string }>;
}) {
  const { type, country } = await searchParams;
  const now = new Date();

  const contactWhere: Record<string, unknown> = {};
  if (type) contactWhere.type = type;
  if (country) contactWhere.country = country;

  const [contacts, dueFollowUps, allForFacets] = await Promise.all([
    prisma.contact.findMany({
      where: contactWhere as never,
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
    prisma.contact.findMany({ select: { type: true, country: true } }),
  ]);

  // Pays reellement presents dans la base, pour le filtre.
  const usedCountries = Array.from(
    new Set(
      allForFacets
        .map((c: { country: string | null }) => c.country)
        .filter((x: string | null): x is string => !!x)
    )
  ).sort();

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

      <div className="stack" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-mute)", marginRight: 2 }}>Type :</span>
          <FilterChip label="Tous" href={buildHref(null, country)} active={!type} />
          {CONTACT_TYPES.map((t) => (
            <FilterChip key={t} label={contactTypeLabel[t]} href={buildHref(t, country)} active={type === t} />
          ))}
        </div>
        {usedCountries.length > 0 && (
          <div className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-mute)", marginRight: 2 }}>Pays :</span>
            <FilterChip label="Tous" href={buildHref(type, null)} active={!country} />
            {usedCountries.map((c: string) => (
              <FilterChip key={c} label={c} href={buildHref(type, c)} active={country === c} />
            ))}
          </div>
        )}
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

function buildHref(type: string | null | undefined, country: string | null | undefined) {
  const p = new URLSearchParams();
  if (type) p.set("type", type);
  if (country) p.set("country", country);
  const qs = p.toString();
  return qs ? `/admin/crm?${qs}` : "/admin/crm";
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a href={href} className={`btn btn-xs ${active ? "btn-primary" : ""}`}>
      {label}
    </a>
  );
}
