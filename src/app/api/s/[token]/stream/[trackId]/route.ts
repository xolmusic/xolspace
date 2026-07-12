import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveShare } from "@/lib/share";
import { getObjectStream } from "@/lib/storage";

// Streaming public. Le lien est verifie (revoque ? expire ? mot de passe ?)
// AVANT de servir. On ne sert que la version MP3 (streamKey), jamais le master.
// trackId peut designer une piste, une demo ou une piste d'un projet — on
// verifie qu'elle appartient bien a la cible du lien.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; trackId: string }> }
) {
  const { token, trackId } = await params;
  const pw = req.nextUrl.searchParams.get("pw") ?? undefined;

  const access = await resolveShare(token, pw);
  if (!access.ok) return new Response("Accès refusé", { status: 403 });
  const link = access.link!;

  // Determiner la cle de streaming autorisee par ce lien.
  let streamKey: string | null = null;

  if (link.targetType === "DEMO" && link.demo && link.demo.id === trackId) {
    streamKey = link.demo.streamKey;
  } else if (link.targetType === "TRACK" && link.track && link.track.id === trackId) {
    streamKey = link.track.streamKey;
  } else if (link.targetType === "PROJECT" && link.project) {
    const t = link.project.tracks.find((x: { id: string; streamKey: string | null; masterKey: string; title: string }) => x.id === trackId);
    streamKey = t?.streamKey ?? null;
  } else if (link.targetType === "ARTIST" && link.artist) {
    const d = link.artist.demos.find((x: { id: string; streamKey: string | null; masterKey: string; title: string }) => x.id === trackId);
    streamKey = d?.streamKey ?? null;
  }

  if (!streamKey) return new Response("Introuvable", { status: 404 });

  // Journaliser l'ecoute (analytics, base de la V1.5).
  prisma.playEvent
    .create({ data: { shareLinkId: link.id, trackId, kind: "play" } })
    .catch(() => {});

  try {
    const { body, contentLength } = await getObjectStream(streamKey);
    return new Response(body as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        ...(contentLength ? { "Content-Length": String(contentLength) } : {}),
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
