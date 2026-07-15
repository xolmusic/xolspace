import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// Export CSV du journal, en respectant les filtres actifs.
// Format pensé pour un comptable : une ligne par écriture, montants en FCFA.
export async function GET(req: NextRequest) {
  // Donnees financieres : super admin uniquement.
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  if (sp.get("type")) where.type = sp.get("type");
  if (sp.get("artistId")) where.artistId = sp.get("artistId");
  if (sp.get("projectId")) where.projectId = sp.get("projectId");
  if (sp.get("category")) where.category = sp.get("category");

  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.date = range;
  }

  const rows = await prisma.transaction.findMany({
    where: where as never,
    orderBy: { date: "desc" },
    include: { artist: true, project: true },
  });

  // Echappement CSV : guillemets doubles autour, guillemets internes doubles.
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    "Date", "Type", "Catégorie", "Libellé", "Tiers",
    "Artiste", "Projet", "Montant (FCFA)", "Justificatif", "Notes",
  ];

  const lines = [header.map(esc).join(";")];
  for (const t of rows) {
    lines.push([
      esc(new Date(t.date).toISOString().slice(0, 10)),
      esc(t.type === "INCOME" ? "Entrée" : "Dépense"),
      esc(t.category),
      esc(t.label),
      esc(t.counterparty),
      esc(t.artist?.stageName),
      esc(t.project?.title),
      // Les depenses en negatif : le total de la colonne donne le resultat.
      esc(t.type === "INCOME" ? t.amount : -t.amount),
      esc(t.receiptKey ? "oui" : ""),
      esc(t.notes),
    ].join(";"));
  }

  // BOM UTF-8 : sans lui, Excel affiche mal les accents.
  const csv = "\uFEFF" + lines.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="xol-finances-${today}.csv"`,
    },
  });
}
