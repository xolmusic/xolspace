"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveEpkInfo } from "@/server/epk";

type Info = {
  id: string;
  bio: string | null;
  tagline: string | null;
  facebook: string | null;
  tiktok: string | null;
  instagram: string | null;
  spotify: string | null;
  appleMusic: string | null;
  bookingEmail: string | null;
};

export default function EpkInfoForm({ info }: { info: Info }) {
  const [state, action, pending] = useActionState(saveEpkInfo, null);
  const router = useRouter();
  // Rafraichit seulement quand une action vient d'aboutir (et non a
  // chaque rendu, ce qui provoquait des rafraichissements en boucle).
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="card">
      <input type="hidden" name="epkId" value={info.id} />

      <div className="field">
        <label htmlFor="tagline">Accroche (une phrase)</label>
        <input id="tagline" name="tagline" className="input" defaultValue={info.tagline ?? ""} placeholder="Voix soul afro, entre Dakar et le monde" />
      </div>

      <div className="field">
        <label htmlFor="bio">Bio (spécifique à l&apos;EPK)</label>
        <textarea id="bio" name="bio" className="textarea" style={{ minHeight: 160 }} defaultValue={info.bio ?? ""} />
      </div>

      <h3 style={{ fontSize: 15, margin: "8px 0 10px" }}>Réseaux &amp; contacts</h3>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field">
          <label htmlFor="instagram">Instagram</label>
          <input id="instagram" name="instagram" className="input" defaultValue={info.instagram ?? ""} placeholder="https://instagram.com/…" />
        </div>
        <div className="field">
          <label htmlFor="tiktok">TikTok</label>
          <input id="tiktok" name="tiktok" className="input" defaultValue={info.tiktok ?? ""} placeholder="https://tiktok.com/@…" />
        </div>
        <div className="field">
          <label htmlFor="facebook">Facebook</label>
          <input id="facebook" name="facebook" className="input" defaultValue={info.facebook ?? ""} placeholder="https://facebook.com/…" />
        </div>
        <div className="field">
          <label htmlFor="spotify">Spotify</label>
          <input id="spotify" name="spotify" className="input" defaultValue={info.spotify ?? ""} placeholder="https://open.spotify.com/artist/…" />
        </div>
        <div className="field">
          <label htmlFor="appleMusic">Apple Music</label>
          <input id="appleMusic" name="appleMusic" className="input" defaultValue={info.appleMusic ?? ""} placeholder="https://music.apple.com/…" />
        </div>
        <div className="field">
          <label htmlFor="bookingEmail">Email booking / management</label>
          <input id="bookingEmail" name="bookingEmail" type="email" className="input" defaultValue={info.bookingEmail ?? ""} placeholder="booking@…" />
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        {state?.ok && <span style={{ color: "#1c7a4a", fontSize: 14 }}>Enregistré</span>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les infos"}
        </button>
      </div>
    </form>
  );
}
