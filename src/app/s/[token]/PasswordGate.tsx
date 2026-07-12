"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordGate({ wrong }: { wrong?: boolean }) {
  const [pw, setPw] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("pw", pw);
    router.push(url.pathname + url.search);
  }

  return (
    <form onSubmit={submit} style={{ width: 360, maxWidth: "100%" }}>
      <div className="field">
        <label htmlFor="pw">Ce lien est protégé par un mot de passe</label>
        <input
          id="pw"
          type="password"
          className="input"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
      </div>
      {wrong && (
        <p style={{ color: "var(--xol-carmin)", fontSize: 14, marginBottom: 12 }}>
          Mot de passe incorrect.
        </p>
      )}
      <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        Accéder
      </button>
    </form>
  );
}
