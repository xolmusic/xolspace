import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/money";
import { fmtDate } from "@/lib/display";
import { ensureDefaultCategories, deleteTransaction, duplicateTransaction } from "@/server/finances";
import TransactionForm from "./TransactionForm";
import CategoryManager from "./CategoryManager";
import FinanceSummary from "@/components/FinanceSummary";

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    artistId?: string;
    projectId?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await ensureDefaultCategories();
  const sp = await searchParams;

  // --- Filtres ---
  const where: Record<string, unknown> = {};
  if (sp.type === "EXPENSE" || sp.type === "INCOME") where.type = sp.type;
  if (sp.artistId) where.artistId = sp.artistId;
  if (sp.projectId) where.projectId = sp.projectId;
  if (sp.category) where.category = sp.category;
  if (sp.from || sp.to) {
    const range: Record<string, Date> = {};
    if (sp.from) range.gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.date = range;
  }

  // Debut du mois courant, pour le panneau "Ce mois-ci".
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rows, monthRows, categories, usedRows, artists, projects] = await Promise.all([
    prisma.transaction.findMany({
      where: where as never,
      orderBy: { date: "desc" },
      include: { artist: true, project: true },
      take: 500,
    }),
    prisma.transaction.findMany({
      where: { date: { gte: monthStart } },
      select: { type: true, amount: true },
    }),
    prisma.txCategory.findMany({ orderBy: [{ type: "asc" }, { position: "asc" }] }),
    prisma.transaction.findMany({ select: { category: true, type: true } }),
    prisma.artist.findMany({ orderBy: { stageName: "asc" } }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);

  const sum = (list: { type: string; amount: number }[], t: string) =>
    list.filter((x) => x.type === t).reduce((s, x) => s + x.amount, 0);

  const income = sum(rows, "INCOME");
  const expense = sum(rows, "EXPENSE");
  const monthIncome = sum(monthRows, "INCOME");
  const monthExpense = sum(monthRows, "EXPENSE");

  // Repartition par categorie, sur les ecritures filtrees.
  const byCategory = new Map<string, { income: number; expense: number }>();
  for (const r of rows) {
    const e = byCategory.get(r.category) ?? { income: 0, expense: 0 };
    if (r.type === "INCOME") e.income += r.amount;
    else e.expense += r.amount;
    byCategory.set(r.category, e);
  }
  const catRows = Array.from(byCategory.entries())
    .map(([name, v]) => ({ name, ...v, total: v.income + v.expense }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  const catMax = Math.max(1, ...catRows.map((c) => c.total));

  // Categories deja utilisees : on empeche leur suppression.
  const usedCats = Array.from(
    new Set(
      usedRows.map((r: { category: string; type: string }) => `${r.type}:${r.category}`)
    )
  );

  const artistOpts = artists.map((a: (typeof artists)[number]) => ({ id: a.id, stageName: a.stageName }));
  const projectOpts = projects.map((p: (typeof projects)[number]) => ({ id: p.id, title: p.title, artistId: p.artistId }));
  const catOpts = categories.map((c: (typeof categories)[number]) => ({ name: c.name, type: c.type }));

  // Lien d'export : on repasse les filtres actifs.
  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) exportQs.set(k, String(v));
  const exportUrl = `/api/finances/export${exportQs.toString() ? `?${exportQs}` : ""}`;

  const filtered = Object.values(sp).some(Boolean);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Finances</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Dépenses, entrées et résultat du label — montants en FCFA.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <CategoryManager categories={categories} used={usedCats} />
          <a href={exportUrl} className="btn btn-sm">Export CSV</a>
          <TransactionForm artists={artistOpts} projects={projectOpts} categories={catOpts} />
        </div>
      </div>

      {/* Ce mois-ci — toujours global, independamment des filtres */}
      <section>
        <h2 style={{ fontSize: 15, marginBottom: 10, color: "var(--text-soft)" }}>
          Ce mois-ci ({monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })})
        </h2>
        <FinanceSummary income={monthIncome} expense={monthExpense} />
      </section>

      {/* Filtres */}
      <form method="get" className="card">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="from">Du</label>
            <input id="from" name="from" type="date" className="input" defaultValue={sp.from ?? ""} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="to">Au</label>
            <input id="to" name="to" type="date" className="input" defaultValue={sp.to ?? ""} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="type">Type</label>
            <select id="type" name="type" className="select" defaultValue={sp.type ?? ""}>
              <option value="">Tout</option>
              <option value="EXPENSE">Dépenses</option>
              <option value="INCOME">Entrées</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="artistId">Artiste</label>
            <select id="artistId" name="artistId" className="select" defaultValue={sp.artistId ?? ""}>
              <option value="">Tous</option>
              {artists.map((a: (typeof artists)[number]) => (
                <option key={a.id} value={a.id}>{a.stageName}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="category">Catégorie</label>
            <select id="category" name="category" className="select" defaultValue={sp.category ?? ""}>
              <option value="">Toutes</option>
              {categories.map((c: (typeof categories)[number]) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {filtered && <Link href="/admin/finances" className="btn btn-sm">Réinitialiser</Link>}
          <button type="submit" className="btn btn-sm btn-primary">Appliquer</button>
        </div>
      </form>

      {/* Resultat de la periode filtree */}
      <section>
        <h2 style={{ fontSize: 15, marginBottom: 10, color: "var(--text-soft)" }}>
          {filtered ? "Sélection" : "Depuis le début"} — {rows.length} écriture{rows.length > 1 ? "s" : ""}
        </h2>
        <FinanceSummary income={income} expense={expense} />
      </section>

      {/* Repartition par categorie */}
      {catRows.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, marginBottom: 10, color: "var(--text-soft)" }}>Par catégorie</h2>
          <div className="card">
            <div className="stack" style={{ gap: 10 }}>
              {catRows.map((c) => (
                <div key={c.name}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text-soft)" }}>
                      {c.income > 0 && <span style={{ color: "#1c7a4a" }}>{fmtMoney(c.income)}</span>}
                      {c.income > 0 && c.expense > 0 && " · "}
                      {c.expense > 0 && <span style={{ color: "var(--xol-carmin)" }}>{fmtMoney(c.expense)}</span>}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden", display: "flex" }}>
                    {c.income > 0 && (
                      <div style={{ width: `${(c.income / catMax) * 100}%`, background: "#1c7a4a" }} />
                    )}
                    {c.expense > 0 && (
                      <div style={{ width: `${(c.expense / catMax) * 100}%`, background: "var(--xol-carmin)" }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journal */}
      <section>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Journal</h2>
        {rows.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ fontSize: 14 }}>
              Aucune écriture{filtered ? " pour ces filtres" : ""}.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Libellé</th>
                    <th>Catégorie</th>
                    <th>Artiste</th>
                    <th>Projet</th>
                    <th style={{ textAlign: "right" }}>Montant</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t: (typeof rows)[number]) => (
                    <tr key={t.id}>
                      <td className="t-sub" style={{ whiteSpace: "nowrap" }}>{fmtDate(t.date)}</td>
                      <td>
                        <div className="t-title">{t.label || t.category}</div>
                        {t.counterparty && <div className="t-sub">{t.counterparty}</div>}
                      </td>
                      <td><span className="badge">{t.category}</span></td>
                      <td className="t-sub">{t.artist?.stageName ?? "— Label —"}</td>
                      <td className="t-sub">{t.project?.title ?? "—"}</td>
                      <td
                        style={{
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                          color: t.type === "INCOME" ? "#1c7a4a" : "var(--xol-carmin)",
                        }}
                      >
                        {t.type === "INCOME" ? "+" : "−"} {fmtMoney(t.amount)}
                      </td>
                      <td>
                        <div className="tbl-actions">
                          {t.receiptKey && (
                            <a href={`/api/img/${t.receiptKey}`} target="_blank" rel="noopener noreferrer" className="btn btn-xs" title="Justificatif">
                              Reçu
                            </a>
                          )}
                          <TransactionForm
                            artists={artistOpts}
                            projects={projectOpts}
                            categories={catOpts}
                            tx={{
                              id: t.id,
                              type: t.type,
                              date: new Date(t.date).toISOString().slice(0, 10),
                              amount: t.amount,
                              category: t.category,
                              label: t.label,
                              counterparty: t.counterparty,
                              notes: t.notes,
                              artistId: t.artistId,
                              projectId: t.projectId,
                              receiptKey: t.receiptKey,
                            }}
                            trigger={<button type="button" className="btn btn-xs">Modifier</button>}
                          />
                          <form action={duplicateTransaction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit" className="btn btn-xs" title="Recopier à la date du jour">Dupliquer</button>
                          </form>
                          <form action={deleteTransaction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit" className="btn btn-xs btn-ghost" style={{ color: "var(--xol-carmin)" }}>✕</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {rows.length === 500 && (
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Affichage limité aux 500 écritures les plus récentes — affine les filtres ou utilise l&apos;export CSV.
          </p>
        )}
      </section>
    </div>
  );
}
