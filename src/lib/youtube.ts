// Extrait l'identifiant d'une video YouTube depuis differentes formes d'URL.
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    // formats /embed/ID ou /shorts/ID
    const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}
