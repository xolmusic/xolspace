"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/server/projects";

type Artist = { id: string; stageName: string };
type Existing = {
  id: string;
  title: string;
  type: string;
  status: string;
  genre: string | null;
  catalogRef: string | null;
  upc: string | null;
  notes: string | null;
  releaseDate: string | null;
};

export default function ProjectForm({
  artists,
  defaultArtistId,
  existing,
}: {
  artists: Artist[];
  defaultArtistId?: string;
  existing?: Existing;
}) {
  const editing = !!existing;
  const [state, action, pending] = useActionState(
    editing ? updateProject : createProject,
    null
  );
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  if (editing && state?.ok) router.refresh();

  return (
    <form action={action} className="card">
      {editing && <input type="hidden" name="id" value={existing.id} />}

      <div className="field">
        <label htmlFor="title">Nom du projet *</label>
        <input id="title" name="title" className="input" required defaultValue={existing?.title} />
      </div>

      {!editing && (
        <div className="field">
          <label htmlFor="artistId">Artiste *</label>
          <select id="artistId" name="artistId" className="select" required defaultValue={defaultArtistId ?? ""}>
            <option value="" disabled>
              Choisir un artiste
            </option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stageName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field">
          <label htmlFor="type">Type de projet</label>
          <select id="type" name="type" className="select" defaultValue={existing?.type ?? "SINGLE"}>
            <option value="SINGLE">Single</option>
            <option value="EP">EP</option>
            <option value="ALBUM">Album</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Statut</label>
          <select id="status" name="status" className="select" defaultValue={existing?.status ?? "UNRELEASED"}>
            <option value="UNRELEASED">Non sorti</option>
            <option value="SCHEDULED">Programmé</option>
            <option value="RELEASED">Sorti</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="cover">Cover du projet (1080×1080 recommandé)</label>
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          className="input"
          style={{ paddingTop: 8 }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover", marginTop: 8 }} />
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field">
          <label htmlFor="genre">Genre</label>
          <input id="genre" name="genre" className="input" defaultValue={existing?.genre ?? ""} placeholder="Afro, jazz…" />
        </div>
        <div className="field">
          <label htmlFor="releaseDate">Date de sortie</label>
          <input id="releaseDate" name="releaseDate" type="date" className="input" defaultValue={existing?.releaseDate ?? ""} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field">
          <label htmlFor="catalogRef">Référence catalogue</label>
          <input id="catalogRef" name="catalogRef" className="input" defaultValue={existing?.catalogRef ?? ""} placeholder="XOL-024" />
        </div>
        <div className="field">
          <label htmlFor="upc">Code UPC</label>
          <input id="upc" name="upc" className="input" defaultValue={existing?.upc ?? ""} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes internes</label>
        <textarea id="notes" name="notes" className="textarea" defaultValue={existing?.notes ?? ""} />
      </div>

      {state?.error && (
        <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>{state.error}</p>
      )}
      {editing && state?.ok && (
        <p style={{ color: "#1c7a4a", fontSize: 14, marginBottom: 12 }}>Enregistré.</p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le projet"}
      </button>
    </form>
  );
}
