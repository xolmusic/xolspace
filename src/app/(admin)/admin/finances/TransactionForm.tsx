"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/server/finances";

type Artist = { id: string; stageName: string };
type Project = { id: string; title: string; artistId: string };
type Category = { name: string; type: string };

export type TxDraft = {
  id: string;
  type: string;
  date: string;
  amount: number;
  category: string;
  label: string | null;
  counterparty: string | null;
  notes: string | null;
  artistId: string | null;
  projectId: string | null;
  receiptKey: string | null;
};

export default function TransactionForm({
  artists,
  projects,
  categories,
  tx,
  trigger,
  defaultType = "EXPENSE",
  fixedArtistId,
  fixedProjectId,
}: {
  artists: Artist[];
  projects: Project[];
  categories: Category[];
  tx?: TxDraft;
  trigger?: React.ReactNode;
  defaultType?: string;
  fixedArtistId?: string;
  fixedProjectId?: string;
}) {
  const editing = !!tx;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(tx?.type ?? defaultType);
  const [artistId, setArtistId] = useState(tx?.artistId ?? fixedArtistId ?? "");
  const [receipt, setReceipt] = useState<{ id: string; ext: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState(
    editing ? updateTransaction : createTransaction,
    null
  );
  const router = useRouter();

  if (state?.ok && open) {
    setOpen(false);
    setReceipt(null);
    router.refresh();
  }

  const cats = categories.filter((c) => c.type === type);
  const artistProjects = projects.filter((p) => !artistId || p.artistId === artistId);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const res = await fetch("/api/receipt-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, ext }),
      });
      if (!res.ok) throw new Error("Autorisation refusée.");
      const { id, ext: safeExt, uploadUrl } = await res.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error("Envoi échoué.");
      setReceipt({ id, ext: safeExt, name: file.name });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Échec.");
    }
    setUploading(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ display: "inline-flex" }}>
        {trigger ?? (
          <button className="btn btn-primary" type="button">
            + Nouvelle écriture
          </button>
        )}
      </span>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 520, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>
              {editing ? "Modifier l'écriture" : "Nouvelle écriture"}
            </h2>
            <form action={action}>
              {editing && <input type="hidden" name="id" value={tx.id} />}

              {/* Type */}
              <div className="field">
                <label>Type *</label>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${type === "EXPENSE" ? "btn-primary" : ""}`}
                    onClick={() => setType("EXPENSE")}
                  >
                    Dépense
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${type === "INCOME" ? "btn-primary" : ""}`}
                    onClick={() => setType("INCOME")}
                  >
                    Entrée
                  </button>
                </div>
                <input type="hidden" name="type" value={type} />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="amount">Montant (FCFA) *</label>
                  <input
                    id="amount"
                    name="amount"
                    className="input"
                    inputMode="numeric"
                    defaultValue={tx?.amount ?? ""}
                    placeholder="150 000"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="date">Date *</label>
                  <input id="date" name="date" type="date" className="input" defaultValue={tx?.date ?? today} required />
                </div>
              </div>

              <div className="field">
                <label htmlFor="category">Catégorie *</label>
                <select id="category" name="category" className="select" defaultValue={tx?.category ?? ""} required>
                  <option value="">Choisir…</option>
                  {cats.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="label">Libellé</label>
                <input id="label" name="label" className="input" defaultValue={tx?.label ?? ""} placeholder="Séance studio, clip, loyer bureau…" />
              </div>

              <div className="field">
                <label htmlFor="counterparty">
                  {type === "EXPENSE" ? "Fournisseur" : "Payeur / source"}
                </label>
                <input id="counterparty" name="counterparty" className="input" defaultValue={tx?.counterparty ?? ""} />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="artistId">Artiste</label>
                  <select
                    id="artistId"
                    name="artistId"
                    className="select"
                    value={artistId}
                    onChange={(e) => setArtistId(e.target.value)}
                    disabled={!!fixedArtistId}
                  >
                    <option value="">— Label (frais généraux) —</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>{a.stageName}</option>
                    ))}
                  </select>
                  {fixedArtistId && <input type="hidden" name="artistId" value={fixedArtistId} />}
                </div>
                <div className="field">
                  <label htmlFor="projectId">Projet</label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="select"
                    defaultValue={tx?.projectId ?? fixedProjectId ?? ""}
                    disabled={!!fixedProjectId}
                  >
                    <option value="">— Aucun —</option>
                    {artistProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  {fixedProjectId && <input type="hidden" name="projectId" value={fixedProjectId} />}
                </div>
              </div>

              {/* Justificatif */}
              <div className="field">
                <label>Justificatif (facture, reçu)</label>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Envoi…" : receipt ? "Remplacer" : "Joindre un fichier"}
                  </button>
                  {receipt && <span style={{ fontSize: 13, color: "#1c7a4a" }}>{receipt.name} ✓</span>}
                  {!receipt && tx?.receiptKey && (
                    <a href={`/api/img/${tx.receiptKey}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--xol-indigo)" }}>
                      Justificatif actuel ↗
                    </a>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {receipt && (
                  <>
                    <input type="hidden" name="receiptId" value={receipt.id} />
                    <input type="hidden" name="receiptExt" value={receipt.ext} />
                  </>
                )}
                {uploadError && <p style={{ color: "var(--xol-carmin)", fontSize: 13, marginTop: 6 }}>{uploadError}</p>}
              </div>

              <div className="field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" className="textarea" defaultValue={tx?.notes ?? ""} />
              </div>

              {state?.error && <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>}

              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={pending || uploading}>
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
