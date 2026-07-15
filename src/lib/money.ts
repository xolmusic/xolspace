// Le franc CFA (XOF) n'a pas de decimales : les montants sont des entiers.
// On ne manipule donc jamais de nombre a virgule — aucun risque d'arrondi.

export function fmtMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  // Espace insecable fine comme separateur de milliers (usage francais).
  const n = Math.round(amount);
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${sign}${digits} FCFA`;
}

// Montant signe, pour les resultats (+ / -).
export function fmtSigned(amount: number): string {
  const s = fmtMoney(Math.abs(amount));
  return amount < 0 ? `- ${s}` : `+ ${s}`;
}

// Lit un montant saisi par l'utilisateur : accepte "1 200", "1.200", "1200".
// Retourne un entier positif, ou null si invalide.
export function parseMoney(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  // On retire tout ce qui n'est pas un chiffre (espaces, points, virgules).
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}
