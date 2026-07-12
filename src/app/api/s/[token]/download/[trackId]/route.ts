import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveShare, downloadAllowed } from "@/lib/share";
import { getObjectStream } from "@/lib/storage";

// Telechargement public. REGLE D'OR appliquee cote serveur :
// si le lien n'a pas allowDownload = true, on refuse — meme si le bouton
// apparaissait cote client. La securite est dans l'API, pas dans l'UI.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; trackId: string }> }
) {
  const { token, trackId } = await params;
  const pw = req.nextUrl.searchParams.get("pw") ?? undefined;

  const access = await resolveShare(token, pw);
  if (!access.ok) return new Response("Accès refusé", { status: 403 });
  const link = access.link!;

  if (!downloadAllowed(link)) {
    return new Response("Téléchargement non autorisé pour ce lien", { status: 403 });
  }

  // Retrouver le master autorise par ce lien.
  let masterKey: string | null = null;
  let filename = "master.wav";

  if (link.targetType === "DEMO" && link.demo && link.demo.id === trackId) {
    masterKey = link.demo.masterKey;
    filename = `${link.demo.title}.wav`;
  } else if (link.targetType === "TRACK" && link.track && link.track.id === trackId) {
    masterKey = link.track.masterKey;
    filename = `${link.track.title}.wav`;
  } else if (link.targetType === "PROJECT" && link.project) {
    const t = link.project.tracks.find((x: { id: string; streamKey: string | null; masterKey: string; title: string }) => x.id === trackId);
    if (t) {
      masterKey = t.masterKey;
      filename = `${t.title}.wav`;
    }
  } else if (link.targetType === "ARTIST" && link.artist) {
    const d = link.artist.demos.find((x: { id: string; streamKey: string | null; masterKey: string; title: string }) => x.id === trackId);
    if (d) {
      masterKey = d.masterKey;
      filename = `${d.title}.wav`;
    }
  }

  if (!masterKey) return new Response("Introuvable", { status: 404 });

  prisma.playEvent
    .create({ data: { shareLinkId: link.id, trackId, kind: "download" } })
    .catch(() => {});

  try {
    const { body, contentLength } = await getObjectStream(masterKey);
    const safeName = filename.replace(/[^\w.\- ]+/g, "_");
    return new Response(body as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
        ...(contentLength ? { "Content-Length": String(contentLength) } : {}),
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
