import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signedGetUrl } from "@/lib/storage";

// Previsualisation audio dans le back-office. Reserve aux admins.
// Redirige vers une URL signee R2 (lecture directe depuis R2).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { kind, id } = await params;
  let audioKey: string | null = null;

  if (kind === "track") {
    const t = await prisma.track.findUnique({ where: { id } });
    audioKey = t?.audioKey ?? null;
  }

  if (!audioKey) return new NextResponse("Not found", { status: 404 });

  const url = await signedGetUrl(audioKey, 3600);
  return NextResponse.redirect(url, 302);
}
