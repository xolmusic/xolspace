"use client";

import { useState } from "react";
import ProjectForm from "../ProjectForm";

type Project = {
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

export default function ProjectEditPanel({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)} type="button">
        Modifier
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
            style={{ width: 640, maxWidth: "100%", maxHeight: "92vh", overflow: "auto" }}
          >
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, color: "#fff" }}>Modifier le projet</h2>
              <button className="btn btn-sm" onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>
            <ProjectForm artists={[]} existing={project} />
          </div>
        </div>
      )}
    </>
  );
}
