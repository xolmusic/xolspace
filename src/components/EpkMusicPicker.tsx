"use client";

import { useState } from "react";
import { addEpkItem } from "@/server/epk";

type Track = { id: string; title: string; artistName: string };
type Project = { id: string; title: string; artistName: string };

export default function EpkMusicPicker({
  epkId,
  tracks,
  projects,
}: {
  epkId: string;
  tracks: Track[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"track" | "project">("track");

  return (
    <>
      <button className="btn btn-sm" type="button" onClick={() => setOpen(true)}>
        + Ajouter de la musique
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,66,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 520, maxWidth: "100%", maxHeight: "88vh", overflow: "auto" }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Ajouter à l&apos;EPK</h2>

            <div className="row" style={{ gap: 6, marginBottom: 14 }}>
              <button className={`btn btn-xs ${tab === "track" ? "btn-primary" : ""}`} onClick={() => setTab("track")} type="button">
                Titres
              </button>
              <button className={`btn btn-xs ${tab === "project" ? "btn-primary" : ""}`} onClick={() => setTab("project")} type="button">
                Projets
              </button>
            </div>

            <div className="stack" style={{ gap: 6 }}>
              {(tab === "track" ? tracks : projects).map((item) => (
                <form key={item.id} action={addEpkItem}>
                  <input type="hidden" name="epkId" value={epkId} />
                  <input type="hidden" name="kind" value={tab} />
                  <input type="hidden" name="refId" value={item.id} />
                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{ width: "100%", justifyContent: "space-between" }}
                    onClick={() => setTimeout(() => setOpen(false), 100)}
                  >
                    <span>{item.title}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{item.artistName}</span>
                  </button>
                </form>
              ))}
              {(tab === "track" ? tracks : projects).length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>Rien à ajouter ici.</p>
              )}
            </div>

            <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn btn-sm" onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
