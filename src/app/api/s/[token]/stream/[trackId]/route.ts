import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveShare } from "@/lib/share";
import { signedGetUrl } from "@/lib/storage";

// Streaming public. On verifie le lien (revoque ? expire ? mot de passe ?),
// puis on redirige le lecteur audio vers une URL signee courte duree :
// le son est servi directement par R2, sans transiter par Vercel.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; trackId: string }> }
) {
  const { token, trackId } = await params;
  const pw = req.nextUrl.searchParams.get("pw") ?? undefined;

  const access = await resolveShare(token, pw);
  if (!access.ok) return new NextResponse("Accès refusé", { status: 403 });
  const link = access.link!;

  let audioKey: string | null = null;

  if (link.targetType === "TRACK" && link.track && link.track.id === trackId) {
    audioKey = link.track.audioKey;
  } else if (link.targetType === "PROJECT" && link.project) {
    const t = link.project.tracks.find(
      (x: { id: string; audioKey: string }) => x.id === trackId
    );
    audioKey = t?.audioKey ?? null;
  } else if (link.targetType === "ARTIST" && link.artist) {
    const t = link.artist.tracks.find(
      (x: { id: string; audioKey: string }) => x.id === trackId
    );
    audioKey = t?.audioKey ?? null;
  } else if (link.targetType === "EPK" && link.epk) {
    // Un titre est autorise s'il est reference par l'EPK, soit directement,
    // soit via un projet selectionne. On verifie l'appartenance en base.
    const directTrackIds = link.epk.items
      .map((it: { trackId: string | null }) => it.trackId)
      .filter((x: string | null): x is string => !!x);
    const projectIds = link.epk.items
      .map((it: { projectId: string | null }) => it.projectId)
      .filter((x: string | null): x is string => !!x);

    if (directTrackIds.includes(trackId)) {
      const t = await prisma.track.findUnique({ where: { id: trackId } });
      audioKey = t?.audioKey ?? null;
    } else if (projectIds.length) {
      const t = await prisma.track.findFirst({
        where: { id: trackId, projectId: { in: projectIds } },
      });
      audioKey = t?.audioKey ?? null;
    }
  }

  if (!audioKey) return new NextResponse("Introuvable", { status: 404 });

  prisma.playEvent
    .create({ data: { shareLinkId: link.id, trackId, kind: "play" } })
    .catch(() => {});

  const url = await signedGetUrl(audioKey, 3600);
  return NextResponse.redirect(url, 302);
}
