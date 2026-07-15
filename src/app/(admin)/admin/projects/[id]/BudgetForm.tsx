"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { setProjectBudget } from "@/server/finances";
import { fmtMoney } from "@/lib/money";

export default function BudgetForm({
  projectId,
  budget,
}: {
  projectId: string;
  budget: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setProjectBudget, null);
  const router = useRouter();

  if (state?.ok && open) {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-sm" type="button" onClick={() => setOpen(true)}>
        {budget ? `Budget : ${fmtMoney(budget)}` : "Définir un budget"}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 400, maxWidth: "100%" }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Budget du projet</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Le montant prévu pour ce projet. Les dépenses seront comparées à ce budget.
            </p>
            <form action={action}>
              <input type="hidden" name="id" value={projectId} />
              <div className="field">
                <label htmlFor="budget">Budget (FCFA)</label>
                <input
                  id="budget"
                  name="budget"
                  className="input"
                  inputMode="numeric"
                  defaultValue={budget ?? ""}
                  placeholder="3 000 000"
                />
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Laisse vide pour retirer le budget.
                </p>
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
