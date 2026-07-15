import { fmtMoney, fmtSigned } from "@/lib/money";

// Bloc de synthese : entrees, depenses, resultat, et barre de budget
// optionnelle (pour les projets). Purement presentationnel.
export default function FinanceSummary({
  income,
  expense,
  budget,
  compact,
}: {
  income: number;
  expense: number;
  budget?: number | null;
  compact?: boolean;
}) {
  const result = income - expense;
  const over = budget != null && budget > 0 && expense > budget;
  const pct = budget != null && budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${compact ? 110 : 130}px, 1fr))`, gap: 10 }}
      >
        <Tile label="Entrées" value={fmtMoney(income)} color="#1c7a4a" />
        <Tile label="Dépenses" value={fmtMoney(expense)} color="var(--xol-carmin)" />
        <Tile
          label="Résultat"
          value={fmtSigned(result)}
          color={result >= 0 ? "#1c7a4a" : "var(--xol-carmin)"}
          strong
        />
        {budget != null && budget > 0 && <Tile label="Budget" value={fmtMoney(budget)} />}
      </div>

      {budget != null && budget > 0 && (
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-soft)" }}>
              Budget consommé — {pct}%
            </span>
            {over && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--xol-carmin)" }}>
                Dépassement de {fmtMoney(expense - budget)}
              </span>
            )}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--surface-3)", overflow: "hidden" }}>
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: over ? "var(--xol-carmin)" : "var(--xol-indigo)",
                transition: "width .2s",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) {
  return (
    <div className="card" style={{ padding: 12, textAlign: "center" }}>
      <div
        style={{
          fontSize: strong ? 19 : 17,
          fontFamily: "var(--font-title)",
          fontWeight: strong ? 700 : 600,
          color: color ?? "var(--xol-indigo)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
