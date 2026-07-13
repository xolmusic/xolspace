import PublicPlayer from "@/components/PublicPlayer";
import { youtubeId } from "@/lib/youtube";
import { signedGetUrl } from "@/lib/storage";
import { fmtDuration } from "@/lib/display";
import {
  InstagramIcon,
  TikTokIcon,
  FacebookIcon,
  SpotifyIcon,
  AppleMusicIcon,
} from "@/components/SocialIcons";

type MusicItem = { id: string; title: string; subtitle?: string };

export default async function EpkPublic({
  token,
  password,
  epk,
  music,
}: {
  token: string;
  password?: string;
  epk: {
    tagline: string | null;
    bio: string | null;
    facebook: string | null;
    tiktok: string | null;
    instagram: string | null;
    spotify: string | null;
    appleMusic: string | null;
    bookingEmail: string | null;
    artist: { stageName: string; country: string | null };
    photos: { id: string; imageKey: string }[];
    videos: { id: string; url: string; title: string | null }[];
  };
  music: MusicItem[];
}) {
  // URLs signees pour les photos (lecture directe R2).
  const photoUrls = await Promise.all(
    epk.photos.map(async (p) => ({ id: p.id, url: await signedGetUrl(p.imageKey, 3600) }))
  );

  const socials = [
    { label: "Instagram", url: epk.instagram, Icon: InstagramIcon },
    { label: "TikTok", url: epk.tiktok, Icon: TikTokIcon },
    { label: "Facebook", url: epk.facebook, Icon: FacebookIcon },
    { label: "Spotify", url: epk.spotify, Icon: SpotifyIcon },
    { label: "Apple Music", url: epk.appleMusic, Icon: AppleMusicIcon },
  ].filter((s) => s.url);

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 34 }}>{epk.artist.stageName}</h1>
        {epk.tagline && (
          <p
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "var(--text-soft)",
              marginTop: 8,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.4,
            }}
          >
            {epk.tagline}
          </p>
        )}
      </div>

      {photoUrls.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: photoUrls.length === 1 ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {photoUrls.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
          ))}
        </div>
      )}

      {epk.bio && (
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Biographie</h2>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{epk.bio}</p>
        </section>
      )}

      {music.length > 0 && (
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Musique</h2>
          <PublicPlayer token={token} password={password} items={music} />
        </section>
      )}

      {epk.videos.length > 0 && (
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Vidéos</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {epk.videos.map((v) => {
              const id = youtubeId(v.url);
              if (!id) return null;
              return (
                <div key={v.id}>
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 10, overflow: "hidden" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${id}`}
                      title={v.title ?? "Vidéo"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                    />
                  </div>
                  {v.title && <p style={{ fontSize: 13, marginTop: 6, color: "var(--text-soft)" }}>{v.title}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(socials.length > 0 || epk.bookingEmail) && (
        <section style={{ textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          {socials.length > 0 && (
            <div className="row" style={{ gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              {socials.map(({ label, url, Icon }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  style={{ display: "inline-flex", transition: "transform 0.12s" }}
                >
                  <Icon size={30} />
                </a>
              ))}
            </div>
          )}
          {epk.bookingEmail && (
            <p style={{ fontSize: 14 }}>
              Booking / management :{" "}
              <a href={`mailto:${epk.bookingEmail}`} style={{ color: "var(--xol-indigo)", fontWeight: 500 }}>
                {epk.bookingEmail}
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export function buildEpkMusic(
  items: { trackId: string | null; projectId: string | null }[],
  tracksById: Map<string, { id: string; title: string; durationSec: number | null }>,
  projectsById: Map<string, { tracks: { id: string; title: string; durationSec: number | null; position: number }[] }>
): MusicItem[] {
  const out: MusicItem[] = [];
  for (const it of items) {
    if (it.trackId) {
      const t = tracksById.get(it.trackId);
      if (t) out.push({ id: t.id, title: t.title, subtitle: fmtDuration(t.durationSec) });
    } else if (it.projectId) {
      const p = projectsById.get(it.projectId);
      if (p) {
        for (const t of [...p.tracks].sort((a, b) => a.position - b.position)) {
          out.push({ id: t.id, title: t.title, subtitle: fmtDuration(t.durationSec) });
        }
      }
    }
  }
  return out;
}
