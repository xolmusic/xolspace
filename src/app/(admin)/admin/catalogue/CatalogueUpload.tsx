"use client";

import { useState } from "react";
import SongUploader from "@/components/SongUploader";

type Artist = { id: string; stageName: string };

export default function CatalogueUpload({ artists }: { artists: Artist[] }) {
  const [open, setOpen] = useState(false);
  const [artistId, setArtistId] = useState("");

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Ajouter un titre
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(33,30,66,0.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: 460, maxWidth: "100%" }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Ajouter un titre au catalogue</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
              Le titre sera rattaché à un artiste, sans projet. Tu pourras l&apos;assigner
              à un projet plus tard en le modifiant.
            </p>

            {artists.length === 0 ? (
              <p className="muted">Crée d&apos;abord un artiste.</p>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="artist">Artiste</label>
                  <select
                    id="artist"
                    className="select"
                    value={artistId}
                    onChange={(e) => setArtistId(e.target.value)}
                  >
                    <option value="">Choisir un artiste</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.stageName}
                      </option>
                    ))}
                  </select>
                </div>

                {artistId && (
                  <div style={{ marginTop: 8 }}>
                    <SongUploader artistId={artistId} variant="drop" />
                  </div>
                )}
              </>
            )}

            <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
