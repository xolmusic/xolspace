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

  if (link.targetType === "DEMO" && link.demo && link.demo.id === trackId) {
    audioKey = link.demo.audioKey;
  } else if (link.targetType === "TRACK" && link.track && link.track.id === trackId) {
    audioKey = link.track.audioKey;
  } else if (link.targetType === "PROJECT" && link.project) {
    const t = link.project.tracks.find(
      (x: { id: string; audioKey: string }) => x.id === trackId
    );
    audioKey = t?.audioKey ?? null;
  } else if (link.targetType === "ARTIST" && link.artist) {
    const d = link.artist.demos.find(
      (x: { id: string; audioKey: string }) => x.id === trackId
    );
    audioKey = d?.audioKey ?? null;
  }

  if (!audioKey) return new NextResponse("Introuvable", { status: 404 });

  prisma.playEvent
    .create({ data: { shareLinkId: link.id, trackId, kind: "play" } })
    .catch(() => {});

  const url = await signedGetUrl(audioKey, 3600);
  return NextResponse.redirect(url, 302);
}
