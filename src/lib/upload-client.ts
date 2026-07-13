"use client";

// Envoie un fichier directement dans R2 sans passer par Vercel.
// 1) demande une URL signee au serveur (petite requete)
// 2) PUT le fichier vers cette URL (navigateur -> R2, pas de limite 4,5 Mo)
// Retourne l'identifiant de l'audio, a transmettre au server action.
export async function uploadDirect(
  kind: "track" | "demo",
  file: File
): Promise<{ audioId: string; durationSec: number | null }> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type || "audio/mpeg" }),
  });
  if (!res.ok) throw new Error("Autorisation d'upload refusée.");
  const { id, uploadUrl } = await res.json();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "audio/mpeg" },
    body: file,
  });
  if (!put.ok) throw new Error("L'envoi du fichier a échoué.");

  const durationSec = await readDuration(file).catch(() => null);
  return { audioId: id, durationSec };
}

// Lit la duree du MP3 cote navigateur (facultatif, pour l'affichage).
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(audio.duration) ? Math.round(audio.duration) : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}
