"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory } from "@/server/finances";

type Category = { id: string; name: string; type: string };

export default function CategoryManager({
  categories,
  used,
}: {
  categories: Category[];
  // Cles "TYPE:nom" des categories deja utilisees par une ecriture.
  used: string[];
}) {
  const usedSet = new Set(used);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [state, action, pending] = useActionState(createCategory, null);
  const router = useRouter();

  // Rafraichit seulement quand une action vient d'aboutir (et non a
  // chaque rendu, ce qui provoquait des rafraichissements en boucle).
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const list = categories.filter((c) => c.type === tab);

  return (
    <>
      <button className="btn btn-sm" type="button" onClick={() => setOpen(true)}>
        Catégories
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "100%", maxHeight: "88vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Catégories</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Ajoute tes propres catégories librement. Celles déjà utilisées par une écriture ne
              peuvent pas être supprimées — sinon tes analyses passées deviendraient fausses.
            </p>

            <div className="row" style={{ gap: 6, marginBottom: 12 }}>
              <button type="button" className={`btn btn-xs ${tab === "EXPENSE" ? "btn-primary" : ""}`} onClick={() => setTab("EXPENSE")}>
                Dépenses
              </button>
              <button type="button" className={`btn btn-xs ${tab === "INCOME" ? "btn-primary" : ""}`} onClick={() => setTab("INCOME")}>
                Entrées
              </button>
            </div>

            <form action={action} className="row" style={{ gap: 6, marginBottom: 14 }}>
              <input type="hidden" name="type" value={tab} />
              <input name="name" className="input" style={{ flex: 1 }} placeholder="Nouvelle catégorie" required />
              <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
                {pending ? "…" : "Ajouter"}
              </button>
            </form>
            {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 13, marginBottom: 10 }}>{state.error}</p>}

            <div className="stack" style={{ gap: 4 }}>
              {list.map((c) => {
                const inUse = usedSet.has(`${c.type}:${c.name}`);
                return (
                  <div key={c.id} className="row" style={{ justifyContent: "space-between", padding: "4px 2px" }}>
                    <span style={{ fontSize: 14 }}>{c.name}</span>
                    {inUse ? (
                      <span
                        style={{ fontSize: 11, color: "var(--text-mute)" }}
                        title="Cette catégorie est utilisée par des écritures : elle ne peut pas être supprimée."
                      >
                        utilisée
                      </span>
                    ) : (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="btn btn-xs btn-ghost" style={{ color: "var(--text-mute)" }}>✕</button>
                      </form>
                    )}
                  </div>
                );
              })}
              {list.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Aucune catégorie.</p>}
            </div>

            <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-sm" onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
