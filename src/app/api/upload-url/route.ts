import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signedPutUrl, keys } from "@/lib/storage";
import { createId } from "@/lib/id";

// Le navigateur demande ici une autorisation d'upload (petite requete).
// On renvoie une URL signee vers laquelle il enverra le MP3 directement,
// sans que le fichier passe par Vercel. Reserve aux admins connectes.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { kind, contentType } = await req.json();
  if (kind !== "track" && kind !== "demo") {
    return new NextResponse("Type invalide", { status: 400 });
  }

  // On genere l'identifiant du futur enregistrement cote serveur pour
  // construire une cle R2 stable, puis on le renvoie au client.
  const id = createId();
  const key = kind === "track" ? keys.trackAudio(id) : keys.demoAudio(id);
  const uploadUrl = await signedPutUrl(key, contentType || "audio/mpeg");

  return NextResponse.json({ id, key, uploadUrl });
}
