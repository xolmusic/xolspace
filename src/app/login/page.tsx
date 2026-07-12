"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-2)",
        padding: 24,
      }}
    >
      <div className="card" style={{ width: 400, maxWidth: "100%" }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
          <Image
            src="/brand/xol-logo.png"
            alt="XOL Music"
            width={150}
            height={65}
            style={{ height: "auto", width: 150 }}
            priority
          />
        </div>
        <h1 style={{ fontSize: 20, textAlign: "center", marginBottom: 4 }}>
          Catalogue XOL
        </h1>
        <p
          className="muted"
          style={{ textAlign: "center", fontSize: 14, marginBottom: 24 }}
        >
          Espace d&apos;administration du label
        </p>

        <form action={action}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p
              style={{
                color: "var(--xol-carmin)",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
